(function () {
  "use strict";
  var dialog = document.getElementById("care-desk-dialog");
  var context = null, stories = [], readingLoaded = false, pendingReading = null, timeline = [], returnFocus = null;
  var questions = document.getElementById("desk-questions");
  var feedback = document.getElementById("desk-feedback");
  var backupInput = document.getElementById("desk-backup-file");
  var functions = {grasp:"holding or releasing",dexterity:"precise finger movements",clench:"clenching / hard to open",weak:"weakness / loss of use",sensation:"numbness / less feeling",walking:"walking / balance",vision:"eye movement / vision",planning:"planning a movement"};
  var timing = {unknown:"not sure",before:"before any surgery or other treatment",after:"after surgery or another treatment",both:"before treatment, with later changes too",injury:"at or after an accident / injury"};
  var site = {Brain:"Brain",Spine:"Spinal cord","Peripheral nerve":"Brachial plexus","Peripheral nerve-individual":"Individual peripheral nerve",multiple:"More than one site"};
  function el(tag, text, className) { var node=document.createElement(tag); if(text!==undefined)node.textContent=text; if(className)node.className=className; return node; }
  function emit(name, detail) { window.dispatchEvent(new CustomEvent(name,{detail:detail})); }
  function notify(message) { feedback.textContent=message; }
  function switchPanel(name) {
    if (["context","notes","files"].indexOf(name)===-1)name="context";
    dialog.querySelectorAll("[data-desk-panel]").forEach(function(panel){panel.hidden=panel.getAttribute("data-desk-panel")!==name;});
    dialog.querySelectorAll("[data-desk-tab]").forEach(function(button){button.setAttribute("aria-pressed",String(button.getAttribute("data-desk-tab")===name));});
    document.getElementById("desk-clear-confirm").hidden=true;
  }
  function open(name, trigger) {
    returnFocus=trigger||document.activeElement; switchPanel(name); notify("");
    emit("rt-care-context-request"); emit("rt-care-reading-request");
    if(!dialog.open)dialog.showModal(); document.body.classList.add("care-desk-open"); document.getElementById("care-desk-close").focus();
  }
  document.addEventListener("click",function(event){var button=event.target.closest("[data-open-care-desk]");if(button)open(button.getAttribute("data-open-care-desk"),button);});
  document.getElementById("care-desk-close").addEventListener("click",function(){dialog.close();});
  dialog.addEventListener("close",function(){document.body.classList.remove("care-desk-open");document.getElementById("desk-clear-confirm").hidden=true;if(returnFocus&&returnFocus.isConnected)returnFocus.focus({preventScroll:true});});
  dialog.addEventListener("click",function(event){if(event.target!==dialog)return;var box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();});
  dialog.querySelectorAll("[data-desk-tab]").forEach(function(button){button.addEventListener("click",function(){switchPanel(button.getAttribute("data-desk-tab"));});});
  function contextLines() {
    if(!context)return ["No questionnaire answers entered."];
    return ["Known condition/event: "+(context.cause||"Not known / not specified"),"Areas: "+(context.areas.join(", ")||"Not specified"),"Age group: "+(context.age==="all"?"Not specified":context.age),"Function: "+(context.functions.map(function(key){return functions[key];}).join(", ")||"Not specified"),"First appeared: "+timing[context.timing]].concat(context.site?["Reported injury site: "+site[context.site]]:[]).concat(context.context?["Additional context: "+context.context]:[]);
  }
  function renderContext() {
    var box=document.getElementById("desk-context-summary");box.replaceChildren();
    if(!context){box.append(el("p","No questionnaire answers entered yet.","community-note"));}
    else {var list=el("dl");contextLines().forEach(function(line){var split=line.indexOf(": ");list.append(el("dt",line.slice(0,split)),el("dd",line.slice(split+2)));});box.append(list);}
    document.getElementById("desk-use-context").hidden=!context;
    document.getElementById("desk-edit-context").textContent=context?"Edit my situation":"Choose my situation";
  }
  window.addEventListener("rt-care-context",function(event){context=event.detail;renderContext();});
  document.getElementById("desk-edit-context").addEventListener("click",function(){dialog.close();document.querySelector("[data-open-guide]").click();});
  document.getElementById("desk-use-context").addEventListener("click",function(){dialog.close();emit("rt-care-use-context");});
  document.getElementById("desk-find-reading").addEventListener("click",function(){dialog.close();document.getElementById("q").focus();document.querySelector(".reader-index").scrollIntoView({block:"start",behavior:"auto"});});
  function renderReading() {
    var box=document.getElementById("desk-reading-list");box.replaceChildren();
    if(!readingLoaded){box.append(el("p","The journal library has not loaded. Notes still work; wait for the stories or reload after exporting your entries.","community-note"));return;}
    if(!stories.length){box.append(el("p","No saved reading yet. Close this panel and use Save on a story, then return here.","community-note"));return;}
    stories.forEach(function(story){var row=el("article");row.append(el("h5",story.title),el("p",story.evidence_level||story.tags.stage,"community-note"));var link=el("a","Original source ↗");try{var url=new URL(story.url);if(url.protocol==="https:"){link.href=url.href;link.target="_blank";link.rel="noopener noreferrer";row.append(link);}}catch(e){}box.append(row);});
  }
  window.addEventListener("rt-care-reading",function(event){readingLoaded=event.detail.loaded;stories=event.detail.stories;if(readingLoaded&&pendingReading){var ids=pendingReading;pendingReading=null;emit("rt-care-restore-reading",ids);}renderReading();});
  function renderTimeline(){var list=document.getElementById("desk-timeline-list");list.replaceChildren();document.getElementById("desk-timeline-count").textContent=timeline.length+(timeline.length===1?" entry":" entries");timeline.forEach(function(item,index){var row=el("li");row.append(el("time",item.date),el("p",item.text));var remove=el("button","Remove","quiet-button");remove.type="button";remove.setAttribute("aria-label","Remove timeline entry "+(index+1));remove.addEventListener("click",function(){timeline.splice(index,1);renderTimeline();document.getElementById("desk-event-date").focus();});row.append(remove);list.append(row);});}
  document.getElementById("desk-timeline-form").addEventListener("submit",function(event){event.preventDefault();if(timeline.length>=100){notify("This backup supports up to 100 timeline entries.");return;}var data=new FormData(event.currentTarget);var date=String(data.get("date")),text=String(data.get("event")).trim();if(!validDate(date)||!text){notify("Add a valid date and a short observation first.");return;}timeline.push({date:date,text:text});timeline.sort(function(a,b){return a.date.localeCompare(b.date);});event.currentTarget.reset();renderTimeline();notify("Timeline entry added for this visit. Export a backup to keep it.");});
  function download(name,text,type){var url=URL.createObjectURL(new Blob([text],{type:type}));var link=document.createElement("a");link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);}
  function note(){return ["THE REGENERATION TIMES | CARE DISCUSSION NOTE","Prepared "+new Date().toLocaleDateString()+". Self-entered information, not a diagnosis.","\nMY CONTEXT",contextLines().join("\n"),"\nQUESTIONS AND NOTES",questions.value||"Not entered","\nTIMELINE",timeline.map(function(item){return item.date+": "+item.text;}).join("\n")||"No entries","\nREADING TO DISCUSS",stories.map(function(story){return [story.title,story.source+" | "+story.date_published,story.evidence_level,story.url,story.limitation?"Limitation: "+story.limitation:"",story.care_question?"Question: "+story.care_question:""].filter(Boolean).join("\n");}).join("\n\n")||"No saved reading","\nA topic match does not establish diagnosis, treatment benefit or trial eligibility. Check each original source, population, treatment timing, exclusions and current status with the care team."].join("\n");}
  document.getElementById("desk-download-note").addEventListener("click",function(){download("regeneration-care-note.txt",note(),"text/plain;charset=utf-8");notify("Appointment note downloaded. Review personal details before sharing it.");});
  document.getElementById("desk-export").addEventListener("click",function(){download("regeneration-care-desk-backup.json",JSON.stringify({format:"regeneration-care-desk",version:1,exported_at:new Date().toISOString(),context:context,questions:questions.value,timeline:timeline,saved_story_ids:stories.map(function(story){return story.id;}).concat(pendingReading||[])},null,2),"application/json");notify("Backup downloaded. Keep it in a private location; it is not an automatic cloud save.");});
  document.getElementById("desk-import").addEventListener("click",function(){backupInput.click();});
  function validChoice(name,value){var control=document.getElementById("guided-form").elements.namedItem(name);return typeof value==="string"&&Array.prototype.some.call(control.options,function(option){return option.value===value;});}
  function choices(name,value){return Array.isArray(value)&&value.length<=20&&value.every(function(item){return typeof item==="string"&&Array.prototype.some.call(document.querySelectorAll('#guided-form input[name="'+name+'"]'),function(input){return input.value===item;});});}
  function cleanContext(value){if(value===null)return null;if(!value||typeof value!=="object"||!["cause","age","timing","site"].every(function(key){return validChoice(key,value[key]);})||!choices("area",value.areas)||!choices("function",value.functions)||!choices("interest",value.interests)||typeof value.context!=="string"||value.context.length>1200)throw new Error("The backup contains invalid questionnaire answers.");return {cause:value.cause,age:value.age,timing:value.timing,site:value.cause==="Trauma"?value.site:"",areas:value.areas,functions:value.functions,interests:value.interests,context:value.context};}
  function validDate(value){if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;var date=new Date(value+"T00:00:00Z");return !isNaN(date.valueOf())&&date.toISOString().slice(0,10)===value;}
  backupInput.addEventListener("change",async function(){var file=backupInput.files[0];if(!file)return;try{if(file.size>250000)throw new Error("Choose a care-desk JSON backup smaller than 250 KB.");var data=JSON.parse(await file.text());if(!data||data.format!=="regeneration-care-desk"||data.version!==1)throw new Error("Choose a backup exported from My care desk on this journal.");var restored=cleanContext(data.context);if(typeof data.questions!=="string"||data.questions.length>6000||!Array.isArray(data.timeline)||data.timeline.length>100||!data.timeline.every(function(item){return item&&validDate(item.date)&&typeof item.text==="string"&&item.text.length<=1000;})||!Array.isArray(data.saved_story_ids)||data.saved_story_ids.length>1000||!data.saved_story_ids.every(function(id){return typeof id==="string"&&id.length<=200;}))throw new Error("This backup contains invalid notes, timeline entries or story IDs.");questions.value=data.questions;timeline=data.timeline.map(function(item){return {date:item.date,text:item.text};});renderTimeline();emit("rt-care-restore-context",restored);if(readingLoaded)emit("rt-care-restore-reading",data.saved_story_ids);else pendingReading=data.saved_story_ids;notify("Backup opened in this page. Personal entries were restored; known story IDs were merged with saved reading. Nothing was uploaded.");}catch(error){notify(error.message||"The backup could not be opened. Your current entries were kept.");}backupInput.value="";});
  document.getElementById("desk-clear").addEventListener("click",function(){document.getElementById("desk-clear-confirm").hidden=false;document.getElementById("desk-clear-no").focus();});
  document.getElementById("desk-clear-no").addEventListener("click",function(){document.getElementById("desk-clear-confirm").hidden=true;document.getElementById("desk-clear").focus();});
  document.getElementById("desk-clear-yes").addEventListener("click",function(){questions.value="";timeline=[];document.getElementById("desk-timeline-form").reset();renderTimeline();emit("rt-care-clear-context");document.getElementById("desk-clear-confirm").hidden=true;notify("Personal entries cleared from this page. Saved reading and downloaded copies remain.");document.getElementById("desk-clear").focus();});
  window.addEventListener("beforeunload",function(event){if(context||questions.value||timeline.length)event.preventDefault();});
})();
