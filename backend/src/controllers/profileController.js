const User = require('../models/User');
const Skill = require('../models/Skill');
const Achievement = require('../models/Achievement');

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

module.exports = {
  getProfile,
};
