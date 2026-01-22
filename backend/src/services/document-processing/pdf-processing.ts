import * as pdfjsLib from 'pdfjs-dist';
import { Readable } from 'stream';

// Set up the worker for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface PdfTextExtractionResult {
  text: string;
  numPages: number;
  metadata?: any;
}

export interface PdfPageData {
  pageNumber: number;
  text: string;
  width: number;
  height: number;
}

export class PdfProcessingService {
  /**
   * Extracts text from a PDF buffer
   */
  static async extractTextFromPdf(pdfBuffer: Buffer): Promise<PdfTextExtractionResult> {
    try {
      // Load the PDF document
      const uint8Array = new Uint8Array(pdfBuffer);
      const pdfDoc = await pdfjsLib.getDocument(uint8Array).promise;

      // Get the number of pages
      const numPages = pdfDoc.numPages;

      // Extract text from all pages
      let fullText = '';
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const pageTextContent = await page.getTextContent();

        // Concatenate text items
        const pageText = pageTextContent.items
          .map((item: any) => item.str)
          .join(' ');

        fullText += pageText + '\n';
      }

      return {
        text: fullText,
        numPages,
      };
    } catch (error) {
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  /**
   * Gets detailed page data from a PDF
   */
  static async getPageDataFromPdf(pdfBuffer: Buffer): Promise<PdfPageData[]> {
    try {
      const uint8Array = new Uint8Array(pdfBuffer);
      const pdfDoc = await pdfjsLib.getDocument(uint8Array).promise;
      const pagesData: PdfPageData[] = [];

      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.0 });

        const pageTextContent = await page.getTextContent();
        const pageText = pageTextContent.items
          .map((item: any) => item.str)
          .join(' ');

        pagesData.push({
          pageNumber: pageNum,
          text: pageText,
          width: viewport.width,
          height: viewport.height,
        });
      }

      return pagesData;
    } catch (error) {
      throw new Error(`Failed to get page data from PDF: ${error.message}`);
    }
  }

  /**
   * Checks if a PDF has selectable text (not scanned image)
   */
  static async hasTextLayer(pdfBuffer: Buffer): Promise<boolean> {
    try {
      const uint8Array = new Uint8Array(pdfBuffer);
      const pdfDoc = await pdfjsLib.getDocument(uint8Array).promise;

      // Check the first page for text content
      if (pdfDoc.numPages === 0) {
        return false;
      }

      const page = await pdfDoc.getPage(1);
      const textContent = await page.getTextContent();

      // If we have text items, the PDF has a text layer
      return textContent.items.length > 0;
    } catch (error) {
      // If we can't read the text layer, assume it's a scanned document
      return false;
    }
  }

  /**
   * Gets PDF metadata
   */
  static async getPdfMetadata(pdfBuffer: Buffer): Promise<any> {
    try {
      const uint8Array = new Uint8Array(pdfBuffer);
      const pdfDoc = await pdfjsLib.getDocument(uint8Array).promise;
      const metadata = await pdfDoc.getMetadata();

      return metadata;
    } catch (error) {
      throw new Error(`Failed to get PDF metadata: ${error.message}`);
    }
  }
}