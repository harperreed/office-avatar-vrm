const express = require('express');
const socketIO = require('socket.io');
const http = require('http');
const dotenv = require('dotenv');
const morgan = require('morgan');
const winston = require('winston');
const config = require('./config');
const AvatarStateMachine = require('./src/models/AvatarStateMachine');
const MQTTService = require('./src/services/MQTTService');
const AvatarController = require('./src/controllers/AvatarController');
const apiRoutes = require('./src/routes/api');
const logger = require('./src/utils/logger');

dotenv.config();

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

const server = http.createServer(app);
const io = socketIO(server);

const avatarStateMachine = new AvatarStateMachine();
const mqttService = new MQTTService();

mqttService.on('message', (topic, message) => {
  AvatarController.handleMQTTMessage(topic, message);
});

avatarStateMachine.on('stateChange', (data) => {
  io.emit('stateChange', data);
});

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.render('index');
});

server.listen(config.server.port, config.server.address, () => {
  logger.info(`Server running at http://${config.server.address}:${config.server.port}/`);
});

process.on('SIGINT', () => {
  logger.info('Gracefully shutting down');
  mqttService.disconnect();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
