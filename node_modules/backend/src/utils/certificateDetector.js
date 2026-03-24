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
];

const MIN_IMAGE_BYTES = 30 * 1024;
const MIN_PDF_BYTES = 20 * 1024;

const detectSuspiciousCertificate = (file) => {
  if (!file) {
    return {
      suspicious: false,
      reasons: [],
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

  const suspicious = reasons.length > 0;

  return {
    suspicious,
    reasons,
  };
};

module.exports = {
  detectSuspiciousCertificate,
};
