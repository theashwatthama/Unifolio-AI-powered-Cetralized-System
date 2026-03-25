const Achievement = require('../models/Achievement');
const Skill = require('../models/Skill');
const { calculateAchievementScore } = require('../utils/scoring');

const getAllSubmissions = async (req, res) => {
  try {
    const submissions = await Achievement.find({ suspiciousProof: { $ne: true } })
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });

    return res.json(submissions);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch submissions', error: error.message });
  }
};

const verifyAchievement = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejectionFeedback = '' } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: "action must be either 'approve' or 'reject'" });
    }

    const achievement = await Achievement.findById(id);
    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }

    if (action === 'reject' && !String(rejectionFeedback).trim()) {
      return res.status(400).json({ message: 'Rejection feedback is required for rejected submissions' });
    }

    achievement.verified = action === 'approve';
    achievement.rejected = action === 'reject';
    achievement.verifiedBadge = action === 'approve';
    achievement.rejectionFeedback = action === 'reject' ? String(rejectionFeedback).trim() : '';
    achievement.score = calculateAchievementScore({
      category: achievement.category,
      verified: achievement.verified,
      hasProof: achievement.hasProof,
    });

    await achievement.save();

    return res.json({ message: `Achievement ${action}d successfully`, achievement });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to verify achievement', error: error.message });
  }
};

const resetAllDetails = async (req, res) => {
  try {
    const achievementsResult = await Achievement.deleteMany({});
    const skillsResult = await Skill.deleteMany({});

    return res.json({
      message: 'All student/admin panel details reset to zero',
      deletedAchievements: achievementsResult.deletedCount,
      deletedSkills: skillsResult.deletedCount,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to reset details', error: error.message });
  }
};

module.exports = {
  getAllSubmissions,
  verifyAchievement,
  resetAllDetails,
};
