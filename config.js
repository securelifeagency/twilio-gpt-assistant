// Load .env variables
require('dotenv').config();

// Export all config variables used throughout the app
module.exports = {
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o',
    ttsModel: 'tts-1-hd',
    englishVoice: 'nova',
    spanishVoice: 'shimmer',
  },
  square: {
    bookingLink: process.env.SQUARE_LINK,
  },
  app: {
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    languageOptions: {
      english: '1',
      spanish: '2',
    },
  },
};
