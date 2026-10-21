import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import type { PdfParseResult } from '../types/resume';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

function isTextItem(item: unknown): item is TextItem {
  return typeof item === 'object'
    && item !== null
    && 'str' in item
    && typeof item.str === 'string'
    && 'transform' in item
    && Array.isArray(item.transform)
    && 'hasEOL' in item
    && typeof item.hasEOL === 'boolean';
}

function reconstructLines(items: unknown[]): string {
  const fragments: string[] = [];
  let previousY: number | null = null;
  let previousRight: number | null = null;

  for (const candidate of items) {
    if (!isTextItem(candidate) || !candidate.str) continue;
    const x = candidate.transform[4];
    const y = candidate.transform[5];
    const hasCoordinates = typeof x === 'number' && Number.isFinite(x)
      && typeof y === 'number' && Number.isFinite(y);
    const newVisualLine = hasCoordinates && previousY !== null && Math.abs(y - previousY) > 2;

    if (fragments.length > 0) {
      if (newVisualLine) {
        fragments.push('\n');
        previousRight = null;
      } else if (candidate.str.startsWith(' ') || candidate.str.startsWith('\n')) {
        // Keep spaces already included in the PDF text item.
      } else if (
        hasCoordinates
        && previousRight !== null
        && x - previousRight > 1.5
      ) {
        fragments.push(' ');
      }
    }

    fragments.push(candidate.str);
    if (hasCoordinates) {
      previousY = y;
      previousRight = x + candidate.width;
    }
    if (candidate.hasEOL) {
      fragments.push('\n');
      previousY = null;
      previousRight = null;
    }
  }

  return fragments.join('')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function extractTextFromPDF(file: File): Promise<PdfParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;

    let fullText = '';
    let imageCount = 0;
    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
      const page = await pdfDocument.getPage(pageNumber);
      const [textContent, operatorList] = await Promise.all([
        page.getTextContent(),
        page.getOperatorList(),
      ]);
      fullText += `${reconstructLines(textContent.items)}\n`;
      imageCount += operatorList.fnArray.filter(
        (operation) => operation === pdfjsLib.OPS.paintImageXObject
          || operation === pdfjsLib.OPS.paintInlineImageXObject,
      ).length;
    }

    const text = fullText.trim();
    return {
      text,
      pageCount: pdfDocument.numPages,
      imageCount,
      isScannedImage: pdfDocument.numPages > 0 && imageCount > 0 && text.replace(/\s/g, '').length < 30,
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file. Please ensure it is a valid, unprotected PDF.', { cause: error });
  }
}
