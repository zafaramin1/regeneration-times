(function () {
  "use strict";

  var TRIALS = "Clinical Trials & Experimental Opportunities";
  var articles = [];
  var sortMode = "relevance";
  var query = "";

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

  function matches(article, needle) {
    if (!needle) {
      return true;
    }
    var haystack = [article.title, article.summary, article.source, article.category]
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

  function cardHtml(article, section, index) {
    var lead = section.kind === "top" && index === 0 ? " card--lead" : "";
    var score = article.relevance_score == null || article.relevance_score === ""
      ? ""
      : '<span class="score">Relevance ' + escapeHtml(article.relevance_score) + "</span>";
    var evidence = article.evidence_level
      ? '<span class="evidence">' + escapeHtml(article.evidence_level) + "</span>"
      : "";
    var dateNote = article.date_note
      ? '<p class="date-note">' + escapeHtml(article.date_note) + "</p>"
      : "";
    var summary = article.summary
      ? '<p class="summary">' + escapeHtml(article.summary) + "</p>"
      : "";
    var why = article.why_it_matters
      ? '<p class="why"><span class="label">Why it matters. </span>' + escapeHtml(article.why_it_matters) + "</p>"
      : "";

    return (
      '<article class="card' + lead + '" id="' + escapeHtml(section.id + "--" + (article.id || index)) + '">' +
        '<p class="kicker">' + escapeHtml(article.category || "Story") + "</p>" +
        "<h3><a href=\"" + escapeHtml(article.url || "#") + "\" target=\"_blank\" rel=\"noopener noreferrer\">" +
          escapeHtml(article.title || "Untitled") +
          '<span class="sr-only"> (opens in a new tab)</span></a></h3>' +
        '<p class="byline"><span class="source">' + escapeHtml(article.source || "") + "</span>" +
          (article.date_published
            ? '<time datetime="' + escapeHtml(article.date_published) + '">' + escapeHtml(formatDate(article.date_published)) + "</time>"
            : "") +
        "</p>" +
        dateNote +
        (evidence || score ? '<p class="meta">' + evidence + score + "</p>" : "") +
        summary +
        why +
        trialHtml(article) +
      "</article>"
    );
  }

  function render() {
    var view = buildSections(articles);
    var needle = query.trim();

    navEl.innerHTML = view.sections.map(function (section) {
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
        return cardHtml(article, section, index);
      }).join("");
      return (
        '<section class="section' + (section.kind === "trials" ? " section--trials" : "") + '" id="' + escapeHtml(section.id) + '" aria-labelledby="heading-' + escapeHtml(section.id) + '">' +
          '<h2 class="section-head" id="heading-' + escapeHtml(section.id) + '">' + escapeHtml(section.title) + "</h2>" +
          kicker +
          '<div class="cards">' + cards + "</div>" +
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
