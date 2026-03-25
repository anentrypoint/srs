# SRS MCCQE1 — Card Extraction & Learning System

## Architecture

**src/cards/extractor.js** — Card extraction pipeline
- Processes 1595 PDF pages in 10-page epochs (160 total epochs)
- Uses opencode CLI for AI-powered card generation from page images
- Resumable via checkpoint system (saved after each epoch)
- Output: JSON flashcard files with page references and metadata

**scripts/run_epoch_extraction.mjs** — Batch runner
- Runs all 160 epochs sequentially
- Logs progress to `data/epoch_extraction.log`
- Expected runtime: ~480 hours (can be interrupted and resumed)
- Saves checkpoint after each epoch for resumability

**src/cards/indexer.js** — Flashcard index creation
- Aggregates all epoch JSON files into unified index
- Deduplicates cards by question hash
- Builds topic map and full-text search index
- Generates INDEX.md with card statistics

**scripts/create_index.mjs** — Index runner
- Validates that epoch extraction has completed
- Creates searchable card index and markdown documentation
- Output: `data/cards_index.json` and `data/INDEX.md`

## Running Card Extraction

```bash
# Full pipeline (all 160 epochs)
node scripts/run_epoch_extraction.mjs

# Check progress
cat data/extraction_checkpoint.json

# Single epoch (for testing)
node -e "import('./src/cards/extractor.js').then(m => m.processEpoch(0)).then(console.log)"
```

## Card Schema

Each extracted card contains:
- `id` — hash of question for deduplication
- `question`, `answer` — flashcard content
- `difficulty` — 1-5 scale
- `tags` — medical topics
- `bloomLevel` — recall|apply|analyze
- `explanation` — 2-3 sentence rationale
- `sourcePageStart`, `sourcePageEnd` — page range
- `sourcePageImages` — array of page image paths
- `extractedAt` — ISO timestamp
- `checkpointEpoch` — which 10-page batch

## Workflow

1. **PDF Extraction** (complete) — All 1595 pages extracted to PNG images
2. **Card Extraction** (user-runnable) — Run: `node scripts/run_epoch_extraction.mjs`
3. **Flashcard Index** (ready) — Run: `node scripts/create_index.mjs` (after step 2)

## Running Index Creation

```bash
# After all epochs are extracted (step 2 complete)
node scripts/create_index.mjs

# Output:
# - data/cards_index.json — Full searchable card database
# - data/INDEX.md — Markdown documentation with statistics
```

## References

- `.prd` — Project requirements and work items
- `pdf_pages/images/` — Extracted page images (page_0001.png through page_1595.png)
- `data/extracted_cards/` — Output epoch JSON files (created by run_epoch_extraction.mjs)
- `data/extraction_checkpoint.json` — Resumable processing state
- `data/cards_index.json` — Unified card index (created by create_index.mjs)
- `data/INDEX.md` — Card statistics and documentation
