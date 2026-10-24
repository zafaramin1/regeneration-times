# The Regeneration Times

A free static news page for nerve repair and regeneration research: spinal cord and nerve roots, peripheral nerve repair, clinical trials, and related therapies. Plain HTML, CSS, and JavaScript. No build step and no backend.

Site: <https://zafaramin1.github.io/regeneration-times/>

## Add a story

Append one object to [`data/articles.json`](data/articles.json). The front page reads that file in the browser, so a new story does not need a new HTML page.

Fields the page uses:

| Field | Required | Role |
| --- | --- | --- |
| `id` | yes | Stable slug |
| `title` | yes | Headline on the closed scroll; tapping it opens the next level |
| `source` | yes | Publication or sponsor name |
| `url` | yes | Original article link, shown in the full details (opens in a new tab) |
| `date_published` | yes | `YYYY-MM-DD` |
| `date_added` | yes | `YYYY-MM-DD`; the newest value is shown as the file date |
| `category` | yes | Becomes its own section. `Clinical Trials & Experimental Opportunities` is listed separately |
| `tags` | yes | Object with four short tags (one or two words each), always in this order: `body_area`, `cause`, `approach`, `stage`. Shown under the headline on the closed scroll. Use the vocabulary below |
| `related_body_areas` | no | Array of additional body-area values explicitly supported by the source. Included in search, filter matching and filter counts, while the primary body-area tag remains on the closed scroll. Never infer a connection from unrelated research. |
| `quick_read` | yes | One plain-English paragraph (3 to 5 sentences) for non-experts: what the study or trial is, what it does, and what it could mean for people with nerve damage. Base it only on the source; no invented facts or numbers, no hype, no em dashes. Shown on the first tap |
| `summary` | yes | What the source reports (shown in the full details) |
| `why_it_matters` | yes | Short note under the summary |
| `relevance_reason` | no | One line explaining the ranking; internal only, never shown on the site |
| `relevance_score` | yes | Number; orders Top Stories internally. Never shown on the site |
| `evidence_level` | yes | Shown in the full details |
| `trial_url` | no | Registry link |
| `trial_status` | no | `status`, `phase`, `location`, `key_eligibility` |
| `date_note` | no | Clarifies `date_published` when needed |

### Tag vocabulary

Pick one value per key. Derive it honestly from the source; if the cause is not specific, use `Any cause` (or the injury type the source states, such as `Nerve gap`). When a nerve problem is caused by a tumor pressing on the brain or spinal cord, use exactly `Brain tumor` or `Spine tumor`, and only when the source says so. Add a new value only when none fits, keep it to one or two words, and add it to this list and to `VOCAB` at the top of `app.js` so it appears as a filter chip.

| Key | Allowed values |
| --- | --- |
| `body_area` | Brain, Neck spine, Back spine, Spine, Nerve root, Peripheral nerve, Arm, Hand, Leg, Face, Eye |
| `cause` | Trauma, Brain tumor, Spine tumor, Stroke, Diabetes, Chemotherapy, Disease, Surgery, Nerve gap, Any cause |
| `approach` | Drug, Stem cells, Scaffold, Nerve transfer, Stimulation, Surgery, Device, Rehab, Review, Assessment, Cell therapy, Gene therapy |
| `stage` | Lab study, Animal study, Human study, Human trial, Recruiting trial, Approved, Review |

Example:

```json
"tags": { "body_area": "Neck spine", "cause": "Trauma", "approach": "Drug", "stage": "Recruiting trial" }
```

Latest stays ordered by `date_published`. Top Stories is ordered by `relevance_score` behind the scenes (no score, rank number or score label is ever shown); the Relevance / Newest toggle reorders Top Stories, each category, and search results. Search matches significant words across title, tags, quick read, summary, source, evidence level, why it matters, and category, and shows one results list.

Each story renders as a parchment scroll with three levels:

Only one scroll is open at a time. Opening a scroll closes the previous one and centers the new scroll in the viewport (or aligns its top when it is taller than the viewport). A discreet burgundy Close control is available at its top right. Escape closes the active scroll.

1. Closed (default): headline, a small date on the right, and the four tags as smooth pewter pill capsules. Tapping a tag shows every story with that tag.
2. First tap (on the headline or entry): the Quick Read unrolls, with a "Read full details" control.
3. Second tap (or that control): the full details unroll: summary, why it matters, section, source, evidence level, date note, trial status and eligibility, trial link, and the link to the original article. It ends with the Close the Scroll emblem button, which rolls the scroll fully closed and brings its headline into view. Tapping the headline while fully open also closes it.

## Find what matters to you

Below the search box, tap buttons (chips) filter the stories by Body area, Cause, Treatment (`approach`) and Stage. Chips come from `VOCAB` in `app.js` plus any other tag value found in `data/articles.json`, so values people look for (such as Brain tumor or Stroke) show even before a story has them. Each chip shows how many stories match; chips with 0 are dimmed. Choices combine as AND across groups and OR within a group. Clear resets them. When nothing matches, the page says "No articles yet for ... New ones are added daily."

The filter is kept in the URL hash so a topic can be shared or bookmarked, for example `#cause=Brain%20tumor` or `#body_area=Hand&cause=Trauma`. Several values in one group are separated by commas. `treatment=` and `body=` also work as aliases.

The headline button and the "Read full details" button carry `aria-expanded`. The animation is CSS only and is turned off under `prefers-reduced-motion`.

When you change `styles.css`, `share.js` or `app.js`, bump the `?v=` version string on all asset links in `index.html` so phones load the new files.

## Reader guide, subscriptions, ideas and stories

A visible reading guide sits before the articles. The side rail has three fully collapsible panels: Share Your Story, Have an idea?, and Stay connected. Founder credit is in the footer.

Signup and community submissions use native POST forms in a dismissible dialog. They submit directly to the existing Google Forms, which write to the owner's private response workbook. The Google form is not embedded while the reader enters data, so no signed-in account banner appears in the native form. The Google response page is displayed in a visible iframe after submission. The site must not claim success merely because the POST was sent or the iframe loaded: only Google's explicit confirmation confirms recording. Required email, consent and community publication choices are validated before sending. Close clears local entries. Do not store emails or submissions in localStorage, public files or URL parameters.

Signup and community connection tests on October 23, 2026 were confirmed in the private response sheet and test cell values were cleared. Google Forms retains labeled test responses. Keep the workbook and upload folder restricted. Never publish response data or widen their sharing permissions. The Google Forms owner account email is absent from the anonymous responder and confirmation HTML checked that day. A separately opened Google service may show the current visitor's own signed-in account.

share.js handles the native dialog, consent, POST destinations, field mapping, return-to-form recovery and focus restoration. Field IDs and option text must match the published Google Forms schema. Recheck a real response-to-sheet and Google confirmation after changing the forms. If collection fails, say the response is unconfirmed and retain the user's fields for retry; never fabricate success.

## Guided reading and private context

guided.js provides an optional three-step questionnaire and a Learn more dialog with generic examples. No personal family history is published. Before-treatment, after-treatment, both and uncertain timing are separate answers. An accident does not automatically imply a peripheral-nerve injury. Self-entered context is not a diagnosis.

The initial guided search uses body-area and cause choices. Optional refinements use known approach/stage tags or one function keyword at a time. Age applies only to the care directory. Symptoms, exact age, injury site and treatment timing do not establish an article match or trial eligibility, and are not represented as validated filters. The discussion note explicitly retains timing and uncertainty. Original papers and registries still need an individual check, including exclusions. Do not infer benefit from a different underlying condition.

Questionnaire answers remain in page memory and form controls for this visit. They are not submitted, added to URLs, saved to localStorage, sent to Google Forms or used by AI. Only the generic search topics and deliberately selected keyword refinements are reflected in the shareable search URL. Clear answers resets both questionnaire and search; reload clears page memory. Copying the discussion note requires an explicit click and may include the reader's optional context, so remind them to review it before sharing.

Food/nutrition is presented as supportive care, with NCI and Duke source links, separately from experimental cell research and clinical trials. No claim is made that a food, supplement or cell product restores hand function. Background explanations link to NCI and FDA; sources were checked October 23, 2026. Keep adult/pediatric evidence and before/after treatment distinctions visible.

The Documents & AI review dialog links to a separate, voluntary Google Forms document route, available from Share Your Story or the guided results. It requires Google sign-in, explicit authorization/storage/editor-review consent, one PDF up to 10 MB and a reply email. Google records the uploader’s account name, email and photo with submitted files, as disclosed in the form and site dialog. Response links are stored in the separate Private Documents tab of the existing private workbook; files remain in the owner’s restricted Google Drive upload folder. Public response summaries and responder autosave are disabled. No document is attached from the questionnaire automatically. A labeled, synthetic PDF submission was confirmed through Google Forms into the Private Documents response tab and restricted upload folder on October 23, 2026. Test spreadsheet values were cleared and the two synthetic test files were moved to Trash; Forms retains the labeled test response. AI review is not connected, and file storage consent does not authorize AI processing or publication. Do not add medical documents, response data, API keys or private upload links to this public repository. A future AI service needs private processing, explicit separate consent, an accurate privacy notice and human review; do not claim diagnosis, scan interpretation, trial eligibility or regulated-record compliance.

## Search and reader tools

Search normalizes tumour/tumor, common movement and rehabilitation terms, and matches every significant query word anywhere in a story. It is deterministic keyword search, not diagnosis or an AI medical advisor. Synonyms must not turn a different underlying cause into a match. URL hash parameters include `q`, `published=90|365`, `human=1`, `saved=1`, and the existing topic groups. The publication window uses the original source date, not the date added. Lab and animal study exclusion does not imply that remaining research is established or approved.

Save buttons store only stable article IDs in this browser's localStorage. Saved reading is device-specific, and storage failures are announced. Search links do not transfer a user's saved list. Discussion notes copy a source, date, evidence type and a question for a care team, never personalized treatment instructions. Top Stories and Latest each preview six entries to reduce repetition; topic sections and search retain all entries.

Optional editorial fields: `limitation` (what the study does not establish), `care_question` (a discussion prompt), `verified_on` (date the source was checked, not a guarantee of clinical review). Evidence type is visible on closed cards. Original dates are retained for all backfilled coverage. Reviews may synthesize studies already covered; do not count a review as a distinct clinical trial.

## Run locally

Fetching the story file needs a local server:

```bash
python3 -m http.server 8080
```

Then open <http://127.0.0.1:8080/>.

## Publish

Publish with GitHub Pages from the `main` branch, folder `/` (root). `.nojekyll` is present so Pages does not run Jekyll.

## Disclaimer

For information only. Not medical advice. Talk to your doctor before considering any treatment or trial.


## Layout and shared editorial workflow

Topic buttons are compact word-sized rectangles that wrap across rows. Selected topics are black. Closed story scrolls use three columns on desktop, two on tablets, and one on phones. An opened scroll spans the entire grid width, with following stories flowing below it. Fine crosshatched paper texture, serif typography, parchment, and restrained wooden ends preserve the newspaper style.

Multiple editors or bots may add stories. Before every write:
1. Read the current `data/articles.json` and its blob SHA.
2. Check normalized source URLs, DOI, trial registry IDs, and the underlying study to avoid duplicate coverage.
3. Append only verified, original summaries using this schema. Preserve all existing entries and stable IDs.
4. Re-fetch immediately before committing. If the SHA changed, merge the addition into the latest version and check for duplicates again. On a conflict, repeat this process; never force-push or replace another editor's work with a stale copy.
5. Confirm that the result is valid JSON with unique IDs. Story-only contributors should not change presentation files.

Prioritize neurological problems and recovery associated with brain tumors. Clearly identify the evidence level and actual source publication date. Recheck trial recruitment status from its registry. A daily search is a target, not a reason to invent news, overstate results, or publish an unverified claim.


## Verified care resources

`data/resources.json` holds public program pages, specialist profiles and research contacts. The care directory is a separate, collapsible section connected to query words, body-area and cause selections. Article publication-date, approach, stage, saved-reading and animal-exclusion settings do not imply a filter on medical services. Age and location filters inside the directory apply only to resources. Services with unconfirmed age acceptance appear only under All ages. Recovery shortcuts set generic topic filters; they never publish a patient's history or diagnose the cause of symptoms.

Required resource fields: `id`, `name`, `kind` (Care program, Specialist profile, Research study), `location`, `age_groups` (adult, pediatric, or confirm), `body_areas`, `causes`, `focus`, `why_relevant`, `url`, `search_terms`, `caution`, `verified_on`, `source_urls`. Optional public `phone` and `email` must appear in an official institutional page or registry. Use the registry's research-contact email, not a guessed doctor's address. Match fields can indicate a potential assessment route for a symptom even when a general clinic has not explicitly confirmed the underlying diagnosis; the caution must state that distinction. Never say acceptance, availability, eligibility or clinical benefit is confirmed from a keyword match.

The directory is an initial curated list, not a top-ten ranking or endorsement. Do not manufacture best-doctor scores or infer a doctor's fit from a hospital's general ranking. Expand by demonstrated condition-specific clinical focus, adult/pediatric population, access route and geography. Source-check dates mean a page was reviewed, not that the program was contacted. Do not claim an email or phone works without testing it, and do not contact providers without the owner's explicit request.

Resource curation may update `data/resources.json` alongside article data. Before each write, fetch the current files and SHAs, deduplicate stable IDs, institutional programs and canonical URLs, preserve others' entries and use a branch-head lease. Do not add private patient information. Do not diagnose symptoms from descriptions. Trial indexing must inspect inclusion AND exclusion criteria, because a condition mentioned only as an exclusion is not a match; provide the exact registry link, source update date and caveats. Unproven cell products must not be presented as established nerve-repair treatments.

## Care desk on the original journal

`care-desk.js` adds an optional right-hand dialog over the existing journal, opened from My care desk in the masthead or the floating button. It uses the existing questionnaire in `guided.js`, the existing `app.js` search/filter engine, and the same saved-story list. It is not a second website, article collection or search engine. Closing returns readers to the journal and their current reading position.

My context reuses the questionnaire, preserving before/after treatment, uncertain injury location and unknown answers. Apply topics runs the original body-area/cause search. Notes & reading provides personal questions, a dated timeline, and a downloaded care-team note with saved sources and limitations. Files & AI states that website document uploads, cloud saving and AI review are not connected. Do not publish account-specific Microsoft folder URLs or histories in this public repository. The separate private prototype is not a public user destination or a required part of this interface.

Personal questionnaire answers, notes and timeline remain in page memory, not localStorage, query strings, a database, Google Forms, Microsoft or an AI request. Saved article IDs retain the existing device-local behavior. Export backup explicitly downloads a plaintext JSON file containing personal entries; Opening backup validates size, format, field bounds and questionnaire choices before replacing personal entries, and merges only known story IDs into saved reading. Backups are not encrypted by this page. Clear personal entries removes questionnaire context, notes and timeline but retains saved reading and existing topic filters. Reload or close clears memory; a before-unload reminder is requested when personal entries exist. No document upload or AI consent is implied by exporting or importing a backup.

Internal window events synchronize the existing components without adding a public data endpoint. Questionnaire context never becomes an article search URL; only the deliberate generic body-area and cause filters do. A future protected backend must support this journal interface rather than requiring a separate companion website.

Care-desk checks on October 23, 2026 confirmed original questionnaire-to-search synchronization (Brain tumor + Hand: eight stories), before-treatment context retention, original Save-to-reading synchronization, timeline entry, appointment-note source/timing export and valid JSON backup export. The browser file picker stalled during a restore test, so end-to-end backup restore was not verified in that run. Syntax and whitespace checks passed. No patient information was used in these checks.

Search feedback stays immediately beneath the input. The match count updates while typing, including an explicit no-match message with active-filter context. Search or Enter applies the current input and moves focus to the results; View results provides the same route without scrolling while typing. The journal layout and existing topic/search matching remain unchanged.

## Inquiry drafting and history

`inquiry.js` adds Prepare an inquiry on stories and directory entries and an Inquiries tab in the existing care desk. Linked contacts require the same canonical source URL; no diagnosis-keyword inference selects recipients. Resources may optionally include `contacts`, an array of published `name`, `email`, `phone`, `role`, and `source_url` records. Retain the legacy primary phone/email fields. An entry retains all linked contacts, source text, editable subject/body, status, follow-up date and dated actions. Changing a recipient on a sent/replied inquiry creates a separate draft. Existing open inquiries for a source are reopened to reduce duplicate outreach.

Inquiry history stays in memory unless the reader explicitly opts into unencrypted localStorage for this browser profile. It is separate from the existing visit-only care notes and care-desk backup. Export/Open inquiry log supports a bounded, validated JSON file and rejects conflicting records before changing anything. Sharing a public search link does not share this history. Clear personal care entries does not clear the separate inquiry log. Turning off Remember removes the stored inquiry log from this browser while retaining this visit's entries.

The standard draft is deterministic and works without AI. AI drafting opens the existing owner-private backend at /inquiry-bridge, with top-level sign-in as needed. Strict postMessage origin/source checks and request tokens bind the selected source/question to the opener. The private window displays the exact selected text and requires explicit AI-processing consent before a same-origin authenticated POST. No documents or unrelated care notes are attached. The AI cannot send email. Responses return as editable text; changed inquiry context rejects stale AI results. Public visitors without owner access can use the standard draft.

Open in email app uses mailto and cannot confirm sending. Sent/Reply are explicitly user-recorded statuses, not mailbox synchronization or delivery confirmation. Follow-up dates show overdue Sent items when the page is opened. Download calendar reminder exports a 9 am local-time ICS event with an alarm; the user must import it into a calendar. It cannot detect replies or cancel imported reminders. Automatic Microsoft/email sync, document review, and automatic fit decisions are not implemented. No medical-fit percentage or trial eligibility is inferred.
