const express = require('express');
const { getProfile, generateResume, searchPublicProfiles } = require('../controllers/profileController');

const router = express.Router();

router.get('/profile/:userId', getProfile);
router.get('/resume/:userId', generateResume);
router.get('/public/search', searchPublicProfiles);

module.exports = router;
