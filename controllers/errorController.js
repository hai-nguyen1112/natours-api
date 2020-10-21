const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 404);
};

const handleDuplicateFieldsDB = (err) => {
  const message = `Duplicate field value: ${err.keyValue.name}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again!', 401);
};

const handleJWTExpiredError = () => {
  return new AppError('Your token has expired. Please log in again!', 401);
};

const sendErrorDev = (err, req, res) => {
  // originalUrl is the url without the host name
  if (req.originalUrl.startsWith('/api')) {
    // This is for API errors
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      statusCode: err.statusCode,
      message: err.message,
      stack: err.stack,
    });
  }
  // This is for rendered website errors
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        statusCode: err.statusCode,
        message: err.message,
      });
      // Programming or other unknown error: don't leak error details to client
    }
    // 1) Log error
    // eslint-disable-next-line no-console
    console.error('ERROR: ', err);
    // 2) Send generic message
    return res.status(500).json({
      status: 'error',
      statusCode: 500,
      message: 'Something went wrong!',
    });
  }

  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
    // Programming or other unknown error: don't leak error details to client
  }
  // 1) Log error
  // eslint-disable-next-line no-console
  console.error('ERROR: ', err);
  // 2) Send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError') {
      error = handleCastErrorDB(error);
    }
    if (error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }
    if (error._message && error._message.includes('validation')) {
      error = handleValidationErrorDB(error);
    }
    if (error.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }
    if (error.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }
    sendErrorProd(error, req, res);
  }
};
