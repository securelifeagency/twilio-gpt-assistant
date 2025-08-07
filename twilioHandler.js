require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { handleCall } = require('./twilioHandler');
const { scheduleAppointment } = require('./squareScheduler');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/voice', handleCall);
app.post('/schedule', scheduleAppointment);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AI assistant running on port ${PORT}`));
