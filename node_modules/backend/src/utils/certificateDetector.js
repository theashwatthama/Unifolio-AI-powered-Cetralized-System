const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const pdfParse = require('pdf-parse');
const { createWorker } = require('tesseract.js');
const sharp = require('sharp');

const SUSPICIOUS_KEYWORDS = [
  'fake',
  'sample',
  'template',
  'dummy',
  'demo',
  'watermark',
  'edited',
  'photoshop',
  'test',
  'copy',
  'copied',
  'screenshot',
  'downloaded',
];

const SUSPICIOUS_TEXT_KEYWORDS = [
  'watermark',
  'sample',
  'fake',
  'demo',
  'copied',
  'for reference only',
  'not valid',
  'generated',
  'preview',
];

const MIN_IMAGE_BYTES = 30 * 1024;
const MIN_PDF_BYTES = 20 * 1024;
const MIN_TEXT_FOR_FINGERPRINT = 40;
const MAX_STORED_EXTRACTED_TEXT = 4000;

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const hashFile = async (filePath) => {
  if (!filePath) {
    return '';
  }

  const buffer = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

const hashText = (text) => crypto.createHash('sha256').update(text).digest('hex');

const normalizeText = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const findSuspiciousTextKeyword = (text) => {
  const normalized = String(text || '').toLowerCase();
  if (!normalized) {
    return '';
  }

  return SUSPICIOUS_TEXT_KEYWORDS.find((keyword) => normalized.includes(keyword)) || '';
};

const extractPdfText = async (filePath) => {
  const buffer = await fs.readFile(filePath);
  const parsed = await pdfParse(buffer);
  return String(parsed?.text || '');
};

const extractImageText = async (filePath) => {
  const worker = await createWorker('eng');

  try {
    const result = await worker.recognize(filePath);
    return String(result?.data?.text || '');
  } finally {
    await worker.terminate();
  }
};

const buildImageVisualHash = async (filePath) => {
  const { data } = await sharp(filePath)
    .resize(16, 16, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (!data || data.length === 0) {
    return '';
  }

  const average = data.reduce((sum, value) => sum + value, 0) / data.length;
  const bits = Array.from(data, (value) => (value >= average ? '1' : '0')).join('');
  let hex = '';

  for (let i = 0; i < bits.length; i += 4) {
    hex += Number.parseInt(bits.slice(i, i + 4), 2).toString(16);
  }

  return hex;
};

const extractProofText = async (file) => {
  if (!file?.path) {
    return { text: '', scanFailed: false };
  }

  const filePath = file.path;
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mimeType = (file.mimetype || '').toLowerCase();

  try {
    if (mimeType === 'application/pdf' || ext === '.pdf') {
      const text = await extractPdfText(filePath);
      return { text, scanFailed: false };
    }

    if (mimeType.startsWith('image/') || IMAGE_EXTENSIONS.has(ext)) {
      const text = await extractImageText(filePath);
      return { text, scanFailed: false };
    }

    return { text: '', scanFailed: false };
  } catch (error) {
    return { text: '', scanFailed: true };
  }
};

const buildProofVisualHash = async (file) => {
  if (!file?.path) {
    return '';
  }

  const ext = path.extname(file.originalname || '').toLowerCase();
  const mimeType = (file.mimetype || '').toLowerCase();
  const isImage = mimeType.startsWith('image/') || IMAGE_EXTENSIONS.has(ext);

  if (!isImage) {
    return '';
  }

  try {
    return await buildImageVisualHash(file.path);
  } catch (error) {
    return '';
  }
};

const detectSuspiciousCertificate = async (file) => {
  if (!file) {
    return {
      suspicious: false,
      reasons: [],
      fileHash: '',
      textFingerprint: '',
      visualHash: '',
      extractedText: '',
    };
  }

  const reasons = [];
  const filename = (file.originalname || '').toLowerCase();
  const mimeType = (file.mimetype || '').toLowerCase();
  const size = Number(file.size || 0);

  const matchedKeyword = SUSPICIOUS_KEYWORDS.find((keyword) => filename.includes(keyword));
  if (matchedKeyword) {
    reasons.push(`Suspicious filename keyword detected: ${matchedKeyword}`);
  }

  if (mimeType.startsWith('image/') && size > 0 && size < MIN_IMAGE_BYTES) {
    reasons.push('Uploaded image proof is unusually small');
  }

  if (mimeType === 'application/pdf' && size > 0 && size < MIN_PDF_BYTES) {
    reasons.push('Uploaded PDF proof is unusually small');
  }

  const { text: extractedTextRaw, scanFailed } = await extractProofText(file);
  const normalizedExtractedText = normalizeText(extractedTextRaw);
  const suspiciousTextKeyword = findSuspiciousTextKeyword(normalizedExtractedText);
  if (suspiciousTextKeyword) {
    reasons.push(`Suspicious certificate text detected: ${suspiciousTextKeyword}`);
  }

  const suspicious = reasons.length > 0;
  let fileHash = '';
  let visualHash = '';
  let textFingerprint = '';

  try {
    fileHash = await hashFile(file.path);
  } catch (error) {
    reasons.push('Failed to read certificate file for validation');
  }

  visualHash = await buildProofVisualHash(file);

  if (normalizedExtractedText.length >= MIN_TEXT_FOR_FINGERPRINT) {
    textFingerprint = hashText(normalizedExtractedText);
  }

  return {
    suspicious: suspicious || reasons.includes('Failed to read certificate file for validation'),
    reasons,
    fileHash,
    textFingerprint,
    visualHash,
    extractedText: normalizedExtractedText.slice(0, MAX_STORED_EXTRACTED_TEXT),
    scanFailed,
  };
};

module.exports = {
  detectSuspiciousCertificate,
};
