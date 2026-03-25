#!/usr/bin/env node
import { generateCardsForTopic } from './src/cards/generator.js';

const TOPICS = [
  { id: 'card-acs', count: 20 },
  { id: 'card-hf', count: 15 },
  { id: 'card-arrhythmia', count: 20 },
  { id: 'card-htn', count: 20 },
  { id: 'card-valve', count: 10 },
  { id: 'resp-asthma', count: 15 },
  { id: 'resp-copd', count: 15 },
  { id: 'resp-pneumonia', count: 15 },
  { id: 'resp-pe', count: 15 },
  { id: 'resp-sarcoid', count: 7 },
  { id: 'gi-ibd', count: 15 },
  { id: 'gi-liver', count: 15 },
  { id: 'gi-gerd', count: 10 },
  { id: 'gi-panc', count: 10 },
  { id: 'gi-colon', count: 10 },
  { id: 'neph-aki', count: 15 },
  { id: 'neph-ckd', count: 15 },
  { id: 'neph-electrolytes', count: 15 },
  { id: 'neph-glom', count: 7 },
  { id: 'endo-dm', count: 20 },
  { id: 'endo-thyroid', count: 15 },
  { id: 'endo-adrenal', count: 7 },
  { id: 'endo-osteo', count: 10 },
  { id: 'id-hiv', count: 15 },
  { id: 'id-sepsis', count: 15 },
  { id: 'id-sti', count: 10 },
  { id: 'id-tb', count: 10 },
  { id: 'id-meningitis', count: 10 },
  { id: 'neuro-stroke', count: 20 },
  { id: 'neuro-seizure', count: 15 },
  { id: 'neuro-ms', count: 10 },
  { id: 'neuro-dementia', count: 15 },
  { id: 'neuro-headache', count: 10 },
  { id: 'surg-acute-abdomen', count: 15 },
  { id: 'surg-trauma', count: 15 },
  { id: 'surg-breast', count: 10 },
  { id: 'surg-periop', count: 10 },
  { id: 'peds-development', count: 15 },
  { id: 'peds-fever', count: 15 },
  { id: 'peds-neonate', count: 15 },
  { id: 'peds-asthma', count: 10 },
  { id: 'peds-vaccines', count: 10 },
  { id: 'obgyn-obstetric-emerg', count: 15 },
  { id: 'obgyn-antenatal', count: 15 },
  { id: 'obgyn-gyn', count: 15 },
  { id: 'obgyn-contraception', count: 10 },
  { id: 'psych-mood', count: 15 },
  { id: 'psych-psychosis', count: 15 },
  { id: 'psych-anxiety', count: 15 },
  { id: 'psych-substance', count: 15 },
  { id: 'psych-suicide', count: 15 },
  { id: 'em-resus', count: 20 },
  { id: 'em-tox', count: 15 },
  { id: 'em-anaphylaxis', count: 10 },
  { id: 'ph-screening', count: 15 },
  { id: 'ph-epidemiology', count: 15 },
  { id: 'ph-social-det', count: 10 },
  { id: 'ethics-consent', count: 15 },
  { id: 'ethics-end-of-life', count: 10 },
  { id: 'ethics-confidentiality', count: 10 },
  { id: 'fm-preventive', count: 15 },
  { id: 'fm-multimorbid', count: 15 },
  { id: 'fm-geriatrics', count: 15 },
  { id: 'rheum-ra', count: 10 },
  { id: 'rheum-osteo', count: 10 },
  { id: 'rheum-lupus', count: 7 },
  { id: 'derm-common', count: 10 },
  { id: 'derm-cancer', count: 10 },
  { id: 'hem-anemia', count: 15 },
  { id: 'hem-coag', count: 15 },
  { id: 'hem-lymphoma', count: 10 },
  { id: 'ent-ear', count: 7 },
  { id: 'ent-urg', count: 7 },
  { id: 'ophtho-urg', count: 7 },
  { id: 'uro-uti', count: 10 },
  { id: 'uro-prostate', count: 10 },
  { id: 'pharm-antimicrobials', count: 15 },
  { id: 'pharm-adverse', count: 15 },
];

let done = 0;
const start = Date.now();
let totalCards = 0;

for (const t of TOPICS) {
  process.stderr.write(`[${done+1}/${TOPICS.length}] Generating ${t.count} cards for ${t.id}...\n`);
  const s = Date.now();
  try {
    const r = await generateCardsForTopic(t.id, t.count);
    totalCards += r.generated;
    process.stderr.write(`  -> Generated ${r.generated} cards in ${((Date.now()-s)/1000).toFixed(1)}s\n`);
  } catch (e) {
    process.stderr.write(`  -> ERROR: ${e.message}\n`);
  }
  done++;
}

process.stderr.write(`\nDone: ${done} topics, ${totalCards} total cards in ${((Date.now()-start)/1000).toFixed(1)}s\n`);
