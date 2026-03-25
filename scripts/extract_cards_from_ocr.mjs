import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { spawn } from 'child_process';

const TEXT_DIR = 'C:/dev/srs-mccqe1/pdf_pages/text';
const OUT_DIR = 'C:/dev/srs-mccqe1/data';
const CARDS_FILE = join(OUT_DIR, 'cards.json');
const CHECKPOINT = join(OUT_DIR, 'ocr_extraction_checkpoint.json');
const EPOCH_SIZE = 10;

const hashQ = q => createHash('sha256').update(q.trim().toLowerCase()).digest('hex').slice(0, 12);

const TOPIC_KEYWORDS = {
  'card-acs': ['myocardial infarction', 'MI', 'STEMI', 'NSTEMI', 'ACS', 'troponin', 'PCI', 'thrombolysis', 'angina'],
  'card-hf': ['heart failure', 'ejection fraction', 'BNP', 'pulmonary edema', 'cardiomyopathy', 'systolic', 'diastolic', 'HFpEF', 'HFrEF'],
  'card-arrhythmia': ['arrhythmia', 'atrial fibrillation', 'AFib', 'SVT', 'ventricular tachycardia', 'bradycardia', 'AV block', 'Wolff-Parkinson'],
  'card-htn': ['hypertension', 'blood pressure', 'antihypertensive', 'ACE inhibitor', 'ARB', 'calcium channel blocker', 'thiazide'],
  'card-valve': ['valvular', 'aortic stenosis', 'mitral regurgitation', 'mitral stenosis', 'endocarditis', 'prosthetic valve'],
  'resp-asthma': ['asthma', 'bronchospasm', 'salbutamol', 'corticosteroid inhaler', 'peak flow', 'bronchodilator', 'wheeze'],
  'resp-copd': ['COPD', 'emphysema', 'chronic bronchitis', 'FEV1', 'spirometry', 'tiotropium', 'long-acting beta'],
  'resp-pna': ['pneumonia', 'consolidation', 'lobar', 'community-acquired', 'hospital-acquired', 'CAP', 'HAP', 'aspiration'],
  'resp-pe': ['pulmonary embolism', 'DVT', 'deep vein thrombosis', 'Wells score', 'D-dimer', 'anticoagulation', 'heparin', 'CTPA'],
  'gi-liver': ['cirrhosis', 'hepatitis', 'liver failure', 'ascites', 'varices', 'encephalopathy', 'Child-Pugh', 'MELD'],
  'gi-ibd': ['Crohn', 'ulcerative colitis', 'IBD', 'inflammatory bowel', 'mesalamine', 'biologics', 'colonoscopy'],
  'gi-upper': ['GERD', 'peptic ulcer', 'H. pylori', 'Barrett', 'dysphagia', 'upper GI', 'proton pump inhibitor'],
  'renal-aki': ['acute kidney injury', 'AKI', 'creatinine', 'oliguria', 'prerenal', 'intrinsic renal', 'postrenal'],
  'renal-ckd': ['chronic kidney disease', 'CKD', 'GFR', 'proteinuria', 'dialysis', 'renal replacement'],
  'endo-dm': ['diabetes mellitus', 'type 1 diabetes', 'type 2 diabetes', 'insulin', 'HbA1c', 'metformin', 'hypoglycemia'],
  'endo-thyroid': ['hypothyroid', 'hyperthyroid', 'thyroid', 'TSH', 'T4', 'Graves', 'Hashimoto', 'thyroiditis'],
  'neuro-stroke': ['stroke', 'ischemic', 'hemorrhagic', 'TIA', 'tPA', 'thrombolysis', 'NIHSS', 'atrial fibrillation'],
  'neuro-sz': ['seizure', 'epilepsy', 'anticonvulsant', 'EEG', 'status epilepticus', 'valproate', 'levetiracetam'],
  'psych-mood': ['depression', 'bipolar', 'SSRI', 'antidepressant', 'lithium', 'major depressive', 'manic episode'],
  'psych-psychosis': ['schizophrenia', 'psychosis', 'antipsychotic', 'hallucination', 'delusion', 'clozapine', 'risperidone'],
  'surg-periop': ['perioperative', 'preoperative', 'anesthesia', 'surgical risk', 'DVT prophylaxis', 'NPO', 'consent'],
  'surg-trauma': ['trauma', 'ATLS', 'primary survey', 'secondary survey', 'hemorrhage', 'tension pneumothorax', 'fracture'],
  'obgyn-ob': ['obstetric', 'pregnancy', 'preeclampsia', 'eclampsia', 'gestational diabetes', 'placenta previa', 'labor'],
  'obgyn-gyn': ['gynecology', 'menstrual', 'endometriosis', 'PCOS', 'ovarian cyst', 'cervical cancer', 'Pap smear'],
  'peds-general': ['pediatric', 'neonate', 'child', 'developmental', 'vaccination', 'growth', 'milestones'],
  'em-resus': ['resuscitation', 'CPR', 'ACLS', 'cardiac arrest', 'airway', 'intubation', 'defibrillation'],
  'ph-social-det': ['social determinants', 'Indigenous', 'poverty', 'housing', 'health equity', 'population health'],
  'ethics-consent': ['informed consent', 'capacity', 'substitute decision', 'autonomy', 'confidentiality', 'privacy'],
  'pharm-adverse': ['adverse drug', 'drug interaction', 'pharmacology', 'side effect', 'contraindication', 'toxicity'],
  'id-bacterial': ['infection', 'antibiotic', 'sepsis', 'bacteremia', 'culture', 'sensitivity', 'empiric therapy'],
  'rheum-arthritis': ['rheumatoid arthritis', 'osteoarthritis', 'joint', 'synovitis', 'methotrexate', 'biologics', 'DMARDs'],
  'derm-general': ['dermatology', 'rash', 'eczema', 'psoriasis', 'melanoma', 'skin cancer', 'acne', 'cellulitis'],
  'hem-anemia': ['anemia', 'hemoglobin', 'iron deficiency', 'B12', 'folate', 'hemolytic', 'sickle cell', 'thalassemia'],
};

function guessTopicId(text) {
  const lower = text.toLowerCase();
  let best = 'general', bestScore = 0;
  for (const [tid, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    const score = keywords.filter(k => lower.includes(k.toLowerCase())).length;
    if (score > bestScore) { best = tid; bestScore = score; }
  }
  return best;
}

function loadCards() {
  if (!existsSync(CARDS_FILE)) return [];
  return JSON.parse(readFileSync(CARDS_FILE, 'utf8'));
}

function upsertCards(newCards) {
  const existing = loadCards();
  const seen = new Set(existing.map(c => c.id));
  let added = 0;
  for (const c of newCards) {
    if (!seen.has(c.id)) { existing.push(c); seen.add(c.id); added++; }
  }
  writeFileSync(CARDS_FILE, JSON.stringify(existing, null, 2));
  return added;
}

function loadCheckpoint() {
  if (!existsSync(CHECKPOINT)) return { lastEpoch: 0 };
  return JSON.parse(readFileSync(CHECKPOINT, 'utf8'));
}

function saveCheckpoint(epoch) {
  writeFileSync(CHECKPOINT, JSON.stringify({ lastEpoch: epoch, updatedAt: new Date().toISOString() }, null, 2));
}

async function callOpencode(prompt) {
  return new Promise((resolve, reject) => {
    let out = '', err = '';
    const child = spawn('opencode', ['run', '-'], { shell: true });
    child.stdout.on('data', d => out += d);
    child.stderr.on('data', d => err += d);
    child.stdin.write(prompt);
    child.stdin.end();
    const t = setTimeout(() => { child.kill(); reject(new Error('timeout')); }, 120000);
    child.on('close', () => {
      clearTimeout(t);
      try {
        const m = out.match(/\[[\s\S]*\]/);
        if (!m) return reject(new Error('no JSON array: ' + out.slice(0, 300)));
        resolve(JSON.parse(m[0]));
      } catch(e) { reject(new Error('parse error: ' + e.message + ' out: ' + out.slice(0,200))); }
    });
  });
}

function getPageFiles() {
  return readdirSync(TEXT_DIR)
    .filter(f => f.endsWith('.txt'))
    .sort()
    .map(f => join(TEXT_DIR, f));
}

const pages = getPageFiles();
const totalPages = pages.length;
const totalEpochs = Math.ceil(totalPages / EPOCH_SIZE);
const cp = loadCheckpoint();
const startEpoch = cp.lastEpoch;

console.log(`OCR text files: ${totalPages} | Epochs: ${totalEpochs} | Resuming from epoch ${startEpoch}`);

let totalAdded = 0;

for (let e = startEpoch; e < totalEpochs; e++) {
  const batch = pages.slice(e * EPOCH_SIZE, (e + 1) * EPOCH_SIZE);
  const pageNums = batch.map(p => p.match(/page_(\d+)/)?.[1]).join(', ');

  // Concatenate text for this epoch
  const combinedText = batch.map((p, i) => {
    const txt = readFileSync(p, 'utf8').trim();
    return `=== PAGE ${parseInt(pageNums.split(', ')[i])} ===\n${txt}`;
  }).join('\n\n').slice(0, 8000); // cap at ~8k chars to stay within prompt limits

  if (combinedText.replace(/=== PAGE \d+ ===/g, '').trim().length < 50) {
    console.log(`Epoch ${e+1}/${totalEpochs} (pages ${pageNums}): skipped (no content)`);
    saveCheckpoint(e + 1);
    continue;
  }

  const prompt = `You are an expert Canadian medical educator. Extract MCCQE1 flashcards from this textbook text.

TEXT FROM TORONTO NOTES 2025 (pages ${pageNums}):
${combinedText}

Generate as many high-quality flashcards as possible from this content. Each card must be a JSON object:
- question: clinical question or "What is X?" format
- answer: concise correct answer
- explanation: 1-2 sentences of clinical context
- difficulty: 1-5
- bloomLevel: recall/apply/analyze
- tags: array of relevant tags

Output ONLY a JSON array. No preamble.`;

  try {
    const cards = await callOpencode(prompt);
    const structured = cards.map(c => ({
      id: 'card-' + hashQ(c.question),
      question: c.question,
      answer: c.answer,
      explanation: c.explanation ?? '',
      difficulty: c.difficulty ?? 3,
      bloomLevel: c.bloomLevel ?? 'recall',
      tags: [...(c.tags ?? []), 'toronto-notes', `pages-${pageNums.replace(/, /g, '-')}`],
      topicId: guessTopicId(c.question + ' ' + c.answer),
    }));
    const added = upsertCards(structured);
    totalAdded += added;
    saveCheckpoint(e + 1);
    console.log(`Epoch ${e+1}/${totalEpochs} (pages ${pageNums}): +${added} cards (total: ${loadCards().length})`);
  } catch(err) {
    console.error(`Epoch ${e+1}/${totalEpochs} ERROR:`, err.message.slice(0, 150));
    saveCheckpoint(e + 1); // skip and continue
  }

  await new Promise(r => setTimeout(r, 1000));
}

console.log(`\nDONE. Total new cards added: ${totalAdded}. Total in store: ${loadCards().length}`);
