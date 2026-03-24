const formatDate = (dateValue) => {
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

const buildResumeFromProfile = ({ user, skills, achievements, trustScore }) => {
  const safeAchievements = Array.isArray(achievements) ? achievements : [];
  const safeSkills = Array.isArray(skills) ? skills : [];

  const verifiedAchievements = safeAchievements.filter((item) => item.verified);
  const pendingAchievements = safeAchievements.filter((item) => !item.verified && !item.rejected);

  const headline = verifiedAchievements.length > 0
    ? `${user.name} is an achievement-driven student with ${verifiedAchievements.length} verified accomplishment(s).`
    : `${user.name} is an active student portfolio owner with growing academic and extracurricular records.`;

  const achievementsBlock = safeAchievements
    .slice(0, 8)
    .map((item) => {
      const status = item.verified ? 'Verified' : item.rejected ? 'Rejected' : 'Pending';
      const date = formatDate(item.date);
      const proof = item.hasProof ? 'Proof Attached' : 'No Proof';
      return `- ${item.title} (${item.category}) | ${status} | ${date} | ${proof}`;
    })
    .join('\n');

  const certificatesBlock = safeAchievements
    .filter((item) => item.proofFileName)
    .slice(0, 8)
    .map((item) => `- ${item.proofFileName} (${item.category})`)
    .join('\n');

  const skillNames = safeSkills.map((item) => item.skillName);
  const generatedCoreSkills = skillNames.length > 0 ? skillNames.join(', ') : 'Problem Solving, Teamwork, Technical Learning';

  const summary = [
    `${headline}`,
    `Current trust score: ${trustScore}.`,
    `Total achievements: ${safeAchievements.length}, Verified: ${verifiedAchievements.length}, Pending: ${pendingAchievements.length}.`,
  ].join(' ');

  const resumeText = [
    `${user.name.toUpperCase()}`,
    `${user.email}`,
    '',
    'PROFESSIONAL SUMMARY',
    summary,
    '',
    'KEY SKILLS',
    `- ${generatedCoreSkills}`,
    '',
    'ACHIEVEMENTS',
    achievementsBlock || '- No achievements submitted yet.',
    '',
    'CERTIFICATES / PROOFS',
    certificatesBlock || '- No certificate files uploaded yet.',
    '',
    'PROFILE INSIGHT',
    `- Role: ${user.role}`,
    `- Trust Score: ${trustScore}`,
    `- Portfolio Type: Centralized Academic + Extracurricular Record`,
  ].join('\n');

  return {
    headline,
    summary,
    generatedAt: new Date().toISOString(),
    resumeText,
  };
};

module.exports = {
  buildResumeFromProfile,
};
