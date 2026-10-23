(function () {
  "use strict";
  var dialog = document.getElementById("reader-form-dialog");
  var heading = document.getElementById("reader-form-heading");
  var form = document.getElementById("reader-native-form");
  var panel = document.getElementById("reader-confirmation-panel");
  var frame = document.getElementById("reader-google-confirmation");
  var returnFocus = null;
  var signupUrl = "https://docs.google.com/forms/d/e/1FAIpQLScNjbh3MGGJ4XBbH-c5XoxSv6GKkKhMehFoVSpKusRleDggYw/formResponse?embedded=true";
  var communityUrl = "https://docs.google.com/forms/d/e/1FAIpQLSdw9bXOQK1V2egSt2itsixRUxW39B0M6kInhjCutJ3d8m4pWw/formResponse?embedded=true";
  function resetView() { form.hidden = false; panel.hidden = true; frame.removeAttribute("src"); document.getElementById("reader-submit").disabled = false; }
  function openPanelFromHash() {
    var id = window.location.hash.slice(1);
    if (["share", "ideas", "subscribe"].indexOf(id) !== -1) { var panel = document.getElementById(id); if (panel) { panel.open = true; } }
  }
  document.addEventListener("click", function (event) {
    var action = event.target.closest("[data-reader-form]");
    if (action && dialog && typeof dialog.showModal === "function") {
      event.preventDefault(); returnFocus = action; form.reset(); resetView();
      var kind = action.getAttribute("data-reader-form");
      var signup = kind === "subscribe";
      form.action = signup ? signupUrl : communityUrl;
      heading.textContent = signup ? "Stay connected" : kind === "idea" ? "Share an idea" : "Share Your Story";
      document.getElementById("reader-form-description").textContent = signup ? "Join The Regeneration Times for free research and recovery updates." : "Tell us what would help, or share your recovery experience. Your email is required so we can reply. Please omit identifying patient information.";
      document.getElementById("reader-message-fields").hidden = signup;
      document.getElementById("reader-message").required = !signup;
      document.getElementById("reader-message").disabled = signup;
      document.getElementById("reader-permission").disabled = signup;
      document.getElementById("reader-submission-type").disabled = signup;
      document.getElementById("reader-submission-type").value = kind === "story" ? "Personal story" : "Idea or feedback";
      document.getElementById("reader-consent-text").textContent = signup ? "I agree to join the email list and send my details through Google Forms." : "I agree to send this submission and my email to the editors through Google Forms, with the publication choice above.";
      document.getElementById("reader-submit").textContent = signup ? "Join the email list" : "Send to the editors";
      dialog.showModal(); document.getElementById("reader-form-close").focus(); return;
    }
    var link = event.target.closest('a[href^="#"]');
    if (link) { var box = document.getElementById(link.getAttribute("href").slice(1)); if (box && box.classList.contains("community-panel")) { box.open = true; } }
  });
  form.addEventListener("submit", function () {
    // Native POST displays Google's actual confirmation or error. An iframe load is never treated as success.
    panel.hidden = false; form.hidden = true; document.getElementById("reader-submit").disabled = true;
  });
  document.getElementById("reader-try-again").addEventListener("click", function () { resetView(); document.getElementById("reader-email").focus(); });
  document.getElementById("reader-form-close").addEventListener("click", function () { dialog.close(); });
  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) { var rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) { dialog.close(); } }
  });
  dialog.addEventListener("close", function () { form.reset(); resetView(); if (returnFocus) { returnFocus.focus(); } });
  window.addEventListener("hashchange", openPanelFromHash); openPanelFromHash();
})();
