const AvatarStateMachine = require('../models/AvatarStateMachine');
const MQTTService = require('../services/MQTTService');
const logger = require('../utils/logger');

class AvatarController {
  constructor() {
    this.stateMachine = new AvatarStateMachine();
    this.mqttService = new MQTTService();

    this.mqttService.on('message', this.handleMQTTMessage.bind(this));
  }

  handleMQTTMessage(topic, message) {
    try {
      const payload = JSON.parse(message);
      switch (topic) {
        case 'avatar/emotion':
          this.stateMachine.transitionTo(payload.emotion);
          break;
        case 'avatar/animation':
          this.stateMachine.transitionTo(payload.animation);
          break;
        case 'avatar/audio':
          this.stateMachine.transitionTo(payload.audio);
          break;
        default:
          logger.warn(`Unknown MQTT topic: ${topic}`);
      }
    } catch (error) {
      logger.error(`Failed to process MQTT message: ${error.message}`);
    }
  }

  setEmotion(req, res) {
    const { emotion } = req.body;
    try {
      this.stateMachine.transitionTo(emotion);
      res.sendStatus(200);
    } catch (error) {
      res.status(400).send(error.message);
    }
  }

  setAnimation(req, res) {
    const { animation } = req.body;
    try {
      this.stateMachine.transitionTo(animation);
      res.sendStatus(200);
    } catch (error) {
      res.status(400).send(error.message);
    }
  }

  setAudio(req, res) {
    const { audioUrl } = req.body;
    try {
      this.stateMachine.transitionTo(audioUrl);
      res.sendStatus(200);
    } catch (error) {
      res.status(400).send(error.message);
    }
  }
}

module.exports = new AvatarController();
