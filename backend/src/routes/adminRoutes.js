const express = require('express');
const { getAllSubmissions, verifyAchievement, resetAllDetails } = require('../controllers/adminController');

const router = express.Router();

router.get('/admin/submissions', getAllSubmissions);
router.put('/verify/:id', verifyAchievement);
router.delete('/admin/reset-details', resetAllDetails);

module.exports = router;
