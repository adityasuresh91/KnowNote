---
name: rumour-killer
description: Trace a claim back to its earliest inspectable source before answering, separate primary evidence from repeated claims, and label each claim confirmed, supported, unconfirmed, or disputed. Use when asked to verify, fact-check, or debunk something; when a user asks "is it true that…", "did X really happen", "I heard that…", "people are saying…"; when assessing a rumour, viral post, news story, statistic, or attributed quote; or when the answer would otherwise rest on widely repeated but unverified information.
---

# Rumour Killer

Answer claims by provenance, not by popularity. A claim repeated in a hundred places is still one claim if all hundred trace back to a single unverified source.

## Procedure

Before you answer, work through these steps.

### 1. State the claim precisely

Write the claim as a single checkable sentence. If the request bundles several claims, split them — each gets traced and labelled separately. Vague claims ("X is dangerous") must be narrowed to something falsifiable before tracing, or flagged as unfalsifiable as stated.

### 2. Trace to the earliest inspectable source

Follow the citation chain backwards as far as you can actually inspect:

- Where did each report get it? Follow "according to…" links until they stop.
- Identify the **origin**: the first source that presents the claim as its own observation, record, or analysis rather than as a report of someone else's.
- Note the **date** of that origin and whether you can inspect it directly, or only see it described by others.
- Watch for circular sourcing: A cites B, B cites C, C cites A — or several outlets all citing the same single post.

If you cannot inspect the origin, say what the earliest thing you *could* inspect was, and treat everything upstream of it as unverified.

### 3. Separate primary evidence from repeated claims

Sort what you found into two piles, and never let the second pile inflate the first:

**Primary evidence** — the thing itself, or a direct record of it: original documents, filings, court records, datasets, official statements from the party involved, first-hand accounts, photographs/recordings with traceable origin, peer-reviewed studies reporting their own data.

**Repeated claims** — coverage, aggregation, and commentary: news articles describing a document, posts summarizing a study, secondary write-ups, "sources say" reporting, other models' or encyclopedias' summaries.

Volume of repetition is not evidence. Say so explicitly when the entire body of "support" for a claim is repetition of one origin.

### 4. Label each claim

Apply exactly one label per claim:

| Label | Meaning |
|---|---|
| **Confirmed** | Primary evidence directly establishes the claim, and you inspected it. |
| **Supported** | Multiple *independent* sources point to it, but you could not inspect primary evidence. Independence must be real — separate origins, not separate retellings of one origin. |
| **Unconfirmed** | The claim traces to a single origin, an uninspectable origin, or no identifiable origin at all. Includes claims that are merely plausible or widely believed. |
| **Disputed** | Credible sources actively conflict, or primary evidence contradicts the claim. Note who says what. |

### 5. Say what you could not confirm

End with an explicit statement of the gaps. If you found no independent confirmation, say that in plain words — do not let a confident tone paper over a thin chain. Never upgrade a label to avoid an unsatisfying answer, and never invent a source, date, or citation to fill a hole. "I could not trace this past a single anonymous post from 2023" is a complete and useful answer.

## Output shape

For each claim:

**Claim:** <the precise, checkable sentence>
**Label:** Confirmed / Supported / Unconfirmed / Disputed
**Earliest source found:** <what it is, who published it, when, and whether you inspected it directly>
**Primary evidence:** <what actually exists — or "none found">
**Repeated claims:** <who is echoing it, and whether they trace back to the same origin>
**Gaps:** <what remains unverified, and what would settle it>

Keep it proportional: a single simple claim gets a short paragraph in this shape, not a filled-in form. A multi-part or contested claim gets the full breakdown per claim.

## Rules

- Do not answer from memory alone when the claim is checkable and tools are available. Memory is a repeated claim, not primary evidence — and it carries no date.
- Recency matters: a claim confirmed in 2021 may be superseded. Note the as-of date of your evidence.
- Attributed quotes need the original transcript, recording, or document — not an article quoting it.
- Statistics need the dataset or the report that produced them, not the outlet that cited them.
- Absence of evidence is reported as absence of evidence ("unconfirmed"), not as disproof.
- If the user pushes back without new evidence, the label does not change. New evidence changes labels; insistence does not.
