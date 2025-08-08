const OpenAI = require("openai");
const twilio = require("twilio");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const squareLink = 'https://secure-life-insurance-agency-llc.square.site';

module.exports.handler = async function (context, event, callback) {
  const twiml = new twilio.twiml.VoiceResponse();
  const userInput = event.SpeechResult?.trim() || '';
  const phone = event.From || '';

  // Ask for language if not selected
  if (!event.languageSelected) {
    const gather = twiml.gather({
      input: 'dtmf',
      numDigits: 1,
      action: '/voice?languageSelected=true',
      method: 'POST'
    });
    gather.say("Welcome to Secure Life Insurance Agency. Press 1 for English. Presione 2 para español.");
    return callback(null, twiml);
  }

  // Language based on key press
  const lang = event.Digits === '2' ? 'spanish' : 'english';
  const voice = lang === 'spanish' ? 'shimmer' : 'nova';

  const systemPrompt = `
You are Ava, a bilingual AI receptionist for Secure Life Insurance Agency.
Speak in ${lang}, naturally, like a real human assistant.
Your job is to:
- Greet the caller
- Ask for their name
- Help with quotes (auto, home, health, commercial)
- Schedule appointments using this link: ${squareLink}
- Offer to send the link via SMS if needed
- Sound professional, friendly, and human-like using OpenAI's tts-1-hd voice
- If speaking Spanish, keep it clear and neutral
`;

  try {
    // Get AI-generated reply
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput || 'Start the call conversation naturally.' }
      ]
    });

    const replyText = completion.choices[0].message.content;

    // Convert text to speech
    const tts = await openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: voice,
      input: replyText
    });

    const buffer = Buffer.from(await tts.arrayBuffer());
    const audioBase64 = buffer.toString('base64');

    // Play AI reply
    const gather = twiml.gather({
      input: 'speech',
      speechTimeout: 'auto',
      action: '/voice?languageSelected=true',
      method: 'POST'
    });

    gather.play({ loop: 1 }, `data:audio/mpeg;base64,${audioBase64}`);

    // Send Square link via SMS
    if (phone) {
      const client = twilio(context.ACCOUNT_SID, context.AUTH_TOKEN);
      await client.messages.create({
        body: `Secure Life: Book your appointment here 👉 ${squareLink}`,
        from: context.TWILIO_PHONE_NUMBER,
        to: phone
      });
    }

    return callback(null, twiml);
  } catch (err) {
    console.error("AI Error:", err.message);
    twiml.say("I'm sorry. Something went wrong. Please try again later.");
    return callback(null, twiml);
  }
};
