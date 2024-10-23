const mqtt = require('mqtt');
const { Emotion, Animation } = require('./NekoGirlStateMachine');
const winston = require('winston');
const crypto = require('crypto');
const os = require('os');

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

const machineInfo = os.hostname() + os.type() + os.release();
const uniqueID = crypto.createHash('sha256').update(machineInfo).digest('hex');

const MQTT_BROKER = process.env.MQTT_BROKER;
const MQTT_PORT = parseInt(process.env.MQTT_PORT);
const MQTT_TOPIC = process.env.MQTT_TOPIC || "avatar/#";

const client = mqtt.connect(`mqtt://${MQTT_BROKER}:${MQTT_PORT}`, { clientId: uniqueID });

function setupMQTT(nekoStateMachine) {
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
      logger.error("Invalid JSON in MQTT message");
      return;
    }

    switch (topic) {
      case 'avatar/emotion':
        const emotion = payload.emotion;
        const isValidEmotion = Object.values(Emotion).includes(emotion);
        if (isValidEmotion) {
          nekoStateMachine.setEmotion(emotion);
        } else {
          logger.warn("Invalid emotion in MQTT message");
        }
        break;

      case 'avatar/animation':
        const animation = payload.animation;
        const isValidAnimation = Object.values(Animation).includes(animation);
        if (isValidAnimation) {
          nekoStateMachine.setAnimation(animation);
        } else {
          logger.warn("Invalid animation in MQTT message");
        }
        break;

      case 'avatar/audio':
        const audioUrl = payload.url;
        nekoStateMachine.setAudio(audioUrl);
        break;

      default:
        logger.warn("Unknown MQTT topic");
    }
  });
}

module.exports = { setupMQTT };
