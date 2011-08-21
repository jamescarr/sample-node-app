$(function(){
  var socket = io.connect();
  socket.on('current-time', function(data){
    $('#current-time').text(data.time)
  });
});

