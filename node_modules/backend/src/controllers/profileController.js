const User = require('../models/User');
const Skill = require('../models/Skill');
const Achievement = require('../models/Achievement');
const { buildResumeFromProfile } = require('../utils/resumeBuilder');

const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('name email role');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [skills, achievements] = await Promise.all([
      Skill.find({ userId }).sort({ skillName: 1 }),
      Achievement.find({ userId }).sort({ date: -1, createdAt: -1 }),
    ]);

    const trustScore = achievements.reduce((sum, item) => sum + (item.score || 0), 0);

    return res.json({
      user,
      skills,
      achievements,
      trustScore,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
};

const generateResume = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('name email role');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [skills, achievements] = await Promise.all([
      Skill.find({ userId }).sort({ skillName: 1 }),
      Achievement.find({ userId }).sort({ verified: -1, date: -1, createdAt: -1 }),
    ]);

    const trustScore = achievements.reduce((sum, item) => sum + (item.score || 0), 0);
    const resume = buildResumeFromProfile({
      user,
      skills,
      achievements,
      trustScore,
    });

    return res.json({
      user,
      trustScore,
      skills,
      achievements,
      resume,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to generate resume', error: error.message });
  }
};

const searchPublicProfiles = async (req, res) => {
  try {
    const name = String(req.query.name || '').trim();

    if (!name) {
      return res.status(400).json({ message: 'name query is required' });
    }

    const regex = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const users = await User.find({ role: 'Student', name: regex })
      .select('name email role')
      .sort({ name: 1 })
      .limit(30);

    const results = await Promise.all(
      users.map(async (user) => {
        const achievements = await Achievement.find({ userId: user._id }).select('score verified rejected');
        const trustScore = achievements.reduce((sum, item) => sum + (item.score || 0), 0);
        const totalAchievements = achievements.length;
        const verifiedCount = achievements.filter((item) => item.verified).length;
        const pendingCount = achievements.filter((item) => !item.verified && !item.rejected).length;

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          trustScore,
          totalAchievements,
          verifiedCount,
          pendingCount,
        };
      })
    );

    return res.json({ results });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to search public profiles', error: error.message });
  }
};

module.exports = {
  getProfile,
  generateResume,
  searchPublicProfiles,
};
