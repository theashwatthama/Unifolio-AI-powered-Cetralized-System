const Achievement = require('../models/Achievement');
const Skill = require('../models/Skill');
const { CATEGORY_TO_SKILL } = require('../utils/skillMap');
const { calculateAchievementScore } = require('../utils/scoring');
const { detectSuspiciousCertificate } = require('../utils/certificateDetector');

const DASHBOARD_CATEGORIES = [
  'Hackathon',
  'Internship',
  'Sports',
  'Course',
  'LeetCode',
  'HackerRank',
  'GeeksforGeeks',
  'Codeforces',
];

const addAchievement = async (req, res) => {
  try {
    const { userId, title, category, description, date, hasProof = false } = req.body;
    const uploadedFile = req.file;
    const proofExists = Boolean(uploadedFile) || hasProof === 'true' || hasProof === true;
    const detection = detectSuspiciousCertificate(uploadedFile);
    const suspiciousReason = detection.reasons.join('; ');

    if (!userId || !title || !category || !description || !date) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

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
      suspiciousProof: detection.suspicious,
      suspiciousProofReason: suspiciousReason,
      score,
      verified: false,
      rejected: false,
      verifiedBadge: false,
    });

    const mappedSkill = CATEGORY_TO_SKILL[category];
    if (mappedSkill) {
      await Skill.findOneAndUpdate(
        { userId, skillName: mappedSkill },
        { userId, skillName: mappedSkill },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

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

    const query = { userId };

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
    const achievements = await Achievement.find({ userId });

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
