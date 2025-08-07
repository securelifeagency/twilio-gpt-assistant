// server.js

const express = require('express');
const { VoiceResponse } = require('twilio').twiml;
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OpenAI_Key,
});

const SQUARE_LINK = process.env.Square_appointment_link || 'https://secure-life-insurance-agency-llc.square.site';

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Entry point for Twilio call
app.post('/voice', (req, res) => {
  const twiml = new VoiceResponse();

  const gather = twiml.gather({
    input: 'speech',
    action: '/handle-language',
    speechTimeout: 'auto',
  });

  gather.say(
    'Welcome to Secure Life Insurance Agency. For English, say English. Para español, diga español.'
  );

  res.type('text/xml');
  res.send(twiml.toString());
});

// Route to detect language
app.post('/handle-language', (req, res) => {
  const result = (req.body.SpeechResult || '').toLowerCase();
  const language = result.includes('español') ? 'es' : 'en';

  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    input: 'speech',
    action: `/gpt?lang=${language}`,
    speechTimeout: 'auto',
  });

  if (language === 'es') {
    gather.say(
      'Gracias por llamar a Secure Life. ¿Cómo puedo ayudarle hoy?',
      { language: 'es-ES' }
    );
  } else {
    gather.say('Thank you for calling Secure Life. How can I assist you today?');
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

// Main GPT logic
app.post('/gpt', async (req, res) => {
  const userInput = req.body.SpeechResult || 'No input detected';
  const language = req.query.lang === 'es' ? 'es' : 'en';

  const prompt =
    language === 'es'
      ? `Eres un asistente de seguros profesional. El cliente dijo: "${userInput}". Responde de forma clara, profesional, y si aplica, ofrece agendar una cita en ${SQUARE_LINK}`
      : `You are a professional insurance assistant. The client said: "${userInput}". Respond clearly and professionally, and if applicable, offer to schedule an appointment at ${SQUARE_LINK}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
    });

    const aiText = completion.choices[0].message.content;

    const twiml = new VoiceResponse();
    const gather = twiml.gather({
      input: 'speech',
      action: `/gpt?lang=${language}`,
      speechTimeout: 'auto',
    });

    gather.say(aiText, {
      language: language === 'es' ? 'es-ES' : 'en-US',
    });

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (err) {
    console.error('OpenAI Error:', err);

    const twiml = new VoiceResponse();
    twiml.say(
      language === 'es'
        ? 'Lo siento, hubo un error. Inténtelo más tarde.'
        : 'Sorry, something went wrong. Please try again later.'
    );

    res.type('text/xml');
    res.send(twiml.toString());
  }
});

app.listen(PORT, () => {
  console.log(`AI server is live on port ${PORT}`);
});
