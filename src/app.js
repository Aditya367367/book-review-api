const express = require('express');
const app = express();
require('dotenv').config();

const bookRoutes = require('./routes/bookRoutes');
const authRoutes = require('./routes/authRoutes');

app.use(express.json());

app.use('/api', authRoutes);
app.use('/api', bookRoutes);

app.get('/', (req, res) => {
  res.send('Book Review API');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});