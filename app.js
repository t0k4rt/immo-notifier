var express = require('express')
  , path = require('path')
  , url = require('url')
  , logger = require('morgan')
  , cookieParser = require('cookie-parser')
  , bodyParser = require('body-parser')
  , redis = require('redis')
  , debug = require('debug')('my-application');

var SelogerParser = require('./routes/selogerParser');

var app = express();
app.set('redis_url', process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379');
app.set('domain', process.env.APP_DOMAIN || 'localhost:3000');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
console.log(app.get('redis_url'));


/**
 * socket io + Redisstore setup
 */
var redisUrl = url.parse(app.get('redis_url'));
var redisStore = redis.createClient(redisUrl.port, redisUrl.hostname);

if(redisUrl.auth) {
  var auth = (redisUrl.auth.split(':'))[1];
  redisStore.auth(auth, function(){console.log("redisStore ready")});
}


/**
 * middleware
 */
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, '/public')));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * routes
 */
app.use('/', new SelogerParser(app, mongoose, redisStore));

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
