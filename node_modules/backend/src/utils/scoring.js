const calculateAchievementScore = ({ category, verified = false, hasProof = false }) => {
  let score = 0;

  if (verified) score += 50;
  if (category === 'Internship') score += 30;
  if (category === 'Hackathon') score += 20;
  if (hasProof) score += 20;

  return score;
};

module.exports = {
  calculateAchievementScore,
};
