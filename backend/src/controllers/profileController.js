const User = require('../models/User');
const Skill = require('../models/Skill');
const Achievement = require('../models/Achievement');
const { buildResumeFromProfile } = require('../utils/resumeBuilder');
const { generateAiResumeFromProfile } = require('../utils/aiResumeService');

const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('name username email role');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [skills, achievements] = await Promise.all([
      Skill.find({ userId }).sort({ skillName: 1 }),
      Achievement.find({ userId, verified: true }).sort({ date: -1, createdAt: -1 }),
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

    const user = await User.findById(userId).select('name username email role');
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

const generateAiResume = async (req, res) => {
  try {
    const { userId } = req.params;
    const { provider = 'gemini', template = 'general', targetRole = '', extraNotes = '' } = req.body || {};

    const user = await User.findById(userId).select('name username email role');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [skills, achievements] = await Promise.all([
      Skill.find({ userId }).sort({ skillName: 1 }),
      Achievement.find({ userId }).sort({ verified: -1, date: -1, createdAt: -1 }),
    ]);

    const trustScore = achievements.reduce((sum, item) => sum + (item.score || 0), 0);

    let aiResponse;

    try {
      aiResponse = await generateAiResumeFromProfile({
        profile: {
          user,
          skills,
          achievements,
          trustScore,
        },
        provider,
        template,
        targetRole,
        extraNotes,
      });
    } catch (providerError) {
      const fallbackResume = buildResumeFromProfile({
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
        resume: {
          provider: 'fallback-local',
          model: 'rules-v1',
          resumeText: fallbackResume.resumeText,
          fallback: true,
          warning: providerError.message,
        },
      });
    }

    return res.json({
      user,
      trustScore,
      skills,
      achievements,
      resume: {
        provider: aiResponse.provider,
        model: aiResponse.model,
        resumeText: aiResponse.resumeText,
        fallback: false,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to generate AI resume', error: error.message });
  }
};

const searchPublicProfiles = async (req, res) => {
  try {
    const name = String(req.query.name || '').trim();
    const skill = String(req.query.skill || '').trim();

    if (!name && !skill) {
      return res.status(400).json({ message: 'name or skill query is required' });
    }

    const baseQuery = { role: 'Student' };
    const matchedSkillsByUserId = new Map();

    if (skill) {
      const normalizedSkill = skill.replace(/\s+/g, ' ').trim();
      const escapedSkill = normalizedSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const skillPattern = new RegExp(escapedSkill, 'i');

      const matchedSkillDocs = await Skill.find({ skillName: skillPattern }).select('userId skillName');
      const matchedUserIds = Array.from(new Set(matchedSkillDocs.map((item) => String(item.userId))));

      if (matchedUserIds.length === 0) {
        return res.json({ results: [] });
      }

      matchedSkillDocs.forEach((item) => {
        const key = String(item.userId);
        const existing = matchedSkillsByUserId.get(key) || [];

        if (!existing.includes(item.skillName)) {
          existing.push(item.skillName);
        }

        matchedSkillsByUserId.set(key, existing);
      });

      baseQuery._id = { $in: matchedUserIds };
    }

    let users = [];

    if (name) {
      const normalizedName = name.replace(/\s+/g, ' ').trim();
      const escapedName = normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const exactPattern = new RegExp(`^${escapedName.replace(/\s+/g, '\\s+')}$`, 'i');
      const partialPattern = new RegExp(escapedName, 'i');

      users = await User.find({ ...baseQuery, name: exactPattern })
        .select('name username email role')
        .sort({ name: 1 })
        .limit(30);

      if (users.length === 0) {
        users = await User.find({ ...baseQuery, name: partialPattern })
          .select('name username email role')
          .sort({ name: 1 })
          .limit(30);
      }
    } else {
      users = await User.find(baseQuery).select('name username email role').sort({ name: 1 }).limit(50);
    }

    const results = await Promise.all(
      users.map(async (user) => {
        const [achievements, skills] = await Promise.all([
          Achievement.find({ userId: user._id, verified: true }).select('score verified'),
          Skill.find({ userId: user._id }).select('skillName').sort({ skillName: 1 }),
        ]);

        const trustScore = achievements.reduce((sum, item) => sum + (item.score || 0), 0);
        const totalAchievements = achievements.length;
        const verifiedCount = achievements.filter((item) => item.verified).length;
        const userId = String(user._id);
        const skillNames = skills.map((item) => item.skillName);

        return {
          _id: userId,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
          trustScore,
          totalAchievements,
          verifiedCount,
          pendingCount: 0,
          skills: skillNames,
          matchedSkills: matchedSkillsByUserId.get(userId) || [],
        };
      })
    );

    const rankedResults = results.sort((left, right) => {
      if (right.trustScore !== left.trustScore) {
        return right.trustScore - left.trustScore;
      }

      if (right.verifiedCount !== left.verifiedCount) {
        return right.verifiedCount - left.verifiedCount;
      }

      if (right.totalAchievements !== left.totalAchievements) {
        return right.totalAchievements - left.totalAchievements;
      }

      return left.name.localeCompare(right.name);
    });

    return res.json({ results: rankedResults });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to search public profiles', error: error.message });
  }
};

const addSkill = async (req, res) => {
  try {
    const { userId } = req.params;
    const skillName = String(req.body?.skillName || '').trim();

    if (!skillName) {
      return res.status(400).json({ message: 'skillName is required' });
    }

    if (skillName.length > 50) {
      return res.status(400).json({ message: 'skillName must be 50 characters or fewer' });
    }

    await Skill.findOneAndUpdate(
      { userId, skillName },
      { userId, skillName },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const skills = await Skill.find({ userId }).sort({ skillName: 1 });
    return res.status(201).json({ skills });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add skill', error: error.message });
  }
};

const removeSkill = async (req, res) => {
  try {
    const { userId, skillId } = req.params;

    await Skill.deleteOne({ _id: skillId, userId });

    const skills = await Skill.find({ userId }).sort({ skillName: 1 });
    return res.json({ skills });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to remove skill', error: error.message });
  }
};

module.exports = {
  getProfile,
  generateResume,
  generateAiResume,
  searchPublicProfiles,
  addSkill,
  removeSkill,
};
