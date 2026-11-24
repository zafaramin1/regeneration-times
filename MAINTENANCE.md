# Regeneration Times improvement backlog

Continue from this backlog and the current README. The existing research task adds verified articles and care resources. A separate improvement task maintains quality and implements bounded improvements to the journal. Read recent commits before selecting work; do not repeatedly restart the same audit.

## Current priorities

1. Recheck older research against original sources. The November 23, 2026 baseline has 196 summaries and 54 care resources; 41 summaries lack a dedicated `limitation` field and 27 lack `verified_on`. Missing fields do not imply that the narrative has no limitations. Add verification dates only after actually checking the sources. Log the reviewed stable IDs to rotate the work.
2. Recheck older trial recruitment records and official care contacts. Inspect inclusion and exclusion criteria; distinguish public assessment routes from confirmed acceptance. Do not treat a blocked HTTP request as proof of a dead link.
3. Verify the first-visit flow on desktop, phone and keyboard: questionnaire, search, open/read, save, care directory and standard inquiry. Improve clarity and accessibility without removing needed features or changing the newspaper design.
4. Develop crawlable, useful article/topic pages with stable URLs and consistent canonical, sitemap and internal links. Preserve existing public search and inquiry links. Avoid duplicate thin pages or unsupported claims about search rankings.
5. Strengthen return visits with topic-saving and opt-in briefing foundations. Do not silently subscribe users or send messages. Keep personal notes and clinical data out of public URLs, logs and repository files.
6. Build and test paid-service foundations using synthetic information: persistent research organization, appointment preparation and care-workspace continuity. Keep the public research collection free. The current owner-only save helper is not a complete public account/patient-profile service; inquiry synchronization and document review remain unfinished.

## Publication and ownership

- Independent, reversible site improvements and tested GitHub Pages publication are authorized. Complete concrete changes rather than only reporting recommendations.
- Follow the README schemas and medical-evidence distinctions. No diagnosis, inferred eligibility, cure claims or private patient information. Use original writing and no em dashes.
- Work from current file SHAs and branch head. Preserve other contributors' changes; merge conflicts, never force-push. Prefer separate presentation changes to minimize conflicts with the collector.
- Use meaningful checks for changed behavior and inspect the live result. Report blocked or untested paths accurately. Do not assert clinical review, comprehensive coverage or confirmed appointment availability.
- Buying services, charging users, contacting people, changing audience/access and launching public medical-document or AI processing require specific owner authorization. Routine implementation decisions do not.

## Completed work

### November 24, 2026

- Rotating editorial batch: rechecked `cimt-children-brain-tumors-pilot-2017`, `intensive-rehab-brain-tumor-surgery-cohort-2019` and `cimt-hand-ataxia-cerebellar-tumor-2019` against original papers (PMC5172401, PMC6509576 and DOI 10.1590/1980-5918.032.AO19). Added dedicated limitations, verified DOI identifiers, source-check dates and care-team questions. Retained original publication dates and all stable IDs.
- Made the pediatric/adult and tumor/stroke-comparator distinctions explicit in limitations. Included no lasting quality-of-life improvement in the pediatric pilot, recall/natural-recovery limits in the adult cohort, and lack of long-term follow-up and uneven task gains in the adult case.
- Publisher cohort page returned HTTP 403; its original full text was reviewed through PMC. Retained the publisher URL and recorded this access limit in the entry. PMC pediatric paper initially returned full text; a subsequent request showed a verification interstitial. Initial full text and indexed original-paper discussion supported the bounded additions; no claim that the link is dead or currently freely reachable.
- Checked the three studies against canonical source URLs, DOI strings and related CIMT/review coverage. The 2019 case cites the 2017 pilot as background; these are distinct participants, and citations/reviews were not counted as additional confirmation. No entries added or removed.
- Validation: 201 articles with unique IDs and 56 resources; only the three selected article objects changed. All existing JavaScript passes syntax checks. Live desktop keyboard search (typing plus Enter) found the cerebellar writing case and moved focus to results. After Pages deployment 6f73e44 succeeded, all three updated stories were opened on the live site and their limitation, care question and November 24 source-check date confirmed. Desktop Enter activation, saved-reading persistence across reload, standard unsent inquiry creation and Escape dialog dismissal passed. A desktop screenshot retained the newspaper design. Mobile rendering, questionnaire/directory walkthrough and screen-reader output remain untested in this batch.
- Remaining gaps after this batch: 38 summaries lack `limitation`; 24 lack `verified_on`. Next editorial batch: `glioma-pt-ot-randomized-trial-2020` plus older recruitment records, starting with HYPE (`NCT05740839`). Preserve negative primary outcomes and check both inclusion and exclusion criteria.
- Presentation, collector, private helpers, forms and access settings unchanged. No new owner decision is needed for the next batch.

### November 23, 2026

- Added a homepage canonical URL, accurate Open Graph and Twitter title/description metadata, and JavaScript-disabled guidance. Existing founder-site footer link is retained. Social preview rendering remains controlled by the receiving platform.
- Added an in-page story-loading retry. A temporary request failure now offers a usable recovery action and plain-English guidance. Retry reloads the public article data rather than the page, preserving care-desk draft notes.
- Updated asset version strings so returning readers receive the changed script.
- Checks: JavaScript syntax; HTML canonical/metadata and local asset references; unique static element IDs; existing JSON/ID validity; full-script DOM integration for article/directory rendering and dexterity search; simulated HTTP 503 followed by successful retry, note retention and results focus.
- Check limit: a rendered Chromium desktop/mobile/keyboard session could not launch in this execution environment. DOM checks passed, but they do not verify visual layout or screen-reader output. Include those checks in the next available browser session.
- No research entries or care-resource records changed in this improvement batch. No account, document-processing, email or billing behavior was enabled.

## Owner decisions to revisit

- After a firsthand walkthrough and feedback from a few families, choose the initial paid feature and pilot offer. No price or paid launch is agreed yet.
- Confirm the complete signed-in owner AI-drafting and care-desk restoration experience when convenient. This does not block public editorial or usability improvements.
