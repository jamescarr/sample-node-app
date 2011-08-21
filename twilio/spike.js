var TwilioClient = require('twilio').Client,
      Twiml = require('twilio').Twiml;

var config = {
   account_sid: 'AC97f3ce6e4134aef9b1927c4f72dc71f0'
 , auth_token: '64da6fe27322bf04b64fdaa9b645b4b3'
 , hostname: 'surety.me'
};
var client = new TwilioClient(config.account_sid, config.auth_token, config.hostname);

var phone = client.getPhoneNumber('+1(415)599-2671');
phone.setup(function() { 
  phone.makeCall('+15733554248', null, function(call) {
    call.on('answered', function(callParams, response) {
      response.append(new Twiml.Say("Hey buddy. Let's meet for drinks later tonight."));
      response.send();
    });
  });
});
