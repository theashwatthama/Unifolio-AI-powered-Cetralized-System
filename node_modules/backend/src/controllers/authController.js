const User = require('../models/User');

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ role: 1, name: 1 });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

const registerStudent = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: 'name, username, email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const normalizedUsername = String(username).trim().toLowerCase();
    const usernamePattern = /^[a-z0-9._-]+$/;

    if (normalizedUsername.length < 3 || normalizedUsername.length > 30 || !usernamePattern.test(normalizedUsername)) {
      return res.status(400).json({
        message: 'Username must be 3-30 chars and can contain only letters, numbers, dot, underscore, hyphen',
      });
    }

    const existingUsername = await User.findOne({ username: normalizedUsername });

    if (existingUsername) {
      return res.status(409).json({ message: 'Username already taken' });
    }

    const normalizedEmail = email.toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      username: normalizedUsername,
      email: normalizedEmail,
      password,
      role: 'Student',
    });

    return res.status(201).json({
      message: 'Student account created successfully',
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { identifier, email, role, password } = req.body;
    const loginIdentifier = String(identifier || email || '')
      .trim()
      .toLowerCase();

    if (!loginIdentifier || !role || !password) {
      return res.status(400).json({ message: 'email/username, role and password are required' });
    }

    const user = await User.findOne({
      role,
      $or: [{ email: loginIdentifier }, { username: loginIdentifier }],
    }).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found for selected role with provided email/username' });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    return res.json({
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

module.exports = {
  getUsers,
  registerStudent,
  login,
};
