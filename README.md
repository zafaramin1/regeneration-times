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

When you change `styles.css`, `share.js` or `app.js`, bump the `?v=` version string on all three asset links in `index.html` so phones load the new files.

## Reader guide, subscriptions, ideas and stories

A visible reading guide sits before the articles. The side rail has three fully collapsible panels: Share Your Story, Have an idea?, and Stay connected. Founder credit is in the footer.

Signup and community submissions use native forms in a dismissible dialog, styled to match the paper. Google embeds and their account banners have been removed. Connection to a collection backend is deliberately deferred at the owner's request. Submit buttons remain disabled and the form clearly states that nothing is sent or stored. Do not enable collection or claim a signup succeeded until the chosen Google Sheets or Zoho endpoint confirms it. Never store submission emails or messages in localStorage, the public repository or URL parameters.

The existing private workbook **Regeneration Times — Subscribers and Ideas** and its Google Forms are preserved. Do not expose response data or change sharing permissions. Future connection work must test actual submission-to-private-storage and confirmed success/error handling, with required email validation and explicit publication permission for stories.

share.js handles the native dialog, required fields, focus restoration and side panels. The form currently resets on close; it does not retain personal information.

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
