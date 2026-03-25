const Achievement = require('../models/Achievement');
const fs = require('node:fs/promises');
const { calculateAchievementScore } = require('../utils/scoring');
const { detectSuspiciousCertificate } = require('../utils/certificateDetector');

const TEXT_SIMILARITY_THRESHOLD = 0.9;
const VISUAL_HASH_DISTANCE_THRESHOLD = 10;
const MIN_TEXT_FOR_SIMILARITY = 80;
const NIBBLE_POPCOUNT = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4];

const DASHBOARD_CATEGORIES = [
  'Hackathon',
  'Internship',
  'Academics',
  'Sports',
  'Course',
  'LeetCode',
  'HackerRank',
  'GeeksforGeeks',
  'Codeforces',
];

const removeUploadedFile = async (file) => {
  if (!file?.path) {
    return;
  }

  try {
    await fs.unlink(file.path);
  } catch (error) {
    // Ignore cleanup errors because submission response is more important.
  }
};

const hammingDistance = (left, right) => {
  if (!left || !right || left.length !== right.length) {
    return Number.POSITIVE_INFINITY;
  }

  let distance = 0;
  for (let index = 0; index < left.length; index += 1) {
    const leftByte = Number.parseInt(left[index], 16);
    const rightByte = Number.parseInt(right[index], 16);
    const xor = leftByte ^ rightByte;
    distance += NIBBLE_POPCOUNT[xor];
  }

  return distance;
};

const bigrams = (text) => {
  const value = String(text || '');
  if (value.length < 2) {
    return [];
  }

  const result = [];
  for (let index = 0; index < value.length - 1; index += 1) {
    result.push(value.slice(index, index + 2));
  }
  return result;
};

const diceSimilarity = (a, b) => {
  const left = bigrams(a);
  const right = bigrams(b);

  if (left.length === 0 || right.length === 0) {
    return 0;
  }

  const counts = new Map();
  left.forEach((item) => {
    counts.set(item, (counts.get(item) || 0) + 1);
  });

  let overlap = 0;
  right.forEach((item) => {
    const count = counts.get(item) || 0;
    if (count > 0) {
      overlap += 1;
      counts.set(item, count - 1);
    }
  });

  return (2 * overlap) / (left.length + right.length);
};

const isHardBlockReason = (reason = '') => {
  const value = String(reason).toLowerCase();

  // High confidence: direct duplicate/similarity evidence across submissions.
  if (
    value.includes('matches an already uploaded certificate') ||
    value.includes('matches an existing certificate') ||
    value.includes('highly similar to an already submitted certificate') ||
    value.includes('visually too similar to an existing submission')
  ) {
    return true;
  }

  // Medium-high confidence: explicit fake/template/edited wording in extracted text.
  if (value.includes('suspicious certificate text detected')) {
    return true;
  }

  // Filename keywords should block only for clearly malicious terms.
  if (
    value.includes('suspicious filename keyword detected: fake') ||
    value.includes('suspicious filename keyword detected: template') ||
    value.includes('suspicious filename keyword detected: dummy') ||
    value.includes('suspicious filename keyword detected: photoshop') ||
    value.includes('suspicious filename keyword detected: edited')
  ) {
    return true;
  }

  return false;
};

const addAchievement = async (req, res) => {
  try {
    const { userId, title, category, description, date, hasProof = false } = req.body;
    const uploadedFile = req.file;
    const proofExists = Boolean(uploadedFile) || hasProof === 'true' || hasProof === true;
    const detection = await detectSuspiciousCertificate(uploadedFile);

    if (!userId || !title || !category || !description || !date) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    if (uploadedFile && detection.fileHash) {
      const duplicateProof = await Achievement.findOne({ proofFileHash: detection.fileHash })
        .select('_id userId title')
        .lean();

      if (duplicateProof) {
        detection.reasons.push('Certificate file matches an already uploaded certificate (possible copied proof)');
        detection.suspicious = true;
      }
    }

    if (uploadedFile && detection.textFingerprint) {
      const duplicateTextFingerprint = await Achievement.findOne({ proofTextFingerprint: detection.textFingerprint })
        .select('_id userId title')
        .lean();

      if (duplicateTextFingerprint) {
        detection.reasons.push('Certificate text fingerprint matches an existing certificate (possible copied content)');
        detection.suspicious = true;
      }
    }

    if (uploadedFile && detection.visualHash) {
      const sameVisualHash = await Achievement.findOne({ proofVisualHash: detection.visualHash })
        .select('_id userId title')
        .lean();

      if (sameVisualHash) {
        detection.reasons.push('Certificate visual fingerprint matches an existing certificate (possible copied image)');
        detection.suspicious = true;
      }
    }

    if (uploadedFile && !detection.suspicious) {
      const candidates = await Achievement.find({
        $or: [{ proofExtractedText: { $ne: '' } }, { proofVisualHash: { $ne: '' } }],
      })
        .select('proofExtractedText proofVisualHash title userId')
        .sort({ createdAt: -1 })
        .limit(500)
        .lean();

      if (detection.extractedText.length >= MIN_TEXT_FOR_SIMILARITY) {
        const textMatch = candidates.find((candidate) => {
          const priorText = String(candidate.proofExtractedText || '');
          if (priorText.length < MIN_TEXT_FOR_SIMILARITY) {
            return false;
          }

          const similarity = diceSimilarity(detection.extractedText, priorText);
          return similarity >= TEXT_SIMILARITY_THRESHOLD;
        });

        if (textMatch) {
          detection.reasons.push('Certificate text is highly similar to an already submitted certificate');
          detection.suspicious = true;
        }
      }

      if (!detection.suspicious && detection.visualHash) {
        const visualMatch = candidates.find((candidate) => {
          const existingVisualHash = String(candidate.proofVisualHash || '');
          const distance = hammingDistance(detection.visualHash, existingVisualHash);
          return distance <= VISUAL_HASH_DISTANCE_THRESHOLD;
        });

        if (visualMatch) {
          detection.reasons.push('Certificate image is visually too similar to an existing submission');
          detection.suspicious = true;
        }
      }
    }

    const shouldBlock = uploadedFile && detection.reasons.some((reason) => isHardBlockReason(reason));

    if (uploadedFile && shouldBlock) {
      await removeUploadedFile(uploadedFile);
      return res.status(400).json({
        message: 'Certificate rejected by fake detector. Please upload original certificate.',
        detectorWarning: 'Suspicious/copy certificate detected. Submission blocked.',
        detectorReasons: detection.reasons,
        blocked: true,
      });
    }

    detection.suspicious = false;

    const suspiciousReason = detection.reasons.join('; ');

    const score = calculateAchievementScore({ category, verified: false, hasProof: proofExists });

    const achievement = await Achievement.create({
      userId,
      title,
      category,
      description,
      date,
      hasProof: proofExists,
      proofFileUrl: uploadedFile ? `/uploads/${uploadedFile.filename}` : '',
      proofFileName: uploadedFile ? uploadedFile.originalname : '',
      proofFileType: uploadedFile ? uploadedFile.mimetype : '',
      proofFileHash: uploadedFile ? detection.fileHash : '',
      proofTextFingerprint: uploadedFile ? detection.textFingerprint : '',
      proofVisualHash: uploadedFile ? detection.visualHash : '',
      proofExtractedText: uploadedFile ? detection.extractedText : '',
      suspiciousProof: detection.suspicious,
      suspiciousProofReason: suspiciousReason,
      score,
      verified: false,
      rejected: false,
      verifiedBadge: false,
    });

    return res.status(201).json({
      message: 'Achievement added',
      achievement,
      detectorWarning: detection.suspicious
        ? 'Potential fake certificate detected. Please upload a clearer/original proof.'
        : '',
      detectorReasons: detection.reasons,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add achievement', error: error.message });
  }
};

const getAchievementsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { category, verified } = req.query;

    const query = {
      userId,
      suspiciousProof: { $ne: true },
    };

    if (category) {
      query.category = category;
    }

    if (verified === 'true' || verified === 'false') {
      query.verified = verified === 'true';
      query.rejected = false;
    }

    if (verified === 'rejected') {
      query.rejected = true;
    }

    const achievements = await Achievement.find(query).sort({ date: -1, createdAt: -1 });

    return res.json(achievements);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch achievements', error: error.message });
  }
};

const getDashboard = async (req, res) => {
  try {
    const { userId } = req.params;
    const achievements = await Achievement.find({
      userId,
      suspiciousProof: { $ne: true },
    });

    const total = achievements.length;
    const verified = achievements.filter((item) => item.verified).length;
    const rejected = achievements.filter((item) => item.rejected).length;
    const pending = achievements.filter((item) => !item.verified && !item.rejected).length;

    const categoryBreakdown = DASHBOARD_CATEGORIES.map((category) => ({
      category,
      count: achievements.filter((item) => item.category === category).length,
    }));

    const trustScore = achievements.reduce((sum, item) => sum + (item.score || 0), 0);

    return res.json({
      total,
      verified,
      pending,
      rejected,
      trustScore,
      categoryBreakdown,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch dashboard', error: error.message });
  }
};

module.exports = {
  addAchievement,
  getAchievementsByUser,
  getDashboard,
};
