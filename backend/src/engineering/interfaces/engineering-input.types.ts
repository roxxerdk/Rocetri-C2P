/**
 * Normalized engineering input — one entry per file/page fed to Claude.
 * The ExtractionInputPreparer converts raw uploaded files into this structure.
 */
export interface EngineeringInput {
  /** Original filename for reference in source views */
  filename: string;
  /** MIME type — image/jpeg, image/png, application/pdf, etc. */
  mimeType: string;
  /** Raw bytes of the file or PDF page image */
  data: Buffer;
  /** For PDF pages — 1-indexed page number within the source PDF */
  pageNumber?: number;
}

/**
 * One extraction session request — all inputs for a single product.
 */
export interface ExtractionSession {
  projectId: string;
  inputs: EngineeringInput[];
  jobId: string;
}
