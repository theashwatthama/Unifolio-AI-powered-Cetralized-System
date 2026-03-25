const User = require('../models/User');
const Achievement = require('../models/Achievement');
const Skill = require('../models/Skill');
const { calculateAchievementScore } = require('../utils/scoring');
const { CATEGORY_TO_SKILL } = require('../utils/skillMap');

const buildSeedAchievements = (studentId) => {
  const records = [
    {
      userId: studentId,
      title: 'Smart Campus Hackathon Finalist',
      category: 'Hackathon',
      description: 'Built an AI attendance anomaly detector and reached finals.',
      date: new Date('2025-09-10'),
      hasProof: true,
      verified: true,
      rejected: false,
      verifiedBadge: true,
    },
    {
      userId: studentId,
      title: 'Software Engineering Internship',
      category: 'Internship',
      description: '8-week internship focused on API development and testing.',
      date: new Date('2025-07-01'),
      hasProof: true,
      verified: true,
      rejected: false,
      verifiedBadge: true,
    },
    {
      userId: studentId,
      title: 'Inter-College Football Tournament',
      category: 'Sports',
      description: 'Represented college team and reached semifinals.',
      date: new Date('2025-03-15'),
      hasProof: false,
      verified: false,
      rejected: false,
      verifiedBadge: false,
    },
    {
      userId: studentId,
      title: 'Cloud Computing Certification',
      category: 'Course',
      description: 'Completed hands-on cloud architecture coursework.',
      date: new Date('2025-01-20'),
      hasProof: true,
      verified: false,
      rejected: false,
      verifiedBadge: false,
    },
  ];

  return records.map((item) => ({
    ...item,
    score: calculateAchievementScore({
      category: item.category,
      verified: item.verified,
      hasProof: item.hasProof,
    }),
  }));
};

const seedDemoData = async () => {
  const student = await User.findOneAndUpdate(
    { email: 'student@unifolio.com' },
    {
      $set: {
        name: 'Aarav Sharma',
        username: 'aarav.sharma',
        role: 'Student',
        password: 'student123',
      },
    },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
  );

  await User.findOneAndUpdate(
    { email: 'admin@unifolio.com' },
    {
      $set: {
        name: 'Neha Verma',
        username: 'admin.neha',
        role: 'Admin',
        password: 'admin123',
      },
    },
    { upsert: true, setDefaultsOnInsert: true }
  );

  const hasAchievements = await Achievement.exists({ userId: student._id });
  if (!hasAchievements) {
    const achievements = buildSeedAchievements(student._id);
    await Achievement.insertMany(achievements);

    const uniqueSkills = Array.from(
      new Set(achievements.map((record) => CATEGORY_TO_SKILL[record.category]).filter(Boolean))
    );

    await Skill.insertMany(
      uniqueSkills.map((skillName) => ({
        userId: student._id,
        skillName,
      }))
    );
  }

  console.log('Demo seed data ready');
};

module.exports = seedDemoData;
