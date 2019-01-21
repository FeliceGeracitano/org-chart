const express = require('express');
const app = express();
const compression = require('compression');
const auth = require('basic-auth');
require('dotenv').config();
const admins = { [process.env.USERNAME]: { password: process.env.PASSWORD } };
const PORT = process.env.PORT || 5000;

app.use(function(request, response, next) {
  var user = auth(request);
  if (!user || !admins[user.name] || admins[user.name].password !== user.pass) {
    response.set('WWW-Authenticate', 'Basic realm="example"');
    return response.status(401).send();
  }
  return next();
});

app.use(express.static(__dirname + '/dist'));
app.use(compression());
app.set('port', PORT);

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
