
/**
 * Module dependencies.
 */

var express = require('express');
var app = module.exports = express.createServer();
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var io = require('socket.io').listen(app)

// Mongoose
var UserSchema = new Schema({
  firstName: String,
  lastName: String
});
var User = mongoose.model('User', UserSchema);
mongoose.connect('mongodb://localhost/sample-app')

// lets delete all the users
User.find({}, function(err, users) {
  users.forEach(function(user){
    user.remove();
  });
});
// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
  var User = mongoose.model('User');
  User.find({}, ['firstName', 'lastName'], function(err, users){
    res.render('index', {
      title: 'Express',
      users: users
    });
  });
});
app.get('/users/new', function(req, res){
  res.render('new-user',{title:'Add a User'});
});
app.post('/users/new', function(req, res){
  var User = mongoose.model('User'),
    user = new User(req.param('user'));
  user.save();
  res.redirect('/');
});

// lets constantly update the client side
io.sockets.on('connection', function (socket) {
  setInterval(function(){
    socket.emit('current-time', {time:new Date()});
  }, 50);
})
app.listen(3000);
console.log("Express server listening on port %d", app.address().port);
