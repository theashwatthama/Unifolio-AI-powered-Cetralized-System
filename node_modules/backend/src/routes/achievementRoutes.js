const express = require('express');
const { uploadProof } = require('../middleware/upload');
const {
  addAchievement,
  getAchievementsByUser,
  getDashboard,
} = require('../controllers/achievementController');

const router = express.Router();

router.post('/add-achievement', uploadProof.single('proofFile'), addAchievement);
router.get('/achievements/:userId', getAchievementsByUser);
router.get('/dashboard/:userId', getDashboard);

module.exports = router;
