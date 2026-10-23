(function () {
  "use strict";

  var TRIALS = "Clinical Trials & Experimental Opportunities";
  var articles = [];
  var articlesReady = false;
  var careResources = [];
  var careResourcesLoaded = false;
  var careResourceError = false;
  var sortMode = "relevance";
  var query = "";
  var publicationWindow = "all";
  var humanOnly = false;
  var savedOnly = false;
  var savedIds = [];
  try { var stored = JSON.parse(localStorage.getItem("rt-saved-stories") || "[]"); if (Array.isArray(stored)) { savedIds = stored.filter(function (id) { return typeof id === "string"; }); } } catch (e) { /* Reading works without storage. */ }

  var openEntries = {};
  var centerTimer = null;
  var REDUCED_MOTION = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var CLOSE_HTML =
    '<button type="button" class="scroll-close" aria-label="Close the scroll">' +
      '<span class="scroll-close-emblem" aria-hidden="true"></span>' +
    "</button>";

  var contentEl = document.getElementById("content");
  var navEl = document.getElementById("jump-nav");
  var countEl = document.getElementById("result-count");
  var searchInput = document.getElementById("q");
  var relevanceBtn = document.getElementById("sort-relevance");
  var newestBtn = document.getElementById("sort-newest");
  var finderGroupsEl = document.getElementById("finder-groups");
  var finderStatusEl = document.getElementById("finder-status");
  var finderClearBtn = document.getElementById("finder-clear");

  // Topic filter. Values people look for are always offered, even before any story has them.
  var FILTER_GROUPS = [
    { key: "body_area", label: "Body area" },
    { key: "cause", label: "Cause" },
    { key: "approach", label: "Approach" },
    { key: "stage", label: "Stage" }
  ];
  var VOCAB = {
    body_area: ["Brain", "Neck spine", "Back spine", "Spine", "Nerve root", "Peripheral nerve", "Arm", "Hand", "Leg", "Face", "Eye"],
    cause: ["Trauma", "Brain tumor", "Spine tumor", "Stroke", "Diabetes", "Chemotherapy", "Disease", "Surgery", "Nerve gap", "Any cause"],
    approach: ["Drug", "Stem cells", "Scaffold", "Nerve transfer", "Stimulation", "Surgery", "Device", "Rehab", "Review", "Assessment", "Cell therapy", "Gene therapy"],
    stage: ["Lab study", "Animal study", "Human study", "Human trial", "Recruiting trial", "Approved", "Review"]
  };
  var HASH_KEYS = {
    body_area: "body_area", body: "body_area", area: "body_area",
    cause: "cause",
    approach: "approach", treatment: "approach",
    stage: "stage"
  };
  var filters = emptyFilters();

  document.getElementById("dateline").textContent = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  document.getElementById("search-form").addEventListener("submit", function (event) {
    event.preventDefault();
  });

  searchInput.addEventListener("input", function () {
    query = searchInput.value;
    writeHash();
    render();
  });

  navEl.addEventListener("click", function (event) {
    if (event.target.closest('a[href="#share"]')) {
      var box = document.getElementById("share");
      if (box) {
        box.open = true;
      }
    }
  });

  relevanceBtn.addEventListener("click", function () {
    setSort("relevance");
  });

  newestBtn.addEventListener("click", function () {
    setSort("newest");
  });

  function setSort(mode) {
    sortMode = mode;
    relevanceBtn.setAttribute("aria-pressed", mode === "relevance" ? "true" : "false");
    newestBtn.setAttribute("aria-pressed", mode === "newest" ? "true" : "false");
    render();
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function slug(value) {
    return String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function formatDate(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      return iso || "";
    }
    var parts = iso.split("-");
    var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  }

  function formatShortDate(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      return iso || "";
    }
    var parts = iso.split("-");
    var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  function normalizeSearch(text) {
    return String(text || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
      .replace(/tumours?/g, "tumor").replace(/tumors/g, "tumor")
      .replace(/\b(weakness|paresis|hemiparesis|hemiplegia|paralysis|paralyzed|paralysed)\b/g, "weak")
      .replace(/\b(dexterity|coordination|coordinated|clumsy|clumsiness)\b/g, "dexterity")
      .replace(/\b(rehabilitation|rehab|occupational therapy|physiotherapy|physical therapy)\b/g, "rehab")
      .replace(/\b(clenches|clenching|clenched)\b/g, "clench")
      .replace(/\b(fingers|finger|hands)\b/g, "hand")
      .replace(/\b(repairing|repaired|regeneration|regenerative|regrowth)\b/g, "repair")
      .replace(/[^a-z0-9]+/g, " ").trim();
  }
  function searchTerms(needle) {
    return normalizeSearch(needle).split(/\s+/).filter(function (word) {
      return word && ["a", "an", "the", "and", "or", "for", "of", "in", "on", "to", "after", "with", "my", "i", "have", "having", "how", "can", "help", "me", "is", "from"].indexOf(word) === -1;
    });
  }
  function matches(article, needle) {
    var terms = searchTerms(needle);
    var haystack = normalizeSearch([article.title, article.quick_read, article.summary, article.source, article.category, article.why_it_matters, article.evidence_level].concat(tagList(article)).join(" "));
    return terms.every(function (term) { return haystack.indexOf(term) !== -1; });
  }
  function passesReadingOptions(article) {
    if (savedOnly && savedIds.indexOf(article.id) === -1) { return false; }
    if (humanOnly && ["Lab study", "Animal study"].indexOf(article.tags.stage) !== -1) { return false; }
    if (publicationWindow !== "all") {
      var cutoff = new Date(); cutoff.setHours(0, 0, 0, 0); cutoff.setDate(cutoff.getDate() - Number(publicationWindow));
      if (new Date(article.date_published + "T12:00:00") < cutoff) { return false; }
    }
    return true;
  }
  function hasReadingOptions() { return savedOnly || humanOnly || publicationWindow !== "all"; }
  function announce(message) { document.getElementById("reader-feedback").textContent = message; }
  function saveStory(id) {
    var at = savedIds.indexOf(id);
    if (at === -1) { savedIds.push(id); } else { savedIds.splice(at, 1); }
    var persistent = true;
    try { localStorage.setItem("rt-saved-stories", JSON.stringify(savedIds)); }
    catch (e) { persistent = false; }
    render();
    var focusButton = Array.prototype.find.call(contentEl.querySelectorAll("[data-save-story]"), function (button) { return button.getAttribute("data-save-story") === id; });
    (focusButton || document.getElementById("saved-only")).focus({ preventScroll: true });
    announce(!persistent ? "Saved list changed for this visit only. Persistent storage is unavailable." : at === -1 ? "Added to saved reading on this device." : "Removed from saved reading.");
  }
  function careNote(article) {
    return article.title + "\nPublished: " + article.date_published + "\nEvidence: " + article.evidence_level + "\nSource: " + article.url + "\n\nQuestion for my care team: " + (article.care_question || "Does this research apply to my diagnosis and current stage of recovery? What are its limitations, and is there a suitable rehabilitation assessment or registered trial?") + "\n\nResearch summary, not a treatment recommendation.";
  }
  function copyText(text, message) {
    if (!navigator.clipboard) { announce("Copy is unavailable in this browser. You can select and copy the source link from the story."); return; }
    navigator.clipboard.writeText(text).then(function () { announce(message); }, function () { announce("Copy was blocked by your browser. Please copy the source link directly."); });
  }

  function compare(a, b, mode) {
    if (mode === "newest") {
      var byDate = String(b.date_published || "").localeCompare(String(a.date_published || ""));
      if (byDate) {
        return byDate;
      }
      return (Number(b.relevance_score) || 0) - (Number(a.relevance_score) || 0);
    }
    var byScore = (Number(b.relevance_score) || 0) - (Number(a.relevance_score) || 0);
    if (byScore) {
      return byScore;
    }
    return String(b.date_published || "").localeCompare(String(a.date_published || ""));
  }

  function categoryOrder(list) {
    var seen = {};
    var names = [];
    list.forEach(function (article) {
      var name = article.category;
      if (!name || name === TRIALS || seen[name]) {
        return;
      }
      seen[name] = true;
      names.push(name);
    });
    return names;
  }

  function buildSections(list) {
    var needle = query.trim().toLowerCase();
    var filtered = list.filter(function (article) {
      return matches(article, needle) && passesFilters(article, null) && passesReadingOptions(article);
    });
    if (needle || hasFilters() || hasReadingOptions()) {
      return {
        filteredCount: filtered.length,
        sections: filtered.length
          ? [{
              id: "search-results",
              title: savedOnly ? "Saved reading" : needle ? "Search results" : hasFilters() ? "Stories for " + selectionLabel() : "Filtered research",
              kind: "search",
              items: filtered.slice().sort(function (a, b) {
                return compare(a, b, sortMode);
              })
            }]
          : []
      };
    }

    var sections = [
      {
        id: "top-stories",
        title: "Top Stories",
        kind: "top",
        items: filtered.slice().sort(function (a, b) {
          return compare(a, b, sortMode);
        }).slice(0, 6)
      },
      {
        id: "latest",
        title: "Latest",
        kind: "latest",
        items: filtered.slice().sort(function (a, b) {
          return compare(a, b, "newest");
        }).slice(0, 6)
      }
    ];

    categoryOrder(list).forEach(function (name) {
      sections.push({
        id: slug(name),
        title: name,
        kind: "category",
        items: filtered.filter(function (article) {
          return article.category === name;
        }).sort(function (a, b) {
          return compare(a, b, sortMode);
        })
      });
    });

    var hasTrials = list.some(function (article) {
      return article.category === TRIALS;
    });
    if (hasTrials) {
      sections.push({
        id: slug(TRIALS),
        title: TRIALS,
        kind: "trials",
        items: filtered.filter(function (article) {
          return article.category === TRIALS;
        }).sort(function (a, b) {
          return compare(a, b, sortMode);
        })
      });
    }

    return {
      filteredCount: filtered.length,
      sections: sections.filter(function (section) {
        return section.items.length > 0;
      })
    };
  }

  function trialHtml(article) {
    var status = article.trial_status;
    var parts = [];
    if (status && typeof status === "object") {
      var rows = "";
      [
        ["Status", status.status],
        ["Phase", status.phase],
        ["Where", status.location],
        ["Eligibility", status.key_eligibility]
      ].forEach(function (pair) {
        if (!pair[1]) {
          return;
        }
        rows += "<div><dt>" + escapeHtml(pair[0]) + "</dt><dd>" + escapeHtml(pair[1]) + "</dd></div>";
      });
      if (rows) {
        parts.push("<h4>Trial status</h4><dl>" + rows + "</dl>");
      }
    }
    if (article.trial_url) {
      parts.push(
        '<p class="registry-link"><a href="' + escapeHtml(article.trial_url) + '" target="_blank" rel="noopener noreferrer">Trial registry<span class="sr-only"> (opens in a new tab)</span></a></p>'
      );
    }
    if (!parts.length) {
      return "";
    }
    return '<aside class="trial">' + parts.join("") + "</aside>";
  }

  var TAG_KEYS = ["body_area", "cause", "approach", "stage"];

  function tagList(article) {
    var tags = article.tags || {};
    return TAG_KEYS.map(function (k) {
      return tags[k];
    }).filter(Boolean).concat(article.related_body_areas || []);
  }

  function tagValues(article, key) {
    var primary = article.tags && article.tags[key];
    var values = primary ? [primary] : [];
    if (key === "body_area") {
      (article.related_body_areas || []).forEach(function (value) {
        if (values.indexOf(value) === -1) { values.push(value); }
      });
    }
    return values;
  }

  function entryHtml(article, section, index) {
    var key = section.id + "--" + (article.id || index);
    var level = openEntries[key] || 0;
    var qrId = "qr-" + key;
    var detailsId = "details-" + key;
    var headId = "head-" + key;
    var date = article.date_published
      ? '<time datetime="' + escapeHtml(article.date_published) + '">' + escapeHtml(formatShortDate(article.date_published)) + "</time>"
      : "";
    var tagPairs = TAG_KEYS.filter(function (k) {
      return article.tags && article.tags[k];
    });
    var tagLine = tagPairs.length
      ? '<p class="entry-tags"><span class="sr-only">Tags: </span>' + tagPairs.map(function (k) {
          var t = article.tags[k];
          return '<button type="button" class="chip chip--tag" data-fkey="' + escapeHtml(k) + '" data-fval="' + escapeHtml(t) + '" title="Show all stories tagged ' + escapeHtml(t) + '">' + escapeHtml(t) + "</button>";
        }).join('<span class="dot" aria-hidden="true"> · </span>') + "</p>"
      : "";
    var saved = savedIds.indexOf(article.id) !== -1;
    var readingActions = '<div class="story-tools"><span class="evidence-marker">' + escapeHtml(article.tags.stage) + '</span><button type="button" data-save-story="' + escapeHtml(article.id) + '" aria-pressed="' + saved + '" aria-label="' + (saved ? 'Unsave: ' : 'Save: ') + escapeHtml(article.title) + '">' + (saved ? 'Saved' : 'Save') + '</button></div>';
    var quick = article.quick_read
      ? '<div class="quick-read" data-advance><p class="qr-label">Quick Read</p><p class="qr-text">' + escapeHtml(article.quick_read) + "</p></div>"
      : "";

    var detail = "";
    if (article.summary) {
      detail += '<h4 class="d-label">Summary</h4><p class="summary">' + escapeHtml(article.summary) + "</p>";
    }
    if (article.why_it_matters) {
      detail += '<h4 class="d-label">Why it matters</h4><p class="why">' + escapeHtml(article.why_it_matters) + "</p>";
    }
    if (article.limitation) { detail += '<h4 class="d-label">What this does not show</h4><p class="study-limit">' + escapeHtml(article.limitation) + '</p>'; }
    detail += '<div class="care-team-note"><h4 class="d-label">A question for your care team</h4><p>' + escapeHtml(article.care_question || "Does this research apply to my diagnosis and recovery? What are its limitations, and what rehabilitation assessment or registered trial would be appropriate?") + '</p><button type="button" data-copy-note="' + escapeHtml(article.id) + '">Copy discussion note with source</button></div>';
    var facts = "";
    [
      ["Section", article.category],
      ["Source", article.source],
      ["Published", article.date_published ? formatDate(article.date_published) : ""],
      ["Evidence level", article.evidence_level],
      ["Date note", article.date_note],
      ["Source checked", article.verified_on ? formatDate(article.verified_on) : ""]
    ].forEach(function (pair) {
      if (!pair[1]) {
        return;
      }
      var val = pair[0] === "Section"
        ? '<span class="chip chip--brass">' + escapeHtml(pair[1]) + "</span>"
        : escapeHtml(pair[1]);
      facts += "<div><dt>" + escapeHtml(pair[0]) + "</dt><dd>" + val + "</dd></div>";
    });
    if (facts) {
      detail += '<dl class="facts">' + facts + "</dl>";
    }
    detail += trialHtml(article);
    if (article.url) {
      detail += '<p class="source-link"><a href="' + escapeHtml(article.url) + '" target="_blank" rel="noopener noreferrer">Read the original article<span class="sr-only"> (opens in a new tab)</span></a></p>';
    }
    detail += CLOSE_HTML;

    return (
      '<article class="entry scroll" data-level="' + level + '" id="' + escapeHtml(key) + '" data-key="' + escapeHtml(key) + '" aria-labelledby="' + escapeHtml(headId) + '">' +
        '<div class="scroll-rod scroll-rod--top" aria-hidden="true"></div>' +
        '<div class="scroll-sheet">' +
          '<button type="button" class="scroll-close-top" aria-label="Close story"><span aria-hidden="true">×</span> Close</button>' +
          '<div class="entry-row" data-advance>' +
            '<h3 class="entry-head">' +
              '<button type="button" class="entry-headbtn" id="' + escapeHtml(headId) + '" aria-expanded="' + (level > 0 ? "true" : "false") + '" aria-controls="' + escapeHtml(qrId) + '">' +
                '<span class="head-text">' + escapeHtml(article.title || "Untitled") + "</span>" +
              "</button>" +
            "</h3>" +
            (date ? '<p class="head-meta">' + date + "</p>" : "") +
          "</div>" +
          tagLine + readingActions +
          '<div class="stage stage--qr" id="' + escapeHtml(qrId) + '"' + (level >= 1 ? "" : " inert") + ">" +
            '<div class="stage-inner">' +
              quick +
              '<button type="button" class="more-btn" aria-expanded="' + (level >= 2 ? "true" : "false") + '" aria-controls="' + escapeHtml(detailsId) + '">' +
                '<span class="when-closed">Read full details</span><span class="when-open">Hide full details</span>' +
                '<span class="chev" aria-hidden="true"></span>' +
              "</button>" +
            "</div>" +
          "</div>" +
          '<div class="stage stage--details" id="' + escapeHtml(detailsId) + '" role="region" aria-label="Full details"' + (level >= 2 ? "" : " inert") + ">" +
            '<div class="stage-inner">' + detail + "</div>" +
          "</div>" +
        "</div>" +
        '<div class="scroll-rod scroll-rod--bottom" aria-hidden="true"></div>' +
      "</article>"
    );
  }

  function centerEntry(entry) {
    if (centerTimer) { window.clearTimeout(centerTimer); }
    centerTimer = window.setTimeout(function () {
      if (!document.documentElement.contains(entry) || levelOf(entry) === 0) { return; }
      var rect = entry.getBoundingClientRect();
      var gap = Math.max(24, (window.innerHeight - rect.height) / 2);
      window.scrollTo({
        top: Math.max(0, window.scrollY + rect.top - gap),
        behavior: REDUCED_MOTION ? "auto" : "smooth"
      });
      centerTimer = null;
    }, REDUCED_MOTION ? 0 : 540);
  }

  function setLevel(entry, level, skipCenter) {
    if (level > 0) {
      Array.prototype.forEach.call(contentEl.querySelectorAll('.entry:not([data-level="0"])'), function (other) {
        if (other !== entry) { setLevel(other, 0, true); }
      });
      openEntries = {};
    } else if (!skipCenter && centerTimer) {
      window.clearTimeout(centerTimer);
      centerTimer = null;
    }
    var key = entry.getAttribute("data-key");
    entry.setAttribute("data-level", String(level));
    entry.querySelector(".entry-headbtn").setAttribute("aria-expanded", level > 0 ? "true" : "false");
    entry.querySelector(".more-btn").setAttribute("aria-expanded", level >= 2 ? "true" : "false");
    var qr = entry.querySelector(".stage--qr");
    var details = entry.querySelector(".stage--details");
    if (level >= 1) {
      qr.removeAttribute("inert");
    } else {
      qr.setAttribute("inert", "");
    }
    if (level >= 2) {
      details.removeAttribute("inert");
    } else {
      details.setAttribute("inert", "");
    }
    if (level) {
      openEntries[key] = level;
      if (!skipCenter) { centerEntry(entry); }
    } else {
      delete openEntries[key];
    }
  }

  function levelOf(entry) {
    return Number(entry.getAttribute("data-level")) || 0;
  }

  contentEl.addEventListener("click", function (event) {
    var target = event.target;
    var save = target.closest("[data-save-story]");
    if (save) { saveStory(save.getAttribute("data-save-story")); return; }
    var note = target.closest("[data-copy-note]");
    if (note) { var item = articles.find(function (a) { return a.id === note.getAttribute("data-copy-note"); }); if (item) { copyText(careNote(item), "Discussion note copied with its original source."); } return; }
    if (target.closest("a")) {
      return;
    }
    var tagBtn = target.closest(".chip[data-fkey]");
    if (tagBtn) {
      showOnly(tagBtn.getAttribute("data-fkey"), tagBtn.getAttribute("data-fval"));
      return;
    }
    if (target.closest(".finder-clear-inline")) {
      clearFilters();
      return;
    }
    var entry = target.closest(".entry");
    if (!entry) {
      return;
    }
    if (target.closest(".scroll-close, .scroll-close-top")) {
      setLevel(entry, 0);
      var head = entry.querySelector(".entry-headbtn");
      if (head) {
        head.focus({ preventScroll: true });
      }
      var rect = entry.getBoundingClientRect();
      if (rect.top < 0 || rect.top > window.innerHeight * 0.4) {
        entry.scrollIntoView({ block: "start", behavior: REDUCED_MOTION ? "auto" : "smooth" });
      }
      return;
    }
    if (target.closest(".more-btn")) {
      setLevel(entry, levelOf(entry) >= 2 ? 1 : 2);
      return;
    }
    if (!target.closest("[data-advance]") && !target.closest(".entry-tags")) {
      return;
    }
    var selection = window.getSelection && window.getSelection();
    if (selection && String(selection).length > 0 && !target.closest("button")) {
      return;
    }
    // Closed -> Quick Read -> full details -> closed.
    setLevel(entry, (levelOf(entry) + 1) % 3);
  });

  contentEl.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") { return; }
    var entry = event.target.closest(".entry");
    if (entry && levelOf(entry) > 0) {
      setLevel(entry, 0);
      entry.querySelector(".entry-headbtn").focus({ preventScroll: true });
    }
  });

  function emptyFilters() {
    var f = {};
    FILTER_GROUPS.forEach(function (g) {
      f[g.key] = [];
    });
    return f;
  }

  function hasFilters() {
    return FILTER_GROUPS.some(function (g) {
      return filters[g.key].length > 0;
    });
  }

  function selectedValues() {
    var out = [];
    FILTER_GROUPS.forEach(function (g) {
      out = out.concat(filters[g.key]);
    });
    return out;
  }

  function selectionLabel() {
    return FILTER_GROUPS.filter(function (g) {
      return filters[g.key].length > 0;
    }).map(function (g) {
      return filters[g.key].join(" or ");
    }).join(" · ");
  }

  // AND across groups, OR within a group. "except" skips one group (for chip counts).
  function passesFilters(article, except) {
    var tags = article.tags || {};
    return FILTER_GROUPS.every(function (g) {
      var chosen = filters[g.key];
      if (g.key === except || !chosen.length) {
        return true;
      }
      return tagValues(article, g.key).some(function (value) {
        return chosen.indexOf(value) !== -1;
      });
    });
  }

  function groupValues(key) {
    var values = VOCAB[key].slice();
    articles.forEach(function (article) {
      tagValues(article, key).forEach(function (v) {
        if (values.indexOf(v) === -1) { values.push(v); }
      });
    });
    filters[key].forEach(function (v) {
      if (values.indexOf(v) === -1) {
        values.push(v);
      }
    });
    return values;
  }

  function canonical(key, value) {
    var lower = String(value).trim().toLowerCase();
    var values = groupValues(key);
    for (var i = 0; i < values.length; i++) {
      if (values[i].toLowerCase() === lower) {
        return values[i];
      }
    }
    return String(value).trim();
  }

  function readHash() {
    var raw = window.location.hash.replace(/^#/, "");
    if (raw.indexOf("=") === -1) {
      return false;
    }
    var next = emptyFilters();
    query = ""; publicationWindow = "all"; humanOnly = false; savedOnly = false;
    raw.split("&").forEach(function (part) {
      var eq = part.indexOf("=");
      if (eq < 1) {
        return;
      }
      var rawKey = decodePart(part.slice(0, eq)).toLowerCase();
      var rawValue = decodePart(part.slice(eq + 1));
      if (rawKey === "q") { query = rawValue; return; }
      if (rawKey === "published" && ["90", "365"].indexOf(rawValue) !== -1) { publicationWindow = rawValue; return; }
      if (rawKey === "human") { humanOnly = rawValue === "1"; return; }
      if (rawKey === "saved") { savedOnly = rawValue === "1"; return; }
      var key = HASH_KEYS[rawKey];
      if (!key) {
        return;
      }
      part.slice(eq + 1).split(",").forEach(function (v) {
        var value = decodePart(v);
        if (!value) {
          return;
        }
        value = canonical(key, value);
        if (next[key].indexOf(value) === -1) {
          next[key].push(value);
        }
      });
    });
    filters = next;
    searchInput.value = query;
    return true;
  }

  function decodePart(text) {
    try {
      return decodeURIComponent(String(text).replace(/\+/g, " ")).trim();
    } catch (e) {
      return String(text).trim();
    }
  }

  function writeHash() {
    var parts = [];
    FILTER_GROUPS.forEach(function (g) {
      if (filters[g.key].length) {
        parts.push(g.key + "=" + filters[g.key].map(encodeURIComponent).join(","));
      }
    });
    if (query.trim()) { parts.push("q=" + encodeURIComponent(query.trim())); }
    if (publicationWindow !== "all") { parts.push("published=" + publicationWindow); }
    if (humanOnly) { parts.push("human=1"); }
    if (savedOnly) { parts.push("saved=1"); }
    var url = window.location.pathname + window.location.search + (parts.length ? "#" + parts.join("&") : "");
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, "", url);
    } else if (parts.length) {
      window.location.hash = parts.join("&");
    }
  }

  function toggleFilter(key, value) {
    var list = filters[key];
    var at = list.indexOf(value);
    if (at === -1) {
      list.push(value);
    } else {
      list.splice(at, 1);
    }
    writeHash();
    render();
  }

  document.addEventListener("click", function (event) {
    var shortcut = event.target.closest("[data-hand-focus]");
    if (!shortcut) { return; }
    event.preventDefault();
    filters = emptyFilters();
    filters.body_area = ["Hand"];
    filters.cause = ["Brain tumor"];
    query = "";
    searchInput.value = "";
    writeHash();
    render();
    contentEl.scrollIntoView({ block: "start", behavior: REDUCED_MOTION ? "auto" : "smooth" });
  });

  function showOnly(key, value) {
    filters = emptyFilters();
    filters[key] = [value];
    writeHash();
    render();
    var finder = document.getElementById("finder");
    if (finder) {
      finder.scrollIntoView({ block: "start", behavior: REDUCED_MOTION ? "auto" : "smooth" });
    }
  }

  function clearFilters() {
    filters = emptyFilters();
    writeHash();
    render();
  }

  function renderFinder(matchCount) {
    if (!finderGroupsEl) {
      return;
    }
    var active = document.activeElement;
    var focusKey = active && active.getAttribute && active.getAttribute("data-fkey") && active.closest && active.closest("#finder-groups")
      ? active.getAttribute("data-fkey") + "\u0000" + active.getAttribute("data-fval")
      : "";
    var needle = query.trim().toLowerCase();
    finderGroupsEl.innerHTML = FILTER_GROUPS.map(function (g) {
      var chips = groupValues(g.key).map(function (value) {
        var count = articles.filter(function (article) {
          return tagValues(article, g.key).indexOf(value) !== -1 && passesFilters(article, g.key) && matches(article, needle) && passesReadingOptions(article);
        }).length;
        var on = filters[g.key].indexOf(value) !== -1;
        return '<button type="button" class="chip chip--filter' + (count ? "" : " is-empty") + '" data-fkey="' + escapeHtml(g.key) + '" data-fval="' + escapeHtml(value) + '" aria-pressed="' + (on ? "true" : "false") + '">' +
          '<span class="chip-text">' + escapeHtml(value) + "</span>" +
          '<span class="chip-count">' + count + '<span class="sr-only"> ' + (count === 1 ? "story" : "stories") + "</span></span>" +
          "</button>";
      }).join("");
      return '<div class="finder-group" role="group" aria-labelledby="fg-' + escapeHtml(g.key) + '">' +
        '<p class="finder-label" id="fg-' + escapeHtml(g.key) + '">' + escapeHtml(g.label) + "</p>" +
        '<div class="finder-chips">' + chips + "</div>" +
        "</div>";
    }).join("");
    if (focusKey) {
      var parts = focusKey.split("\u0000");
      Array.prototype.some.call(finderGroupsEl.querySelectorAll(".chip--filter"), function (btn) {
        if (btn.getAttribute("data-fkey") === parts[0] && btn.getAttribute("data-fval") === parts[1]) {
          btn.focus({ preventScroll: true });
          return true;
        }
        return false;
      });
    }
    var any = hasFilters();
    finderClearBtn.disabled = !any;
    if (!any) {
      finderStatusEl.innerHTML = "";
    } else if (!matchCount) {
      finderStatusEl.innerHTML = "No articles yet for " + escapeHtml(selectionLabel()) + ". New ones are added daily.";
    } else {
      finderStatusEl.innerHTML = escapeHtml(matchCount + (matchCount === 1 ? " story" : " stories") + " for " + selectionLabel() + ". ") +
        '<button type="button" class="finder-see" id="finder-see">See ' + (matchCount === 1 ? "it" : "them") + "</button>";
    }
  }

  if (finderGroupsEl) {
    finderGroupsEl.addEventListener("click", function (event) {
      var btn = event.target.closest(".chip--filter");
      if (btn) {
        toggleFilter(btn.getAttribute("data-fkey"), btn.getAttribute("data-fval"));
      }
    });
    finderClearBtn.addEventListener("click", clearFilters);
    finderStatusEl.addEventListener("click", function (event) {
      if (event.target.closest("#finder-see")) {
        contentEl.scrollIntoView({ block: "start", behavior: REDUCED_MOTION ? "auto" : "smooth" });
      }
    });
    window.addEventListener("hashchange", function () {
      if (readHash()) {
        render();
      }
    });
  }

  document.getElementById("publication-window").addEventListener("change", function (event) { publicationWindow = event.target.value; writeHash(); render(); });
  document.getElementById("human-only").addEventListener("change", function (event) { humanOnly = event.target.checked; writeHash(); render(); });
  document.getElementById("saved-only").addEventListener("click", function () { savedOnly = !savedOnly; writeHash(); render(); });
  document.getElementById("reset-search").addEventListener("click", resetSearch);
  document.getElementById("copy-search").addEventListener("click", function () { copyText(window.location.href, "Search link copied. The recipient uses their own saved reading list."); });
  document.querySelector(".search-suggestions").addEventListener("click", function (event) {
    var example = event.target.closest("[data-search-example]"); if (!example) { return; }
    filters = emptyFilters(); publicationWindow = "all"; humanOnly = false; savedOnly = false;
    query = example.getAttribute("data-search-example"); searchInput.value = query; writeHash(); render();
  });
  function resetSearch() {
    query = ""; searchInput.value = ""; filters = emptyFilters(); publicationWindow = "all"; humanOnly = false; savedOnly = false; announce(""); writeHash(); render();
  }
  contentEl.addEventListener("click", function (event) { if (event.target.closest("[data-reset-search]")) { resetSearch(); searchInput.focus(); } });
  function publishDeskReading() {
    window.dispatchEvent(new CustomEvent("rt-care-reading", {detail:{loaded:articlesReady, stories:articles.filter(function (article) { return savedIds.indexOf(article.id) !== -1; })}}));
  }
  window.addEventListener("rt-care-reading-request",publishDeskReading);
  window.addEventListener("rt-care-restore-reading",function (event) {
    if (!articlesReady || !Array.isArray(event.detail)) { return; }
    event.detail.forEach(function (id) { if (articles.some(function (a) { return a.id === id; }) && savedIds.indexOf(id) === -1) { savedIds.push(id); } });
    try { localStorage.setItem("rt-saved-stories", JSON.stringify(savedIds)); } catch (e) { announce("Imported reading is available for this visit only; browser storage is unavailable."); }
    render();
  });
  function render() {
    publishDeskReading();
    document.getElementById("publication-window").value = publicationWindow;
    document.getElementById("human-only").checked = humanOnly;
    document.getElementById("saved-only").setAttribute("aria-pressed", String(savedOnly));
    document.getElementById("saved-count").textContent = savedIds.filter(function (id) { return articles.some(function (a) { return a.id === id; }); }).length;

    renderCareResources();
    var view = buildSections(articles);
    var needle = query.trim();
    renderFinder(view.filteredCount);

    navEl.innerHTML = '<a href="#how-to">How to read</a><a href="#finder">Find research</a><a href="#care-directory" data-open-care>Find care</a>' +
      view.sections.filter(function (section) { return ["top", "latest", "search", "trials"].indexOf(section.kind) !== -1 || section.id === "brain-tumor-recovery"; }).map(function (section) {
        return '<a href="#' + escapeHtml(section.id) + '">' + escapeHtml(section.title) + '</a>';
      }).join("");

    if (!view.sections.length) {
      if (hasFilters()) {
        contentEl.innerHTML = '<p class="empty">No articles yet for ' + escapeHtml(selectionLabel()) +
          (needle ? " matching “" + escapeHtml(needle) + "”" : "") +
          '. New ones are added daily.</p><p class="empty"><button type="button" class="finder-clear finder-clear-inline">Clear topics</button></p>';
      } else {
        contentEl.innerHTML = '<p class="empty">' + (needle ? "No stories match “" + escapeHtml(needle) + "”." : savedOnly ? "No saved stories match these filters." : "No stories match these reading filters.") + "</p>";
      }
      contentEl.innerHTML += '<div class="no-match-help"><p>' + (savedOnly ? 'Save stories using the Save button. Other active filters also apply to saved reading.' : 'Try fewer words, remove a topic, or widen the publication date. We do not substitute a different diagnosis when there is no match.') + '</p><button type="button" data-reset-search>Reset search and topics</button></div>';
      countEl.textContent = "0 of " + articles.length + " stories";
      return;
    }

    contentEl.innerHTML = view.sections.map(function (section) {
      var deck = "";
      if (section.kind === "top" || section.kind === "search") {
        deck = sortMode === "newest"
          ? "Sorted newest first"
          : "Most relevant first";
      } else if (section.kind === "latest") {
        deck = "Most recently published";
      } else if (section.kind === "trials") {
        deck = "";
      } else {
        deck = sortMode === "newest" ? "Newest first" : "By relevance";
      }
      var kicker = section.kind === "trials"
        ? '<p class="section-kicker">Separate listing of studies that are recruiting or still experimental</p>'
        : (deck ? '<p class="section-deck">' + escapeHtml(deck) + "</p>" : "");
      var cards = section.items.map(function (article, index) {
        return entryHtml(article, section, index);
      }).join("");
      return (
        '<section class="section' + (section.kind === "trials" ? " section--trials" : "") + '" id="' + escapeHtml(section.id) + '" aria-labelledby="heading-' + escapeHtml(section.id) + '">' +
          '<h2 class="section-head" id="heading-' + escapeHtml(section.id) + '">' + escapeHtml(section.title) + "</h2>" +
          kicker +
          '<div class="log">' + cards + "</div>" +
        "</section>"
      );
    }).join("");

    if (needle || hasFilters() || hasReadingOptions()) {
      countEl.textContent = view.filteredCount + " of " + articles.length + (articles.length === 1 ? " story" : " stories");
    } else {
      var updated = articles.reduce(function (latest, article) {
        if (article.date_added && article.date_added > latest) {
          return article.date_added;
        }
        return latest;
      }, "");
      countEl.textContent = articles.length + (articles.length === 1 ? " story" : " stories") +
        (updated ? " · file updated " + formatDate(updated) : "");
    }
  }

  function matchesCareResource(resource) {
    var areaMatch = !filters.body_area.length || filters.body_area.some(function (area) { return resource.body_areas.indexOf(area) !== -1; });
    var causeMatch = !filters.cause.length || filters.cause.some(function (cause) { return resource.causes.indexOf(cause) !== -1; });
    var text = normalizeSearch([resource.name, resource.focus, resource.why_relevant, resource.search_terms, resource.location].join(" "));
    var wordsMatch = searchTerms(query).every(function (term) { return text.indexOf(term) !== -1; });
    var age = document.getElementById("care-age").value;
    var region = document.getElementById("care-region").value;
    var ageMatch = age === "all" || resource.age_groups.indexOf(age) !== -1;
    var inFlorida = resource.location.indexOf("Florida") !== -1;
    var regionMatch = region === "all" || (region === "Florida" ? inFlorida : !inFlorida);
    return areaMatch && causeMatch && wordsMatch && ageMatch && regionMatch;
  }
  function renderCareResources() {
    if (!careResourcesLoaded) { return; }
    var grid = document.getElementById("care-resource-grid");
    var count = document.getElementById("care-resource-count");
    var status = document.getElementById("care-resource-status");
    if (careResourceError) { count.textContent = "Directory temporarily unavailable"; status.textContent = "We could not load care resources. Article search remains available."; grid.innerHTML = ""; return; }
    var matches = careResources.filter(matchesCareResource);
    count.textContent = matches.length + (matches.length === 1 ? " resource" : " resources");
    status.textContent = matches.length ? matches.length + " of " + careResources.length + " listed resources. Confirm suitability, appointments and trial openings directly." : "No listed care resources match this combination yet. Try fewer search words or a different age/location filter. This does not mean no suitable care exists.";
    grid.innerHTML = matches.map(function (resource) {
      var age = resource.age_groups.indexOf("confirm") !== -1 ? "Age eligibility: confirm with program" : resource.age_groups.map(function (a) { return a === "adult" ? "Adults" : "Children / adolescents"; }).join(" · ");
      var contact = (resource.phone ? '<p class="resource-contact">Public contact: ' + escapeHtml(resource.phone) + '</p>' : '') +
        (resource.email ? '<p class="resource-contact">Research email: <a href="mailto:' + escapeHtml(resource.email) + '">' + escapeHtml(resource.email) + '</a></p>' : '');
      return '<details class="care-resource"><summary><span class="resource-kind">' + escapeHtml(resource.kind) + '</span><span class="resource-name">' + escapeHtml(resource.name) + '</span><span class="resource-location">' + escapeHtml(resource.location) + '</span></summary>' +
        '<p class="resource-age">' + escapeHtml(age) + '</p><p><strong>Focus:</strong> ' + escapeHtml(resource.focus) + '</p><p>' + escapeHtml(resource.why_relevant) + '</p>' +
        '<p class="resource-caution">' + escapeHtml(resource.caution) + '</p>' + contact +
        '<p><a class="resource-official" href="' + escapeHtml(resource.url) + '" target="_blank" rel="noopener noreferrer">Official program / contact page ↗</a></p>' +
        '<p class="resource-checked">Source checked ' + escapeHtml(formatDate(resource.verified_on)) + '. Not confirmation of appointment availability.</p></details>';
    }).join("");
  }
  document.getElementById("care-age").addEventListener("change", renderCareResources);
  document.getElementById("care-region").addEventListener("change", renderCareResources);
  document.addEventListener("click", function (event) {
    if (event.target.closest("[data-open-care]")) { document.getElementById("care-directory-panel").open = true; }
    var button = event.target.closest("[data-care-path]");
    if (!button) { return; }
    filters = emptyFilters(); query = ""; searchInput.value = ""; publicationWindow = "all"; humanOnly = false; savedOnly = false;
    if (button.getAttribute("data-care-path") === "tumor") { filters.body_area = ["Hand"]; filters.cause = ["Brain tumor"]; }
    else { filters.body_area = ["Arm", "Hand"]; filters.cause = ["Trauma"]; }
    document.getElementById("care-age").value = "all";
    document.getElementById("care-region").value = "all";
    document.getElementById("care-directory-panel").open = true;
    writeHash(); render();
    document.getElementById("care-directory").scrollIntoView({block:"start",behavior:REDUCED_MOTION ? "auto" : "smooth"});
  });
  window.addEventListener("rt-guided-search", function (event) {
    var detail = event.detail || {};
    filters = emptyFilters(); query = detail.query || ""; searchInput.value = query;
    filters.body_area = (detail.areas || []).filter(function (v) { return VOCAB.body_area.indexOf(v) !== -1; });
    filters.cause = VOCAB.cause.indexOf(detail.cause) !== -1 ? [detail.cause] : [];
    filters.approach = (detail.approaches || []).filter(function (v) { return VOCAB.approach.indexOf(v) !== -1; });
    filters.stage = (detail.stages || []).filter(function (v) { return VOCAB.stage.indexOf(v) !== -1; });
    publicationWindow = "all"; humanOnly = false; savedOnly = false;
    document.getElementById("care-age").value = ["adult", "pediatric"].indexOf(detail.age) !== -1 ? detail.age : "all";
    document.getElementById("care-region").value = "all";
    document.getElementById("care-directory-panel").open = detail.target === "care";
    writeHash(); render();
    if (detail.target === "care") { document.getElementById("care-directory").scrollIntoView({block:"start",behavior:"auto"}); }
    else if (document.getElementById("guided-dialog").open === false) { contentEl.scrollIntoView({block:"start",behavior:"auto"}); }
  });
  window.addEventListener("rt-guided-clear", function () { document.getElementById("care-age").value = "all"; document.getElementById("care-region").value = "all"; resetSearch(); });

  fetch("data/resources.json", {cache:"no-cache"}).then(function (response) {
    if (!response.ok) { throw new Error("Resources unavailable"); } return response.json();
  }).then(function (data) {
    if (!Array.isArray(data)) { throw new Error("Invalid resources"); }
    careResources = data; careResourcesLoaded = true; renderCareResources();
  }).catch(function () { careResourcesLoaded = true; careResourceError = true; renderCareResources(); });

  fetch("data/articles.json", { cache: "no-cache" })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Could not load stories (" + response.status + ").");
      }
      return response.json();
    })
    .then(function (data) {
      if (!Array.isArray(data)) {
        throw new Error("Story file is not a list.");
      }
      articles = data; articlesReady = true;
      readHash();
      render();
    })
    .catch(function (error) {
      contentEl.innerHTML = '<p class="empty">' + escapeHtml(error.message || "Could not load stories.") + " Open this site over a local server, not as a file on disk.</p>";
      countEl.textContent = "";
    });
})();
