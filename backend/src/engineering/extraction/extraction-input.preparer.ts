import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { EngineeringInput } from '../interfaces/engineering-input.types';
import * as fs from 'fs';
import * as path from 'path';

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const SUPPORTED_PDF_TYPE = 'application/pdf';
const MAX_FILE_SIZE_MB = 20;

@Injectable()
export class ExtractionInputPreparer {
  private readonly logger = new Logger(ExtractionInputPreparer.name);

  /**
   * Converts uploaded Multer files into normalized EngineeringInput[].
   *
   * Images → passed through directly as binary data.
   * PDFs  → converted page-by-page to images using pdf-parse + canvas,
   *          OR sent as raw PDF bytes when Claude can handle it natively.
   *
   * For hackathon simplicity: PDFs are sent as raw bytes with application/pdf mime type.
   * Claude supports PDF input natively through base64 document blocks.
   * If the configured Claude model does not support PDFs, swap the PDF branch for image rendering.
   */
  async prepare(files: Express.Multer.File[]): Promise<EngineeringInput[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file must be provided for extraction');
    }

    const inputs: EngineeringInput[] = [];

    for (const file of files) {
      this.validateFile(file);

      if (SUPPORTED_IMAGE_TYPES.includes(file.mimetype)) {
        inputs.push(await this.prepareImageInput(file));
      } else if (file.mimetype === SUPPORTED_PDF_TYPE) {
        const pdfInputs = await this.preparePdfInputs(file);
        inputs.push(...pdfInputs);
      } else {
        this.logger.warn(`Unsupported file type: ${file.mimetype} — skipping ${file.originalname}`);
      }
    }

    if (inputs.length === 0) {
      throw new BadRequestException(
        'No supported input files could be prepared. Supported types: images (JPEG, PNG, WebP) and PDF.',
      );
    }

    this.logger.log(`Prepared ${inputs.length} engineering inputs from ${files.length} files`);
    return inputs;
  }

  private validateFile(file: Express.Multer.File): void {
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_FILE_SIZE_MB) {
      throw new BadRequestException(
        `File ${file.originalname} exceeds maximum size of ${MAX_FILE_SIZE_MB}MB`,
      );
    }
  }

  private async prepareImageInput(file: Express.Multer.File): Promise<EngineeringInput> {
    const data = fs.existsSync(file.path)
      ? fs.readFileSync(file.path)
      : file.buffer;

    return {
      filename: file.originalname,
      mimeType: file.mimetype,
      data,
    };
  }

  /**
   * PDF handling:
   * - Claude supports PDFs natively as inline base64 document blocks.
   * - For hackathon: send each PDF as a single input with application/pdf mime type.
   * - If multi-page PDFs need per-page handling, replace this with a pdf-to-image renderer.
   */
  private async preparePdfInputs(file: Express.Multer.File): Promise<EngineeringInput[]> {
    const data = fs.existsSync(file.path)
      ? fs.readFileSync(file.path)
      : file.buffer;

    // Try to get page count for metadata purposes
    let pageCount = 1;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfParse = require('pdf-parse');
      const parsed = await pdfParse(data);
      pageCount = parsed.numpages;
      this.logger.log(`PDF ${file.originalname}: ${pageCount} pages`);
    } catch {
      this.logger.warn(`Could not determine page count for ${file.originalname} — treating as single input`);
    }

    // Send the full PDF as one input — Claude handles multi-page internally
    return [
      {
        filename: file.originalname,
        mimeType: 'application/pdf',
        data,
        pageNumber: undefined, // whole PDF
      },
    ];
  }
}
