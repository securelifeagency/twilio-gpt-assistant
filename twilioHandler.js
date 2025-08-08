const { OpenAI } = require('openai');
const twilio = require('twilio');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const squareLink = 'https://secure-life-insurance-agency-llc.square.site'; // <-- your scheduling link

module.exports.handler = async function (context, event, callback) {
  const twiml = new twilio.twiml.VoiceResponse();

  const userInput = event.SpeechResult?.trim() || '';
  const language = event.language || 'english'; // Default to English
  const userPhone = event.From;

  let systemPrompt = `
You are a bilingual AI receptionist for Secure Life Insurance Agency LLC. 
Your voice must sound natural, clear, and human-like. Speak like a polite professional assistant.

Step 1: Greet the caller and ask if they prefer to speak in English or Spanish.
Step 2: Ask their name and reason for calling.
Step 3: Offer to send them a scheduling link via SMS.
Step 4: Thank them and ask if they need anything else.

Speak naturally, short and friendly. Example:
“Hi, thank you for calling Secure Life Insurance Agency. Do you prefer to speak English or Español?”
`;

  try {
  const chatResponse = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userInput || 'Incoming call from customer. Start conversation.' },
    ],
  });

  const aiReply = chatResponse.choices[0].message.content;

  // Select voice model based on language
  const voice = language === 'es' ? 'shimmer' : 'nova'; // shimmer = female, nova = male

  const audioResponse = await openai.audio.speech.create({
    model: 'tts-1-hd',
    voice,
    input: aiReply,
  });

  const buffer = Buffer.from(await audioResponse.arrayBuffer());
  const fileName = `/tmp/voice-${Date.now()}.mp3`;
  const fs = require('fs');
  fs.writeFileSync(fileName, buffer);

  twiml.play({}, fileName);

  // Optional: send scheduling link via SMS
  const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  await client.messages.create({
    body: `Thank you for calling Secure Life Insurance Agency. You can schedule an appointment here: ${squareLink}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: userPhone,
  });

} catch (err) {
  console.error('Error in AI voice assistant:', err);
  twiml.say({ voice: 'alice', language: 'en-US' }, "Sorry, I'm having trouble right now. Please try again later.");
}
