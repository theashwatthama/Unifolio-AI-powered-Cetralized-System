const express = require('express');
const { getUsers, login, registerStudent } = require('../controllers/authController');

const router = express.Router();

router.get('/users', getUsers);
router.post('/login', login);
router.post('/register-student', registerStudent);

module.exports = router;
