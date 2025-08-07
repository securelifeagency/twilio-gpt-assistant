exports.scheduleAppointment = (req, res) => {
  const twiml = new (require('twilio').twiml.VoiceResponse)();
  const squareUrl = process.env.SQUARE_BOOKING_URL || 'https://secure-life-insurance-agency-llc.square.site';
  twiml.say('I will send you a text message with a link to schedule your appointment.');
  twiml.message(`You can book your appointment here: ${squareUrl}`);
  res.type('text/xml');
  res.send(twiml.toString());
};
