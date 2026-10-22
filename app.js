(function () {
  "use strict";

  var TRIALS = "Clinical Trials & Experimental Opportunities";
  var articles = [];
  var sortMode = "relevance";
  var query = "";
  var openEntries = {};
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
    { key: "approach", label: "Treatment" },
    { key: "stage", label: "Stage" }
  ];
  var VOCAB = {
    body_area: ["Brain", "Neck spine", "Back spine", "Spine", "Nerve root", "Peripheral nerve", "Arm", "Hand", "Leg", "Face"],
    cause: ["Trauma", "Brain tumor", "Spine tumor", "Stroke", "Diabetes", "Chemotherapy", "Disease", "Surgery", "Nerve gap", "Any cause"],
    approach: ["Drug", "Stem cells", "Scaffold", "Nerve transfer", "Stimulation", "Surgery", "Device", "Rehab", "Review"],
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
    render();
  });

  navEl.addEventListener("click", function (event) {
    if (event.target.closest('a[href="#share"]')) {
      var box = document.querySelector("#share details");
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

  function matches(article, needle) {
    if (!needle) {
      return true;
    }
    var haystack = [article.title, article.quick_read, article.summary, article.source, article.category].concat(tagList(article))
      .join("\n")
      .toLowerCase();
    return haystack.indexOf(needle) !== -1;
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
      return matches(article, needle) && passesFilters(article, null);
    });
    if (needle || hasFilters()) {
      return {
        filteredCount: filtered.length,
        sections: filtered.length
          ? [{
              id: "search-results",
              title: needle ? "Search results" : "Stories for " + selectionLabel(),
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
        })
      },
      {
        id: "latest",
        title: "Latest",
        kind: "latest",
        items: filtered.slice().sort(function (a, b) {
          return compare(a, b, "newest");
        })
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
    }).filter(Boolean);
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
    var facts = "";
    [
      ["Section", article.category],
      ["Source", article.source],
      ["Published", article.date_published ? formatDate(article.date_published) : ""],
      ["Evidence level", article.evidence_level],
      ["Date note", article.date_note]
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
          '<div class="entry-row" data-advance>' +
            '<h3 class="entry-head">' +
              '<button type="button" class="entry-headbtn" id="' + escapeHtml(headId) + '" aria-expanded="' + (level > 0 ? "true" : "false") + '" aria-controls="' + escapeHtml(qrId) + '">' +
                '<span class="head-text">' + escapeHtml(article.title || "Untitled") + "</span>" +
              "</button>" +
            "</h3>" +
            (date ? '<p class="head-meta">' + date + "</p>" : "") +
          "</div>" +
          tagLine +
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

  function setLevel(entry, level) {
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
    } else {
      delete openEntries[key];
    }
  }

  function levelOf(entry) {
    return Number(entry.getAttribute("data-level")) || 0;
  }

  contentEl.addEventListener("click", function (event) {
    var target = event.target;
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
    if (target.closest(".scroll-close")) {
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
      return chosen.indexOf(tags[g.key]) !== -1;
    });
  }

  function groupValues(key) {
    var values = VOCAB[key].slice();
    articles.forEach(function (article) {
      var v = article.tags && article.tags[key];
      if (v && values.indexOf(v) === -1) {
        values.push(v);
      }
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
    raw.split("&").forEach(function (part) {
      var eq = part.indexOf("=");
      if (eq < 1) {
        return;
      }
      var key = HASH_KEYS[decodePart(part.slice(0, eq)).toLowerCase()];
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
          return article.tags && article.tags[g.key] === value && passesFilters(article, g.key) && matches(article, needle);
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

  function render() {
    var view = buildSections(articles);
    var needle = query.trim();
    renderFinder(view.filteredCount);

    navEl.innerHTML = '<a href="#share" class="nav-share">Share Your Story</a>' +
      '<a href="#subscribe" class="nav-share">Subscribe</a>' +
      view.sections.map(function (section) {
        return '<a href="#' + escapeHtml(section.id) + '">' + escapeHtml(section.title) + "</a>";
      }).join("");

    if (!view.sections.length) {
      if (hasFilters()) {
        contentEl.innerHTML = '<p class="empty">No articles yet for ' + escapeHtml(selectionLabel()) +
          (needle ? " matching “" + escapeHtml(needle) + "”" : "") +
          '. New ones are added daily.</p><p class="empty"><button type="button" class="finder-clear finder-clear-inline">Clear topics</button></p>';
      } else {
        contentEl.innerHTML = '<p class="empty">No stories match “' + escapeHtml(needle) + "”.</p>";
      }
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

    if (needle || hasFilters()) {
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
      articles = data;
      readHash();
      render();
    })
    .catch(function (error) {
      contentEl.innerHTML = '<p class="empty">' + escapeHtml(error.message || "Could not load stories.") + " Open this site over a local server, not as a file on disk.</p>";
      countEl.textContent = "";
    });
})();
