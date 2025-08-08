const express = require('express');
const { twiml: { VoiceResponse } } = require('twilio');
const { OpenAI } = require('openai');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { TWILIO_PHONE, SQUARE_LINK, OPENAI_API_KEY } = require('./config');

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const router = express.Router();

let userLanguage = 'en';
let userName = '';
let conversationHistory = [];

router.post('/voice', async (req, res) => {
  const twiml = new VoiceResponse();

  const gather = twiml.gather({
    input: 'dtmf',
    numDigits: 1,
    action: '/language',
    method: 'POST',
  });

  gather.say('Welcome to Secure Life Insurance Agency. Press 1 for English. Presione 2 para español.', { language: 'en-US' });

  res.type('text/xml');
  res.send(twiml.toString());
});

router.post('/language', (req, res) => {
  const digit = req.body.Digits;
  userLanguage = digit === '2' ? 'es' : 'en';

  const twiml = new VoiceResponse();
  twiml.redirect('/handle-question');
  res.type('text/xml');
  res.send(twiml.toString());
});

router.post('/handle-question', async (req, res) => {
  const twiml = new VoiceResponse();
  const question = req.body.SpeechResult || '';

  if (!userName) {
    const askName = userLanguage === 'es'
      ? '¿Cuál es su nombre completo, por favor?'
      : 'What is your full name, please?';
    addSay(twiml, askName);
    twiml.redirect('/capture-name');
    res.type('text/xml');
    return res.send(twiml.toString());
  }

  conversationHistory.push({ role: 'user', content: question });

  const prompt = `You are a professional insurance agency assistant. You help clients with questions about auto, home, life, commercial, and Medicare insurance. Be professional, warm, and helpful.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: prompt },
      ...conversationHistory
    ],
  });

  const reply = completion.choices[0].message.content;
  conversationHistory.push({ role: 'assistant', content: reply });

  const audioPath = path.join(__dirname, 'output.mp3');
  const speech = await openai.audio.speech.create({
    model: 'tts-1-hd',
    voice: userLanguage === 'es' ? 'shimmer' : 'nova',
    input: reply,
  });

  const buffer = Buffer.from(await speech.arrayBuffer());
  fs.writeFileSync(audioPath, buffer);

  twiml.play({}, `/audio/output.mp3`);

  // Optionally send schedule link by SMS
  if (reply.includes('schedule') || reply.includes('appointment')) {
    await axios.post('https://api.twilio.com/2010-04-01/Accounts/YOUR_SID/Messages.json', {
      To: req.body.From,
      From: TWILIO_PHONE,
      Body: `Hi ${userName}, here's your appointment link: ${SQUARE_LINK}`,
    }, {
      auth: {
        username: process.env.TWILIO_ACCOUNT_SID,
        password: process.env.TWILIO_AUTH_TOKEN,
      }
    });
  }

  twiml.redirect('/handle-question');
  res.type('text/xml');
  res.send(twiml.toString());
});

router.post('/capture-name', async (req, res) => {
  const twiml = new VoiceResponse();
  const speech = req.body.SpeechResult;

  userName = speech;
  const greeting = userLanguage === 'es'
    ? `Gracias, ${userName}. ¿En qué puedo ayudarle hoy con su seguro?`
    : `Thank you, ${userName}. How can I assist you with insurance today?`;

  addSay(twiml, greeting);
  twiml.redirect('/handle-question');
  res.type('text/xml');
  res.send(twiml.toString());
});

function addSay(twiml, text) {
  twiml.say({ voice: 'Polly.Matthew', language: userLanguage === 'es' ? 'es-MX' : 'en-US' }, text);
}

module.exports = router;
