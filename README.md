# The Regeneration Times

A free static news page for nerve repair and regeneration research: spinal cord and nerve roots, peripheral nerve repair, clinical trials, and related therapies. Plain HTML, CSS, and JavaScript. No build step and no backend.

Site: <https://zafaramin1.github.io/regeneration-times/>

## Add a story

Append one object to [`data/articles.json`](data/articles.json). The front page reads that file in the browser, so a new story does not need a new HTML page.

Fields the page uses:

| Field | Required | Role |
| --- | --- | --- |
| `id` | yes | Stable slug |
| `title` | yes | Headline; links to `url` |
| `source` | yes | Publication or sponsor name |
| `url` | yes | Source link (opens in a new tab) |
| `date_published` | yes | `YYYY-MM-DD` |
| `date_added` | yes | `YYYY-MM-DD`; the newest value is shown as the file date |
| `category` | yes | Becomes its own section. `Clinical Trials & Experimental Opportunities` is listed separately |
| `summary` | yes | What the source reports |
| `why_it_matters` | yes | Short note under the summary |
| `relevance_score` | yes | Number; Top Stories sorts by this |
| `evidence_level` | yes | Shown on the card |
| `trial_url` | no | Registry link |
| `trial_status` | no | `status`, `phase`, `location`, `key_eligibility` |
| `date_note` | no | Clarifies `date_published` when needed |

Latest stays ordered by `date_published`. Top Stories starts ranked by `relevance_score`; the Relevance / Newest toggle reorders Top Stories, each category, and search results. Search matches title, summary, source, and category, and shows one results list.

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
