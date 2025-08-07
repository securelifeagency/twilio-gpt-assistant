require('dotenv').config();

module.exports = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  squareBookingUrl: process.env.SQUARE_BOOKING_URL
};
