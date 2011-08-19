
/**
 * Module dependencies.
 */

var express = require('express')
    , form = require('connect-form');
var app = module.exports = express.createServer(form({keepExtensions:true}));
var mongoose = require('mongoose')
   , Schema = mongoose.Schema
   , GridStore = require('mongodb').GridStore;
var io = require('socket.io').listen(app)
var fs = require('fs');
var spawn = require('child_process').spawn;

// Mongoose
var UserSchema = new Schema({
  firstName: String,
  lastName: String,
  profileImage: String
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

// Routes

app.get('/', function(req, res){
  var User = mongoose.model('User');
  User.find({}, ['firstName', 'lastName', 'profileImage'], function(err, users){
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
   req.form.complete(function(err, fields, files){
    if (err) {
      next(err);
    } else {
      var imageName = files.profileImage.name.toLowerCase()
       fs.readFile(files.profileImage.path, function(err, image_buffer){
         new GridStore(mongoose.connection.db, imageName, 'w',
           {'content-type':files.profileImage.contentType}
           ).open(function(err, gs) {
            gs.write(image_buffer, function(err, gs) {
              gs.close(function(err) {
                var User = mongoose.model('User')
                  user = new User();
                user.profileImage = imageName;
                user.firstName = fields.firstName
                user.lastName = fields.lastName
                user.save();
              });
            });
          });
       }); 
        
      res.redirect('/');
    }
  });

  // We can add listeners for several form
  // events such as "progress"
  req.form.on('progress', function(bytesReceived, bytesExpected){
    var percent = (bytesReceived / bytesExpected * 100) | 0;
    process.stdout.write('Uploading: %' + percent + '\r');
  });

});

// serve up the image
app.get('/profileImages/:image', function(req, res) {
  new GridStore(mongoose.connection.db, req.param('image'), 'r').open(function(err, gs) {
    gs.read(function(err, buffer){
      res.send(new Buffer(buffer, 'binary'), {'Content-Type':gs.contentType});
      gs.close(function(err){
      });
    });
  });
});

// lets constantly update the client side
io.sockets.on('connection', function (socket) {
  setInterval(function(){
    socket.emit('current-time', {time:new Date()});
  }, 5000);
})

app.get('/source.zip', function(req, res){
  var zip = spawn('zip', ['-r', '-', process.cwd()]);

  res.contentType('zip');

  // Keep writing stdout to res
  zip.stdout.on('data', function (data) {
      res.write(data);
  });

  zip.stderr.on('data', function (data) {
      // Uncomment to see the files being added
      //console.log('zip stderr: ' + data);
  });

  // End the response on zip exit
  zip.on('exit', function (code) {
      if(code !== 0) {
          res.statusCode = 500;
          console.log('zip process exited with code ' + code);
          res.end();
      } else {
          res.end();
      }
  });

});
app.listen(3000);
console.log("Express server listening on port %d", app.address().port);
