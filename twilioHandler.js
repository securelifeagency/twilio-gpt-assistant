const { VoiceResponse } = require('twilio').twiml;

exports.handleCall = (req, res) => {
  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    numDigits: 1,
    action: '/language',
    method: 'POST'
  });
  gather.say('Welcome to Secure Life Insurance Agency. For English, press 1. Para español, presione 2.');
  res.type('text/xml');
  res.send(twiml.toString());
};
