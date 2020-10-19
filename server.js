const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');

// This is to handle uncaught expection errors. We must place it on top of the server file.
process.on('uncaughtException', (err) => {
  console.log(err);
  console.log('Uncaught Exception!. Shutting down...');
  // This is to terminate the server
  process.exit(1);
});

// This is for nodeJS to run the config.env file. We must install dotenv first: npm install dotenv
dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('DB connection successful!');
  });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});

// This is to handle unhandled rejection errors. We must close the server and shut the app.
process.on('unhandledRejection', (err) => {
  console.log(err);
  console.log('Unhandled Rejection!. Shutting down...');
  server.close(() => {
    // code 1 stands for unhandled rejection
    process.exit(1);
  });
});
