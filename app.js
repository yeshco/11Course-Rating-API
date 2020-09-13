'use strict';

// load npm modules -->
const express = require('express');
const morgan = require('morgan');

// load private modules -->
const routes = require('./routes');
const sq = require('./models');

// variable to enable global error logging --?
const enableGlobalErrorLogging = process.env.ENABLE_GLOBAL_ERROR_LOGGING === 'true';

// create the Express app -->
const app = express();

// parse the json from the request body and put it in req.body -->
app.use(express.json());

// setup morgan which gives us http request logging --?
app.use(morgan('dev'));

// run sequelize when starting the app -->
(async () => {
  try {

    // test connection to db
    await sq.authenticate();
    console.log('Connection has been established successfully.');

    // sync sequelize models
    await sq.models.User.sync();
    await sq.models.Course.sync();

  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();

// set up routes on /api/ -->
app.use('/api', routes);

// setup the root route -->
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the REST API project!',
  });
});

// send 404 if no other route matched -->
app.use((req, res) => {
  res.status(404).json({
    message: 'Route Not Found',
  });
});

// setup a global error handler to catch all errors not already catched -->
app.use((err, req, res, next) => {
  if (enableGlobalErrorLogging) {
    console.error(`Global error handler: ${JSON.stringify(err.stack)}`);
  }

  res.status(err.status || 500).json({
    message: err.message,
    error: {},
  });
});

// set the port -->
app.set('port', process.env.PORT || 5000);

// make server listen on port -->
const server = app.listen(app.get('port'), () => {
  console.log(`Express server is listening on port ${server.address().port}`);
});
