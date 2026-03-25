import { createWorker } from 'tesseract.js';
import { existsSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const IMAGES_DIR = 'C:/dev/srs-mccqe1/pdf_pages/images';
const TEXT_DIR = 'C:/dev/srs-mccqe1/pdf_pages/text';

const [,, startArg, endArg] = process.argv;
const start = parseInt(startArg);
const end = parseInt(endArg);

if (!start || !end) { console.error('Usage: node ocr_batch.mjs <start> <end>'); process.exit(1); }

const pad = n => String(n).padStart(4, '0');

const worker = await createWorker('eng', 1, {
  logger: () => {},
  errorHandler: err => console.error(err),
});

let done = 0;
for (let i = start; i <= end; i++) {
  const imgPath = join(IMAGES_DIR, `page_${pad(i)}.png`);
  const outPath = join(TEXT_DIR, `page_${pad(i)}.txt`);
  if (existsSync(outPath)) { done++; continue; }
  if (!existsSync(imgPath)) { console.log(`SKIP missing: ${imgPath}`); continue; }
  try {
    const { data: { text } } = await worker.recognize(imgPath);
    writeFileSync(outPath, text.trim());
    done++;
    if (done % 10 === 0) console.log(`[${start}-${end}] ${i}/${end} done`);
  } catch(e) {
    console.error(`ERROR page ${i}:`, e.message);
  }
}

await worker.terminate();
console.log(`BATCH ${start}-${end} COMPLETE: ${done} pages`);
