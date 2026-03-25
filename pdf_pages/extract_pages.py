#!/usr/bin/env python3
"""Extract all PDF pages to individual PNG images with resumable checkpointing."""

import fitz
import os
import json
from pathlib import Path
from datetime import datetime

PDF_PATH = r'syllabi\mccqe1\artifacts\Toronto Notes 2025.pdf'
OUTPUT_DIR = 'pdf_pages/images'
CHECKPOINT_FILE = 'pdf_pages/checkpoint.json'

def load_checkpoint():
    """Load checkpoint to resume from last successful page."""
    if os.path.exists(CHECKPOINT_FILE):
        with open(CHECKPOINT_FILE, 'r') as f:
            return json.load(f)
    return {'last_completed': 0, 'total_pages': None}

def save_checkpoint(data):
    """Save checkpoint after each page."""
    with open(CHECKPOINT_FILE, 'w') as f:
        json.dump(data, f)

def extract_pages():
    """Extract all PDF pages to PNG images."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    checkpoint = load_checkpoint()

    doc = fitz.open(PDF_PATH)
    total_pages = doc.page_count
    checkpoint['total_pages'] = total_pages

    start_page = checkpoint['last_completed']
    print(f"Total pages: {total_pages}")
    print(f"Resuming from page {start_page + 1}")

    for page_num in range(start_page, total_pages):
        try:
            output_file = os.path.join(OUTPUT_DIR, f'page_{page_num + 1:04d}.png')

            # Skip if already exists
            if os.path.exists(output_file):
                checkpoint['last_completed'] = page_num + 1
                save_checkpoint(checkpoint)
                if (page_num + 1) % 100 == 0:
                    progress = ((page_num + 1) / total_pages) * 100
                    print(f"✓ Page {page_num + 1}/{total_pages} (skipped, {progress:.1f}%)")
                continue

            page = doc[page_num]
            pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
            pix.save(output_file)

            checkpoint['last_completed'] = page_num + 1
            save_checkpoint(checkpoint)

            if (page_num + 1) % 100 == 0:
                progress = ((page_num + 1) / total_pages) * 100
                print(f"✓ Page {page_num + 1}/{total_pages} ({progress:.1f}%)")

        except Exception as e:
            print(f"✗ ERROR on page {page_num + 1}: {e}")
            break

    doc.close()

    completed = checkpoint['last_completed']
    print(f"\nCompleted: {completed}/{total_pages} pages")

    if completed == total_pages:
        print("SUCCESS: All pages extracted!")
        os.remove(CHECKPOINT_FILE)
        return True
    else:
        print(f"Incomplete: {total_pages - completed} pages remaining")
        return False

if __name__ == '__main__':
    extract_pages()
