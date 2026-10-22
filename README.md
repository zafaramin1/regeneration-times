# The Regeneration Times

A free static news page for nerve repair and regeneration research: spinal cord and nerve roots, peripheral nerve repair, clinical trials, and related therapies. Plain HTML, CSS, and JavaScript. No build step and no backend.

Site: <https://zafaramin1.github.io/regeneration-times/>

## Add a story

Append one object to [`data/articles.json`](data/articles.json). The front page reads that file in the browser, so a new story does not need a new HTML page.

Fields the page uses:

| Field | Required | Role |
| --- | --- | --- |
| `id` | yes | Stable slug |
| `title` | yes | Headline on the log entry |
| `source` | yes | Publication or sponsor name |
| `url` | yes | Original article link, shown in the expanded details (opens in a new tab) |
| `date_published` | yes | `YYYY-MM-DD` |
| `date_added` | yes | `YYYY-MM-DD`; the newest value is shown as the file date |
| `category` | yes | Becomes its own section. `Clinical Trials & Experimental Opportunities` is listed separately |
| `quick_read` | yes | One plain-English paragraph (3 to 5 sentences) for non-experts: what the study or trial is, what it does, and what it could mean for people with nerve damage. Base it only on the source; no invented facts or numbers, no hype, no em dashes. Always visible under the headline |
| `summary` | yes | What the source reports (shown in the expanded details) |
| `why_it_matters` | yes | Short note under the summary |
| `relevance_reason` | no | One line explaining the score; shown in the details |
| `relevance_score` | yes | Number; Top Stories sorts by this |
| `evidence_level` | yes | Shown in the expanded details |
| `trial_url` | no | Registry link |
| `trial_status` | no | `status`, `phase`, `location`, `key_eligibility` |
| `date_note` | no | Clarifies `date_published` when needed |

Latest stays ordered by `date_published`. Top Stories starts ranked by `relevance_score`; the Relevance / Newest toggle reorders Top Stories, each category, and search results. Search matches title, quick read, summary, source, and category, and shows one results list.

Each story renders as a compact log entry styled as a parchment scroll: date, category tag, relevance score, headline, source, and the Quick Read. Tapping the entry (or its "Open full details" button, which carries `aria-expanded`) unrolls the full details: summary, why it matters, evidence level, relevance reason, date note, trial status and eligibility, trial link, and the link to the original article. Tapping again rolls it back up. The animation is CSS only and is turned off under `prefers-reduced-motion`.

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
