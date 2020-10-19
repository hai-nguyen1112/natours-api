const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

/**
 * 1) Define global middlewares
 */
// This is a middleware we must use to server static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// set security HTTP headers
app.use(helmet());

// This is a middleware for logger
if (process.env.NODE_ENV === 'development') {
  // This is to make this middleware only run when in the development enviroment
  app.use(morgan('dev'));
}

// This is a middleware that limits requests from same API
// This is to allow 100 requests per hour for one IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
// This is to apply the limiter to only /api
app.use('/api', limiter);

// This is a middleware we must use to add the data from the body of the API request to the req argument of the route handler callback function.
app.use(express.json({ limit: '10kb' })); // if the body of the request is larger than 10kb, Express will not accept it.

app.use(cookieParser());

// This is a middleware that does data sanitization against NoSQL query injection.
app.use(mongoSanitize());

// This is a middleware that does data sanitization against XSS attack.
app.use(xss());

// This is a middleware that prevents parameter pollution. It will remove all repeated parameters in the query string and only use the last one. We must put it after other middleware.
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ], // This is to make hpp not apply to the parameters listed in whiltelist
  })
);

app.use(compression());

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

/**
 * 2) Use the routers
 */
// This is for the views
app.use('/', viewRouter);

// This is for the APIs
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// This is to send back an error message for undefined routes. We must put this after defined routes.
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
  // Express will skip all middlewares in the middle and go straight to the error handling middleware below
});

app.use(globalErrorHandler);

module.exports = app;
