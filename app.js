const express = require('express');
const socketIO = require('socket.io');
const mqtt = require('mqtt');
const dotenv = require('dotenv');
const morgan = require('morgan');
const winston = require('winston');

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

const crypto = require('crypto');
const os = require('os');

const machineInfo = os.hostname() + os.type() + os.release();
const uniqueID = crypto.createHash('sha256').update(machineInfo).digest('hex');

const {
  NekoGirlStateMachine,
  Emotion,
  Animation,
} = require('./NekoGirlStateMachine');
dotenv.config();

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('static'));
app.use(express.json());

// Morgan writes logs to Winston
app.use(
  morgan('combined', {
    stream: {
      write: (message) => {
        logger.info(message.trim());
      },
    },
  }),
);

const SERVER_ADDRESS = process.env.SERVER_ADDRESS || '127.0.0.1';
const SERVER_PORT = parseInt(process.env.SERVER_PORT || 8765);

const server = require('http').createServer(app);
const io = socketIO(server);

const nekoStateMachine = new NekoGirlStateMachine(30);

const MQTT_BROKER = process.env.MQTT_BROKER;
const MQTT_PORT = parseInt(process.env.MQTT_PORT);
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'avatar/#';

// State Macgine

nekoStateMachine.on('emotion_change', (data) => {
  const emotion = data.emotion;
  logger.debug(`SM Event: Emotion set to ${emotion}`);
  io.emit('set_emotion', { emotion });
});

nekoStateMachine.on('animation_change', (data) => {
  const animation = data.animation;
  console.log(`SM Event: Animation set to ${data.animation}`);
  io.emit('set_animation', { animation });
});

nekoStateMachine.on('audio_change', (data) => {
  const audioUrl = data.audioUrl;
  logger.info(`SM Event: Audio URL set to ${audioUrl}`);
  io.emit('set_audio', { audioUrl });
});

// MQTT

const client = mqtt.connect(`mqtt://${MQTT_BROKER}:${MQTT_PORT}`, {
  clientId: uniqueID,
});
client.on('connect', () => {
  logger.info(`MQTT: Connected to ${MQTT_BROKER}:${MQTT_PORT}`);
  client.subscribe(MQTT_TOPIC, (err) => {
    if (err) {
      console.error('Subscription error:', err);
    } else {
      console.log(`Subscribed to topic: ${MQTT_TOPIC}`);
    }
  });
});

client.on('error', (error) => {
  logger.error(`MQTT Error: ${error}`);
});

client.on('message', (topic, message) => {
  logger.info(`MQTT: ${topic} ${message.toString()}`);

  let payload;

  try {
    payload = JSON.parse(message.toString());
  } catch (e) {
    logger.error('Invalid JSON in MQTT message');
    return;
  }

  switch (topic) {
  case 'avatar/emotion': {
    const emotion = payload.emotion;
    const isValidEmotion = Object.values(Emotion).includes(emotion);
    if (isValidEmotion) {
      nekoStateMachine.setEmotion(emotion);
    } else {
      logger.warn('Invalid emotion in MQTT message');
    }
    break;
  }
  case 'avatar/animation': {
    // Handle animation
    const animation = payload.animation;
    const isValidAnimation =
                Object.values(Animation).includes(animation);
    if (isValidAnimation) {
      nekoStateMachine.setAnimation(animation);
    } else {
      logger.warn('Invalid animation in MQTT message');
    }

    break;
  }
  case 'avatar/audio': {
    // Handle audio
    const audioUrl = payload.url;
    nekoStateMachine.setAudio(audioUrl);
    break;
  }
  default: {
    logger.warn('Unknown MQTT topic');
  }
  }
});

// API Endpoints
app.post('/api/emotion', (req, res) => {
  const emotion = req.body.emotion;
  logger.info(`Setting emotion to ${emotion}`);
  const isValidEmotion = Object.values(Emotion).includes(emotion);
  if (isValidEmotion) {
    nekoStateMachine.setEmotion(emotion);
    res.sendStatus(200);
  } else {
    res.status(400).send('Invalid emotion');
  }
});

app.post('/api/animation', (req, res) => {
  const animation = req.body.animation;
  logger.info(`Setting animation to ${animation}`);
  const isValidAnimation = Object.values(Animation).includes(animation);
  console.log(isValidAnimation);
  if (isValidAnimation) {
    nekoStateMachine.setAnimation(animation);

    res.sendStatus(200);
  } else {
    res.status(400).send('Invalid animation');
  }
});

app.post('/api/audio', (req, res) => {
  const audioUrl = req.body.audioUrl;
  logger.info(`Setting audio to ${audioUrl}`);
  nekoStateMachine.setAudio(audioUrl);
  io.emit('set_audio', { audioUrl });
  res.sendStatus(200);
});

app.post('/api/reload', (req, res) => {
  // Your reload logic
  io.emit('reload_page', {});
  res.sendStatus(200);
});

app.get('/', (req, res) => {
  const username = 'Harper'; // For example, get this from database or some logic
  res.render('index', { username });
});

server.listen(SERVER_PORT, SERVER_ADDRESS, () => {
  logger.info(`Server running at http://${SERVER_ADDRESS}:${SERVER_PORT}/`);
});
