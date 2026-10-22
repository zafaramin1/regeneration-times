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
| `body_area` | Brain, Neck spine, Back spine, Spine, Nerve root, Peripheral nerve, Arm, Hand, Leg, Face |
| `cause` | Trauma, Brain tumor, Spine tumor, Stroke, Diabetes, Chemotherapy, Disease, Surgery, Nerve gap, Any cause |
| `approach` | Drug, Stem cells, Scaffold, Nerve transfer, Stimulation, Surgery, Device, Rehab, Review |
| `stage` | Lab study, Animal study, Human study, Human trial, Recruiting trial, Approved, Review |

Example:

```json
"tags": { "body_area": "Neck spine", "cause": "Trauma", "approach": "Drug", "stage": "Recruiting trial" }
```

Latest stays ordered by `date_published`. Top Stories is ordered by `relevance_score` behind the scenes (no score, rank number or score label is ever shown); the Relevance / Newest toggle reorders Top Stories, each category, and search results. Search matches title, tags, quick read, summary, source, and category, and shows one results list.

Each story renders as a parchment scroll with three levels:

1. Closed (default): headline, a small date on the right, and the four tags as smooth pewter pill capsules. Tapping a tag shows every story with that tag.
2. First tap (on the headline or entry): the Quick Read unrolls, with a "Read full details" control.
3. Second tap (or that control): the full details unroll: summary, why it matters, section, source, evidence level, date note, trial status and eligibility, trial link, and the link to the original article. It ends with the Close the Scroll emblem button, which rolls the scroll fully closed and brings its headline into view. Tapping the headline while fully open also closes it.

## Find what matters to you

Below the search box, tap buttons (chips) filter the stories by Body area, Cause, Treatment (`approach`) and Stage. Chips come from `VOCAB` in `app.js` plus any other tag value found in `data/articles.json`, so values people look for (such as Brain tumor or Stroke) show even before a story has them. Each chip shows how many stories match; chips with 0 are dimmed. Choices combine as AND across groups and OR within a group. Clear resets them. When nothing matches, the page says "No articles yet for ... New ones are added daily."

The filter is kept in the URL hash so a topic can be shared or bookmarked, for example `#cause=Brain%20tumor` or `#body_area=Hand&cause=Trauma`. Several values in one group are separated by commas. `treatment=` and `body=` also work as aliases.

The headline button and the "Read full details" button carry `aria-expanded`. The animation is CSS only and is turned off under `prefers-reduced-motion`.

When you change `styles.css`, `share.js` or `app.js`, bump the `?v=` version string on all three asset links in `index.html` so phones load the new files.

## Share Your Story form

The form at the top of the page has no backend. Its settings are the two constants at the top of [`share.js`](share.js):

- `SUBMIT_TO`: the editors' email address, stored encoded (reversed character codes shifted by +7) so it never appears as plain text; the comment in `share.js` shows how to encode a new one. On submit the form checks that an email and message are filled in and the consent box is ticked, then opens a pre-filled `mailto:` to this address.
- `FORM_ENDPOINT`: empty by default. Set it to a form service URL and the form will POST its fields there as FormData instead (falling back to `mailto:` if the request fails). Share submissions carry `form=share`.

The two Subscribe boxes (below Share Your Story and in the footer) use the same constants. With `FORM_ENDPOINT` set they POST `type=subscribe`, `name` and `email`; while it is empty they open a `mailto:` to `SUBMIT_TO` with the subject "Subscribe me to The Regeneration Times".

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
