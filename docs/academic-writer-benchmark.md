# Academic Writer Benchmark — September 2026

This note records the product benchmark used for the UNN Academic Writer upgrade. It is not a claim that one product is universally better than another; it identifies public capabilities to match and gaps the Mabrig product can differentiate on.

## Current benchmark capabilities

| Product category | Public benchmark capability | Mabrig response |
| --- | --- | --- |
| Jenni-style academic writing | Citation search, DOI/PMID resolution, source-quality flags | DOI resolution, source-health checks, student source approval, fail-closed citation markers |
| Paperpal-style research support | Research search, citation generation, reference checking | Agentic research planner, Crossref verification, optional Semantic Scholar enrichment, deterministic bibliography |
| SciSpace-style literature workflow | Large scholarly search corpus and citation-backed writing | Topic-specific bibliographic queries plus evidence packets grounded in verified scholarly metadata |
| Yomu-style research agent | Agentic literature search and citation-backed document drafting | Research planner → source discovery → exact DOI re-check → evidence mapping → draft markers → deterministic citations |
| Writefull-style citation checking | Flags writing that needs citations | Current release prevents unverified sources from entering the bibliography; claim-gap checking remains a next-step feature |

## Differentiators to protect

1. **UNN-native output** — student/course/title-page fields, academic layout, editable DOCX and printing hand-off.
2. **Human source approval before drafting** — the student sees and selects the actual records the writer may cite.
3. **Fail-closed citations** — an unknown or unverified source marker stops generation instead of silently producing a bibliography.
4. **Deterministic bibliography** — reference strings are generated from verified metadata, not invented by the language model.
5. **Claim-to-source provenance** — the writer uses internal verified source IDs and only cited IDs reach the bibliography.
6. **Reference-health screening** — DOI record resolution plus Crossref update/retraction relationships; retracted/withdrawn records are excluded.
7. **Evidence-level awareness** — metadata-only records are not presented to the model as evidence for detailed findings; abstract-backed records can support stronger claims.
8. **Optional verification appendix** — a DOCX audit section can record DOI, verification score, evidence level, provenance and screening notes.

## Next benchmark targets

- Claim-level citation-gap detection after drafting.
- Source-library persistence per student/project.
- Citation style engine with richer journal volume/issue/page metadata.
- Full-text evidence retrieval where legally available, with paragraph-level provenance.
- Contradiction / supporting-source comparison for contested claims.
- Supervisor template presets by UNN faculty, department and course.
- Reference refresh: re-check saved papers before final submission.
