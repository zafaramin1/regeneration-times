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
      return matches(article, needle);
    });
    if (needle) {
      return {
        filteredCount: filtered.length,
        sections: filtered.length
          ? [{
              id: "search-results",
              title: "Search results",
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
    var score = article.relevance_score == null || article.relevance_score === ""
      ? ""
      : '<span class="score" title="Relevance score"><span class="sr-only">Relevance </span>' + escapeHtml(article.relevance_score) + '<span class="score-of" aria-hidden="true">/10</span></span>';
    var date = article.date_published
      ? '<time datetime="' + escapeHtml(article.date_published) + '">' + escapeHtml(formatShortDate(article.date_published)) + "</time>"
      : "";
    var tags = tagList(article);
    var tagLine = tags.length
      ? '<p class="entry-tags"><span class="sr-only">Tags: </span>' + tags.map(function (t) {
          return '<span class="chip">' + escapeHtml(t) + "</span>";
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
      ["Relevance", article.relevance_score == null || article.relevance_score === ""
        ? ""
        : article.relevance_score + (article.relevance_reason ? ". " + article.relevance_reason : "")],
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
            ((date || score) ? '<p class="head-meta">' + date + score + "</p>" : "") +
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

  function render() {
    var view = buildSections(articles);
    var needle = query.trim();

    navEl.innerHTML = '<a href="#share" class="nav-share">Share Your Story</a>' +
      '<a href="#subscribe" class="nav-share">Subscribe</a>' +
      view.sections.map(function (section) {
        return '<a href="#' + escapeHtml(section.id) + '">' + escapeHtml(section.title) + "</a>";
      }).join("");

    if (!view.sections.length) {
      contentEl.innerHTML = '<p class="empty">No stories match “' + escapeHtml(needle) + "”.</p>";
      countEl.textContent = "0 of " + articles.length + " stories";
      return;
    }

    contentEl.innerHTML = view.sections.map(function (section) {
      var deck = "";
      if (section.kind === "top" || section.kind === "search") {
        deck = sortMode === "newest"
          ? "Sorted newest first"
          : "Ranked by relevance score";
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

    if (needle) {
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
      render();
    })
    .catch(function (error) {
      contentEl.innerHTML = '<p class="empty">' + escapeHtml(error.message || "Could not load stories.") + " Open this site over a local server, not as a file on disk.</p>";
      countEl.textContent = "";
    });
})();
