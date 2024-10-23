const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const winston = require('winston');
const { NekoGirlStateMachine, Emotion, Animation } = require('./NekoGirlStateMachine');
const { setupMQTT } = require('./mqttClient');
const { setupSocketIO } = require('./socketClient');

dotenv.config();

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('static'));
app.use(express.json());

// Morgan writes logs to Winston
app.use(morgan('combined', {
  stream: {
    write: (message) => {
      logger.info(message.trim());
    }
  }
}));

const SERVER_ADDRESS = process.env.SERVER_ADDRESS || '127.0.0.1';
const SERVER_PORT = parseInt(process.env.SERVER_PORT || 8765);

const server = require('http').createServer(app);
const io = setupSocketIO(server, nekoStateMachine);

const nekoStateMachine = new NekoGirlStateMachine(30);
const DEBUG = process.env.DEBUG || false;

setupMQTT(nekoStateMachine);

// API Endpoints
app.post('/api/emotion', (req, res) => {
  const emotion = req.body.emotion;
  logger.info(`Setting emotion to ${emotion}`)
  const isValidEmotion = Object.values(Emotion).includes(emotion);
  if (isValidEmotion) {
    nekoStateMachine.setEmotion(emotion);
    res.sendStatus(200);
  } else {
    res.status(400).send("Invalid emotion");
  }
});

app.post('/api/animation', (req, res) => {
  const animation = req.body.animation;
  logger.info(`Setting animation to ${animation}`)
  const isValidAnimation = Object.values(Animation).includes(animation);
  console.log(isValidAnimation)
  if (isValidAnimation) {
    nekoStateMachine.setAnimation(animation);
    
    res.sendStatus(200);
  } else {
    res.status(400).send("Invalid animation");
  }
});

app.post('/api/audio', (req, res) => {
  const audioUrl = req.body.audioUrl;
  logger.info(`Setting audio to ${audioUrl}`)
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
  const username = "Harper"; // For example, get this from database or some logic
  res.render('index', { username });
});

server.listen(SERVER_PORT, SERVER_ADDRESS, () => {
  logger.info(`Server running at http://${SERVER_ADDRESS}:${SERVER_PORT}/`);
});
