const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const User = require('./models/User.js'); 
const authRoutes = require('./routes/authRoutes.js');

const app = express();
const PORT = process.env.PORT || 5000;

sequelize.sync({ force: process.env.ENVIRONMENT === "PRODUCTION" ? false : true })
  .then(() => {
    console.log('Database synced successfully!');
  })
  .catch(err => {
    console.error('Error syncing database:', err);
  });

app.use(cors({
  origin: "http://localhost:3000",
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    await sequelize.authenticate();
    console.log('Database connected!');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
});