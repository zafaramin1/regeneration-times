(function () {
  "use strict";
  var dialog = document.getElementById("reader-form-dialog");
  var heading = document.getElementById("reader-form-heading");
  var form = document.getElementById("reader-native-form");
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
      form.reset();
      var kind = action.getAttribute("data-reader-form");
      var signup = kind === "subscribe";
      heading.textContent = signup ? "Stay connected" : kind === "idea" ? "Share an idea" : "Share Your Story";
      document.getElementById("reader-form-description").textContent = signup ? "Join The Regeneration Times for free research and recovery updates." : "Tell us what would help, or share your recovery experience. Your email is required so we can reply.";
      document.getElementById("reader-message-fields").hidden = signup;
      document.getElementById("reader-message").required = !signup;
      document.getElementById("reader-submit").textContent = signup ? "Signup opens soon" : "Submissions open soon";
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
  // Backend deliberately deferred. Never claim collection without a confirmed response.
  form.addEventListener("submit", function (event) { event.preventDefault(); });
  document.getElementById("reader-form-close").addEventListener("click", function () { dialog.close(); });
  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) {
      var rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) { dialog.close(); }
    }
  });
  dialog.addEventListener("close", function () { form.reset(); if (returnFocus) { returnFocus.focus(); } });
  window.addEventListener("hashchange", openPanelFromHash);
  openPanelFromHash();
})();
