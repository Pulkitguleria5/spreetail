require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const { sequelize } = require('./src/model');
const importRoutes=require("./src/routes/importRoutes");
const authRoutes = require('./src/routes/authRoutes');
const groupRoutes = require('./src/routes/groupRoutes');
const rbacRoutes = require('./src/routes/rbacRoutes');
const expenseRoutes = require('./src/routes/expenseRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const paymentsRoutes = require('./src/routes/paymentRoutes');




sequelize.sync()
    .then(() => console.log('SQLite Connected and Synced'))
    .catch((error) => console.log('Error Connecting to Database: ', error));

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000'
];

const corsOption = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, or postman)
        if (!origin) return callback(null, true);
        
        const isVercel = origin.endsWith('.vercel.app');
        const isAllowed = allowedOrigins.includes(origin) || isVercel;
        
        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};

const app = express();

app.use(cors(corsOption));
// app.use(express.json()); // Middleware

app.use((request, response, next) => {
  if (request.originalUrl.startsWith('/payments/webhook')) {
    next();
  } else {
    express.json()(request, response, next);
  }
});

app.use(cookieParser()); // Middleware

app.use("/api/import",importRoutes);
app.use('/auth', authRoutes);
app.use('/groups', groupRoutes);
app.use('/users', rbacRoutes);
app.use('/expenses', expenseRoutes);
app.use('/payments', paymentsRoutes);
app.use('/profile', profileRoutes);

// app.use('/profile', profileRoutes);

app.listen(5001, () => {
    console.log('Server is running on port 5001');
});
