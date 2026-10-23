(function () {
  "use strict";
  var form = document.getElementById("guided-form");
  var guide = document.getElementById("guided-dialog");
  var learn = document.getElementById("learn-dialog");
  var records = document.getElementById("records-dialog");
  var result = document.getElementById("guided-results");
  var step = 0;
  var answers = null;
  var focusBefore = new WeakMap();
  var functionLabels = {grasp:"holding or releasing", dexterity:"precise finger movements", clench:"clenching / hard to open", weak:"weakness / loss of use", sensation:"numbness / less feeling", walking:"walking / balance", vision:"eye movement / vision", planning:"planning a movement"};
  var timingLabels = {unknown:"not sure", before:"before any surgery or other treatment", after:"after surgery or another treatment", both:"before treatment, with later changes too", injury:"at or after an accident / injury"};
  var functionQueries = {grasp:"grasp", dexterity:"dexterity", clench:"clench", weak:"weakness", sensation:"numbness", walking:"walking", vision:"vision", planning:"motor planning"};
  function escape(text) { return String(text || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function open(dialog) {
    focusBefore.set(dialog, document.activeElement);
    dialog.returnValue = "";
    dialog.showModal();
    dialog.querySelector("[data-close-dialog]").focus();
  }
  [guide, learn, records].forEach(function (dialog) {
    dialog.querySelector("[data-close-dialog]").addEventListener("click",function () { dialog.close(); });
    dialog.addEventListener("click", function (event) {
      if (event.target !== dialog) { return; }
      var rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) { dialog.close(); }
    });
    dialog.addEventListener("close", function () { if (dialog.returnValue === "applied") { document.getElementById("guided-results-heading").focus(); return; } var prior = focusBefore.get(dialog); if (prior && prior.isConnected) { prior.focus(); } });
  });
  document.addEventListener("click",function (event) {
    if (event.target.closest("[data-open-guide]")) { showStep(0); open(guide); }
    if (event.target.closest("[data-open-learn]")) { open(learn); }
    if (event.target.closest("[data-open-records]")) { open(records); }
  });
  document.getElementById("learn-start-guide").addEventListener("click", function () { learn.close(); showStep(0); open(guide); });
  function showStep(next) {
    step = Math.max(0, Math.min(2, next));
    form.querySelectorAll("[data-guide-step]").forEach(function (panel, index) { panel.hidden = index !== step; });
    document.getElementById("guided-progress").textContent = "Step " + (step + 1) + " of 3 · " + ["The situation","Function and timing","What to explore"][step];
    document.getElementById("guide-back").hidden = step === 0;
    document.getElementById("guide-next").hidden = step === 2;
    document.getElementById("guide-submit").hidden = step !== 2;
    guide.scrollTop = 0;
  }
  document.getElementById("guide-next").addEventListener("click",function () { showStep(step + 1); form.querySelector('[data-guide-step="' + step + '"] select, [data-guide-step="' + step + '"] input').focus(); });
  document.getElementById("guide-back").addEventListener("click",function () { showStep(step - 1); });
  document.getElementById("guide-cause").addEventListener("change",function () { document.getElementById("guide-injury-site").hidden = this.value !== "Trauma"; });
  function collect() {
    var data = new FormData(form);
    return {cause:data.get("cause"),areas:data.getAll("area"),age:data.get("age"),functions:data.getAll("function"),timing:data.get("timing"),site:data.get("cause") === "Trauma" ? data.get("site") : "",context:String(data.get("context") || "").trim(),interests:data.getAll("interest")};
  }
  function apply(options) {
    if (!answers) { return; }
    window.dispatchEvent(new CustomEvent("rt-guided-search",{detail:{areas:answers.areas,cause:answers.cause,age:answers.age,query:options && options.query || "",approaches:options && options.approaches || [],stages:options && options.stages || [],target:options && options.target || "stories"}}));
  }
  function routeDetails() {
    var hand = answers.areas.indexOf("Hand") !== -1 || answers.areas.indexOf("Arm") !== -1;
    var assessment = answers.cause === "Brain tumor" || answers.cause === "Spine tumor" ? "Ask the tumor team and a rehabilitation physician to connect symptoms, examination findings and imaging. Do not assume all difficulties were caused by surgery." : answers.cause === "Trauma" ? (answers.site ? "Bring the confirmed injury-site information to the appropriate rehabilitation or nerve team. A site entered here has not been independently verified." : "First ask the clinical team to locate the injury: brain, spinal cord, brachial plexus or an individual nerve. Loss of arm use alone does not identify the location.") : "Ask a rehabilitation physician or treating clinician to identify the main mechanism and the appropriate assessment route.";
    if (hand && answers.functions.indexOf("clench") !== -1) { assessment += " For a clenched hand, ask whether muscle overactivity, abnormal posturing, fixed shortening or weakness is limiting opening and release. These possibilities need an examination."; }
    if (answers.functions.indexOf("vision") !== -1 || answers.areas.indexOf("Eye") !== -1) { assessment += " Ask whether neuro-ophthalmology assessment is appropriate for the eye concern."; }
    var timing = answers.timing === "before" || answers.timing === "both" ? "Your note records symptoms before treatment. A postoperative-only study is not evidence for the same situation; check whether pre-existing deficits were included and measured separately." : answers.timing === "after" ? "Your note records symptoms after treatment. Check the exact treatment, time since treatment and baseline function in each study." : answers.timing === "injury" ? "Your note records symptoms at or after injury. Check the injury location, completeness and time since injury in each source." : "Timing is uncertain. Keep it uncertain until records or the clinical team clarify it.";
    var research = '<p>' + escape(timing) + ' Age, symptoms and timing are not currently automatic article filters. Every source still needs an individual relevance and eligibility check.</p>';
    research += '<div class="guide-actions"><button type="button" class="quiet-button" data-guide-focus="all">All matching topics</button>';
    if (answers.interests.indexOf("rehab") !== -1) { research += '<button type="button" class="quiet-button" data-guide-focus="rehab">Narrow to rehabilitation</button>'; }
    if (answers.interests.indexOf("trials") !== -1) { research += '<button type="button" class="quiet-button" data-guide-focus="trials">Trial-tagged stories</button>'; }
    if (answers.interests.indexOf("cells") !== -1) { research += '<button type="button" class="quiet-button" data-guide-focus="cells">Cell research</button>'; }
    research += '</div>';
    if (answers.interests.indexOf("trials") !== -1) { research += '<p>Trial matches are leads only. The registry and study team must confirm diagnosis, age, timing, inclusion and exclusion criteria, and current recruitment.</p>'; }
    if (answers.interests.indexOf("cells") !== -1) { research += '<p>Cell research may have no match for this cause and body area. Findings in stroke or spinal-cord injury do not establish benefit for brain-tumor hand problems. <a href="https://www.fda.gov/vaccines-blood-biologics/consumers-biologics/important-patient-and-consumer-information-about-regenerative-medicine-therapies" target="_blank" rel="noopener noreferrer">Read FDA’s cautions ↗</a>.</p>'; }
    if (answers.functions.length) {
      research += '<p class="community-note">Optional: try one function term at a time. These are keyword refinements, not clinical matching.</p><div class="guide-actions">' + answers.functions.map(function (key) { return '<button type="button" class="quiet-button" data-guide-term="' + escape(key) + '">' + escape(functionLabels[key]) + '</button>'; }).join("") + '</div>';
    }
    var support = answers.interests.indexOf("nutrition") !== -1 ? '<p>Nutrition is supportive care, not evidence of nerve regrowth or restored hand control. Ask an oncology dietitian about adequate energy, protein and fluids for your situation. Check herbs, supplements and restrictive diets with the care team because interactions and nutritional risks matter.</p><p><a href="https://tischbraintumorcenter.duke.edu/blog/brain-tumor-diet-tips-foods-brain-tumor-patients" target="_blank" rel="noopener noreferrer">Duke: brain tumor nutrition, June 3, 2026 ↗</a><br><a href="https://www.cancer.gov/about-cancer/treatment/side-effects/nutrition" target="_blank" rel="noopener noreferrer">NCI: nutrition during cancer ↗</a><br><a href="https://www.cancer.gov/about-cancer/treatment/cam" target="_blank" rel="noopener noreferrer">NCI: complementary approaches and safety ↗</a></p>' : '<p>Bring a small number of useful sources and a practical goal to your team. Ask what is established care, what is experimental, and which outcomes matter for everyday life.</p><button type="button" class="quiet-button" data-open-learn>Food, stem cells and reading the evidence</button>';
    return '<details open><summary>01 · Assessment &amp; care</summary><p>' + escape(assessment) + '</p></details><details><summary>02 · Research &amp; trials</summary>' + research + '</details><details><summary>03 · ' + (answers.interests.indexOf("nutrition") !== -1 ? 'Food &amp; supportive care' : 'Prepare for a useful conversation') + '</summary>' + support + '</details>';
  }
  form.addEventListener("submit",function (event) {
    event.preventDefault();
    if (step < 2) { showStep(step + 1); return; }
    answers = collect();
    document.getElementById("guided-route-summary").textContent = "Starting topics: " + (answers.cause || "cause not specified") + " · " + (answers.areas.length ? answers.areas.join(" / ") : "body area not specified") + ". Timing: " + timingLabels[answers.timing] + ".";
    document.getElementById("guided-route-scope").textContent = "These are educational leads based on your answers, not a diagnosis or a confirmed match. The initial search uses body area and cause only. Age is applied to care resources only; services marked ‘confirm age’ are excluded when an age group is selected. Use the buttons below to reapply this route after changing filters.";
    document.getElementById("guided-route-grid").innerHTML = routeDetails();
    result.hidden = false;
    apply(); guide.close("applied");
    document.getElementById("guided-results-heading").focus();
    result.scrollIntoView({block:"start",behavior:"auto"});
  });
  result.addEventListener("click",function (event) {
    var focus = event.target.closest("[data-guide-focus]");
    var term = event.target.closest("[data-guide-term]");
    if (focus) {
      var type = focus.getAttribute("data-guide-focus");
      apply({approaches:type === "rehab" ? ["Rehab"] : type === "cells" ? ["Stem cells","Cell therapy"] : [],stages:type === "trials" ? ["Human trial","Recruiting trial"] : []});
    }
    if (term) { apply({query:functionQueries[term.getAttribute("data-guide-term")]}); }
  });
  document.getElementById("guided-view-stories").addEventListener("click",function () { apply(); });
  document.getElementById("guided-view-care").addEventListener("click",function () { apply({target:"care"}); });
  document.getElementById("guided-copy-note").addEventListener("click",function () {
    if (!answers) { return; }
    var siteLabels = {Brain:"Brain",Spine:"Spinal cord","Peripheral nerve":"Brachial plexus","Peripheral nerve-individual":"Individual peripheral nerve",multiple:"More than one site"};
    var note = "Discussion note prepared with The Regeneration Times. Self-entered context, not a diagnosis.\n\nKnown condition/event: " + (answers.cause || "Not specified") + "\nAreas: " + (answers.areas.join(", ") || "Not specified") + "\nAge group: " + (answers.age === "all" ? "Not specified" : answers.age) + "\nFunction: " + (answers.functions.map(function (k) { return functionLabels[k]; }).join(", ") || "Not specified") + "\nFirst appeared: " + timingLabels[answers.timing] + (answers.site ? "\nReported injury site: " + siteLabels[answers.site] : "") + (answers.context ? "\nAdditional context: " + answers.context : "") + "\n\nQuestions for my team:\nWhat does the examination and imaging suggest is limiting function?\nWhich rehabilitation or specialist assessment fits this mechanism?\nDoes a study include this diagnosis, age and symptom/treatment timing?\nWhat are realistic functional goals and the main risks?\n\nThis note does not establish eligibility or recommend a treatment.";
    if (!navigator.clipboard || !navigator.clipboard.writeText) { document.getElementById("guided-feedback").textContent = "Clipboard is unavailable. Your answers are still available under Edit answers."; return; }
    navigator.clipboard.writeText(note).then(function () { document.getElementById("guided-feedback").textContent = "Discussion note copied. Review the personal details before sharing it. Nothing was sent to the site."; }).catch(function () { document.getElementById("guided-feedback").textContent = "Could not copy. Your answers remain under Edit answers."; });
  });
  function clearAnswers() {
    answers = null; form.reset(); document.getElementById("guide-injury-site").hidden = true;
    document.getElementById("guided-route-grid").replaceChildren(); document.getElementById("guided-route-summary").textContent = ""; document.getElementById("guided-feedback").textContent = "Answers stay in this page until you clear them or reload. No questionnaire answers are submitted.";
    result.hidden = true; showStep(0); document.querySelector("[data-open-guide]").focus();
    window.dispatchEvent(new CustomEvent("rt-guided-clear"));
  }
  document.getElementById("guided-clear").addEventListener("click",clearAnswers);
  document.getElementById("guide-reset").addEventListener("click", function () { clearAnswers(); guide.querySelector("[data-close-dialog]").focus(); });
})();
