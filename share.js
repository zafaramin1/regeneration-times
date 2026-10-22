/*
 * Share Your Story form.
 * Change ONE line below to set where submissions go:
 *   SUBMIT_TO     email address used for the pre-filled mailto: fallback
 *   FORM_ENDPOINT URL of a form service (for example Formspree or a Google Apps Script).
 *                 When set, the form POSTs there instead of opening the email app.
 */
var SUBMIT_TO = "zafar@candlemenow.com";
var FORM_ENDPOINT = "";

(function () {
  "use strict";

  var form = document.getElementById("share-form");
  if (!form) {
    return;
  }
  var statusEl = document.getElementById("share-status");
  var thanksEl = document.getElementById("share-thanks");
  var submitBtn = document.getElementById("share-submit");
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function field(name) {
    return form.elements[name];
  }

  function value(name) {
    var el = field(name);
    return el ? String(el.value || "").trim() : "";
  }

  function setError(name, message) {
    var el = field(name);
    var err = document.getElementById("err-" + name);
    if (el) {
      if (message) {
        el.setAttribute("aria-invalid", "true");
      } else {
        el.removeAttribute("aria-invalid");
      }
    }
    if (err) {
      err.textContent = message || "";
    }
  }

  function validate() {
    var ok = true;
    var first = null;
    var email = value("email");
    if (!email) {
      setError("email", "Please enter your email so the editors can reply.");
      ok = false;
      first = first || field("email");
    } else if (!EMAIL_RE.test(email)) {
      setError("email", "That email address does not look right.");
      ok = false;
      first = first || field("email");
    } else {
      setError("email", "");
    }
    if (!value("message")) {
      setError("message", "Please write a few words before sending.");
      ok = false;
      first = first || field("message");
    } else {
      setError("message", "");
    }
    var consent = field("consent");
    if (!consent.checked) {
      setError("consent", "Please tick this box so we can share your submission.");
      ok = false;
      first = first || consent;
    } else {
      setError("consent", "");
    }
    if (first) {
      first.focus();
    }
    return ok;
  }

  function collect() {
    return {
      name: value("name"),
      email: value("email"),
      type: value("type"),
      title: value("title"),
      message: value("message"),
      link: value("link"),
      consent: field("consent").checked ? "yes" : "no",
      page: window.location.href,
      sent_at: new Date().toISOString()
    };
  }

  function mailtoHref(data) {
    var subject = "Share Your Story: " + (data.type || "Submission") + (data.title ? " | " + data.title : "");
    var body = [
      "Name / credit as: " + (data.name || "(not given)"),
      "Email: " + data.email,
      "Type: " + data.type,
      "Title: " + (data.title || "(none)"),
      "Link: " + (data.link || "(none)"),
      "Agrees to editing and publishing with credit: " + data.consent,
      "",
      "Message:",
      data.message
    ].join("\n");
    return "mailto:" + encodeURIComponent(SUBMIT_TO) +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
  }

  function showThanks(viaEmail) {
    thanksEl.querySelector(".share-thanks-extra").textContent = viaEmail
      ? "Your email app should open with your message ready. Please press Send there to deliver it to the editors."
      : "Your message has reached the editors.";
    form.hidden = true;
    thanksEl.hidden = false;
    thanksEl.focus();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    statusEl.textContent = "";
    if (!validate()) {
      statusEl.textContent = "Please check the highlighted fields.";
      return;
    }
    var data = collect();

    if (FORM_ENDPOINT) {
      submitBtn.disabled = true;
      statusEl.textContent = "Sending…";
      var body = new FormData();
      Object.keys(data).forEach(function (key) {
        body.append(key, data[key]);
      });
      fetch(FORM_ENDPOINT, {
        method: "POST",
        body: body,
        headers: { Accept: "application/json" }
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error("Send failed (" + response.status + ")");
          }
          form.reset();
          showThanks(false);
        })
        .catch(function () {
          statusEl.textContent = "We could not send that just now. Opening your email app instead.";
          window.location.href = mailtoHref(data);
          showThanks(true);
        })
        .then(function () {
          submitBtn.disabled = false;
        });
      return;
    }

    window.location.href = mailtoHref(data);
    showThanks(true);
  });

  document.getElementById("share-again").addEventListener("click", function () {
    form.reset();
    thanksEl.hidden = true;
    form.hidden = false;
    statusEl.textContent = "";
    field("name").focus();
  });
})();
