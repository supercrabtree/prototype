var express = require('express');
var net = require('net');
var browserSync = require('browser-sync').create();
var stylus = require('stylus');
var Promise = require('bluebird');
var app = express();
var server;
var fs = require('fs');
var colors = require('colors');
var babel = require('babel-core');
var eslint = require('eslint').linter;


/* Routes
-----------------------------------------------------------------------------*/
app.get('/', (req, res) => {
  res.render('index', (err, html) => {
    if (err) {
      jadeError(err);
      return res.status(500).send();
    }
    res.send(html);
  });
});


/* App Config
-----------------------------------------------------------------------------*/
app.set('view engine', 'jade');
app.set('views', './client');
app.use(renderStylus);
app.use(compileJS);
app.use(express.static(__dirname + '/client'));


/* App Run
-----------------------------------------------------------------------------*/
findFreePorts()
.spread((port1, port2, port3) => {
  server = app.listen(port1);
  browserSync.init({
    open: false,
    port: port2,
    proxy: 'localhost:' + port1,
    ui: {
      port: port3
    },
    files: './client/**/*',
    // tunnel: true,
    notify: false,
    reloadOnRestart: true
  });
});


/* Helper Functions
------------------------------------------------------------------------------*/
function findFreePorts() {
  var startPoint = 4000;
  var ports = [];
  return getPort(startPoint).then((port) => {
    ports.push(port);
    return getPort(port++);
  }).then((port) => {
    ports.push(port);
    return getPort(port++);
  }).then((port) => {
    ports.push(port);
    return ports;
  });
}

function getPort(port) {
  return new Promise(function (resolve, reject) {
    var server = net.createServer();
    server.on('error', (err) => getPort(++port));
    server.listen(port, function () {
      server.once('close', () => resolve(port));
      server.close();
    });
  });
}


/* Babel JS
------------------------------------------------------------------------------*/
function compileJS(req, res, next) {
  var match = req.url.match(/.*\.js$/);
  if (match) {
    var filename = './client' + match[0];
    fs.readFile(filename, 'utf8', function (err, jsFile) {
      if (err) return res.status(404).send();
      var results = eslint.verify(jsFile, eslintRules);
      var wasFatal;
      for (var result of results) {
        if (result.fatal) {
          logESlintError(result, filename, jsFile);
          wasFatal = true;
          return res.status(500).send();
        }
      }
      babel.transformFile(filename, function (err, es5) {
        if (err) console.log(err);
        res.send(es5.code);
      });
    });
  } else {
    next();
  }
}

function logESlintError(error, filename, file) {
  console.log(error);
  console.log('\n', filename.cyan + ':' + error.line.toString().red);
  // TODO: Echo out the part of the file in the same way as jade and Stylus
  // console.log(file);
  console.log();
  console.log(error.message.red);
  console.log();
}

var eslintRules = {
  parser: 'babel-eslint'
};


/* Stylus
------------------------------------------------------------------------------*/
function renderStylus(req, res, next) {
  var match = req.url.match(/(.*\.)css$/);
  if (match) {
    var filename = './client' + match[1] + 'styl';
    fs.readFile(filename, 'utf8', (err, stylusFile) => {
      if (err) return res.status(404).send();
      stylus.render(stylusFile, {filename}, (err, css) => {
        if (err) {
          logStylusError(err);
          return res.status(500).send(err);
        }
        res.header('Content-type', 'text/css');
        res.send(css);
      });
    });
  } else {
    next();
  }
}

function logStylusError(err) {
  var splitErr = err.message.match(/(.*?)([0-9]*)(?:\n)((?:.+\n)+)(?:\n)((?:.+\n)+)/);
  var file = splitErr[1];
  var line = splitErr[2];
  var location = splitErr[3];
  var theErr = splitErr[4];

  console.log('\n', file.cyan + line.red);
  console.log(location);
  console.log(theErr.red);
}


/* Jade
------------------------------------------------------------------------------*/
function jadeError(error) {
  var splitErr = error.message.match(/(.*?)([0-9]*)(?:\n)((?:.+\n)+)(?:\n)(.*$)/);
  if(!splitErr) return console.log(error);

  var file = splitErr[1];
  var line = splitErr[2];
  var location = splitErr[3];
  var theErr = splitErr[4];

  console.log('\n', file.cyan + line.red);
  console.log(location);
  console.log(theErr.red);
  console.log();
}
