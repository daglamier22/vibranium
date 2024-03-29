const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const logger = require('./utils/logger');

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}/${process.env.MONGO_DEFAULT_DATABASE}${process.env.MONGO_DEFAULT_DATABASE_SUB}?retryWrites=true`;

const testRoutes = require('./routes/tests');
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/account');
const transactionRoutes = require('./routes/transaction');
const itemRoutes = require('./routes/item');

const app = express();

// handle cors with the cors package
const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:8080',
  'https://budget-palladium.herokuapp.com',
  'https://palladium.bmcc.digital'
];
app.use(cors({
  methods: ['GET, POST, PUT, PATCH, DELETE, OPTIONS'],
  exposedHeaders: ['Content-Type, Authorization'],
  credentials: true,
  origin: (origin, callback) => {
    // allow requests with no origin
    // (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.indexOf(origin) === -1) {
      var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

// parse incoming json post bodies
app.use(express.json());

// add various security headers
app.use(helmet());

// log incoming requests
app.use(morgan('combined', { stream: logger.stream }));

app.use('/tests', testRoutes);
app.use('/auth', authRoutes);
app.use('/accounts', accountRoutes);
app.use('/transactions', transactionRoutes);
app.use('/item', itemRoutes);

mongoose
  .connect(MONGODB_URI)
  .then(result => {
    app.listen(process.env.PORT || 3000);
  })
  .catch(err => {
    logger.error(err);
  });
