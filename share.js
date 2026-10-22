(function () {
  "use strict";
  var dialog = document.getElementById("reader-form-dialog");
  var frame = document.getElementById("reader-form-frame");
  var heading = document.getElementById("reader-form-heading");
  var fallback = document.getElementById("reader-form-fallback");
  var returnFocus = null;

  function openPanelFromHash() {
    var id = window.location.hash.slice(1);
    if (["share", "ideas", "subscribe"].indexOf(id) !== -1) {
      var panel = document.getElementById(id);
      if (panel) { panel.open = true; }
    }
  }
  document.addEventListener("click", function (event) {
    var action = event.target.closest("[data-reader-form]");
    if (action && dialog && typeof dialog.showModal === "function") {
      event.preventDefault();
      returnFocus = action;
      var kind = action.getAttribute("data-reader-form");
      heading.textContent = kind === "subscribe" ? "Stay connected" : kind === "idea" ? "Share an idea" : "Share Your Story";
      frame.title = heading.textContent;
      frame.src = action.href + (action.href.indexOf("?") === -1 ? "?" : "&") + "embedded=true";
      fallback.href = action.href;
      dialog.showModal();
      document.getElementById("reader-form-close").focus();
      return;
    }
    var link = event.target.closest('a[href^="#"]');
    if (link) {
      var panel = document.getElementById(link.getAttribute("href").slice(1));
      if (panel && panel.classList.contains("community-panel")) { panel.open = true; }
    }
  });
  if (dialog) {
    document.getElementById("reader-form-close").addEventListener("click", function () { dialog.close(); });
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) {
        var rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) { dialog.close(); }
      }
    });
    dialog.addEventListener("close", function () {
      frame.removeAttribute("src");
      if (returnFocus) { returnFocus.focus(); }
    });
  }
  window.addEventListener("hashchange", openPanelFromHash);
  openPanelFromHash();
})();
