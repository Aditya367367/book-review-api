const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const dbPromise = require('../db'); // Adjust path if needed

exports.signup = async (req, res) => {
  const { username, password } = req.body;
  try {
    const db = await dbPromise; // Make sure this line is present
    // Check if user exists
    const userExists = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err); // <--- Add this line
    res.status(500).json({ message: 'Server error' });
  }
};
exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const db = await dbPromise; // Make sure this is present
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (err) {
    console.error(err); // <-- Add this line
    res.status(500).json({ message: 'Server error' });
  }
};