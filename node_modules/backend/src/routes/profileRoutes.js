const express = require('express');
const { getProfile, generateResume, generateAiResume, searchPublicProfiles, addSkill, removeSkill } = require('../controllers/profileController');

const router = express.Router();

router.get('/profile/:userId', getProfile);
router.post('/profile/:userId/skills', addSkill);
router.delete('/profile/:userId/skills/:skillId', removeSkill);
router.get('/resume/:userId', generateResume);
router.post('/resume-ai/:userId', generateAiResume);
router.get('/public/search', searchPublicProfiles);

module.exports = router;
