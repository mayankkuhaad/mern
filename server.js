const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes.js');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    await sequelize.authenticate();
    console.log('Database connected!');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
});
