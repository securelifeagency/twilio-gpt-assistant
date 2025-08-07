require('dotenv').config();
const express = require('express');
const { OpenAI } = require('openai');
const twilio = require('twilio');
const VoiceResponse = twilio.twiml.VoiceResponse;

const app = express();
app.use(express.urlencoded({ extended: true }));

const openai = new OpenAI({ apiKey: process.env.OpenAI_Key });

const SQUARE_LINK = process.env.Square_appointment_link;
const LIVE_AGENT_PHONE = process.env.LIVE_AGENT_PHONE || '+1YOURAGENTNUMBER'; // <- Replace or set in Render

// First answer: choose language
app.post('/voice', (req, res) => {
  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    input: 'speech dtmf',
    hints: 'English, Spanish, Inglés, Español',
    numDigits: 1,
    action: '/language',
    method: 'POST',
    timeout: 5
  });

  gather.say('Welcome to Secure Life Insurance Agency. Press 1 for English, or 2 for Spanish.', { language: 'en-US' });
  gather.say('Bienvenido a Secure Life Insurance Agency. Presione 2 para español, o 1 para inglés.', { language: 'es-ES' });

  res.type('text/xml');
  res.send(twiml.toString());
});

// Handle language selection
app.post('/language', (req, res) => {
  const choice = req.body.Digits || '';
  const language = choice === '2' ? 'es' : 'en';
  const twiml = new VoiceResponse();

  const gather = twiml.gather({
    input: 'speech',
    action: `/gpt?lang=${language}`,
    speechTimeout: 'auto'
  });

  if (language === 'es') {
    gather.say('Gracias. ¿En qué puedo ayudarle hoy?', { language: 'es-ES' });
  } else {
    gather.say('Thank you. How can I help you today?', { language: 'en-US' });
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

// Send speech to GPT
app.post('/gpt', async (req, res) => {
  const userInput = req.body.SpeechResult;
  const language = req.query.lang || 'en';

  const prompt = language === 'es'
    ? `Eres un asistente de seguros en español. Un cliente dijo: "${userInput}". Responde profesionalmente, y ofrece agendar una cita si aplica: ${SQUARE_LINK}`
    : `You are an insurance assistant. A customer said: "${userInput}". Respond professionally and offer to schedule an appointment if it applies: ${SQUARE_LINK}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
  });

  const aiResponse = completion.choices[0].message.content;

  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    input: 'speech',
    action: `/gpt?lang=${language}`,
    speechTimeout: 'auto'
  });

  gather.say(aiResponse, {
    language: language === 'es' ? 'es-ES' : 'en-US'
  });

  res.type('text/xml');
  res.send(twiml.toString());
});

// Default route
app.get('/', (req, res) => {
  res.send('✅ Secure Life AI Assistant is running.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AI server is live on port ${PORT}`);
});
