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
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput || "Incoming call from customer. Start conversation." }
      ],
    });

    const aiReply = response.choices[0].message.content;

    // Send SMS with appointment link (optional, based on interaction logic)
    if (/appointment|schedule|cita/i.test(userInput)) {
      const client = context.getTwilioClient();
      await client.messages.create({
        body: `Here’s the link to book your appointment: ${squareLink}`,
        to: userPhone,
        from: context.TWILIO_PHONE_NUMBER,
      });
    }

    twiml.say({ voice: 'Polly.Matthew-Neural', language: 'en-US' }, aiReply);
    callback(null, twiml);
  } catch (error) {
    console.error('OpenAI error:', error);
    twiml.say("I'm sorry, there was an error. Please call back later.");
    callback(null, twiml);
  }
};
