const mqtt = require('mqtt');
const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const config = require('../../config');

class MQTTService extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.isConnected = false;
    this.reconnectInterval = 5000; // 5 seconds
    this.clientId = uuidv4();
  }

  connect() {
    const { broker, port, keepAliveInterval, topics } = config.mqtt;
    const options = {
      clientId: this.clientId,
      keepalive: keepAliveInterval,
    };

    this.client = mqtt.connect(`mqtt://${broker}:${port}`, options);

    this.client.on('connect', () => {
      this.isConnected = true;
      this.emit('connect');
      this.subscribeToTopics(topics);
    });

    this.client.on('error', (error) => {
      this.isConnected = false;
      this.emit('error', error);
      this.reconnect();
    });

    this.client.on('message', (topic, message) => {
      this.emit('message', topic, message.toString());
    });

    this.client.on('close', () => {
      this.isConnected = false;
      this.emit('close');
      this.reconnect();
    });
  }

  reconnect() {
    if (!this.isConnected) {
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    }
  }

  subscribeToTopics(topics) {
    Object.values(topics).forEach((topic) => {
      this.client.subscribe(topic, (err) => {
        if (err) {
          this.emit('error', err);
        } else {
          this.emit('subscribed', topic);
        }
      });
    });
  }

  publish(topic, message) {
    if (this.isConnected) {
      this.client.publish(topic, JSON.stringify(message), (err) => {
        if (err) {
          this.emit('error', err);
        } else {
          this.emit('published', topic, message);
        }
      });
    } else {
      this.emit('error', new Error('MQTT client is not connected'));
    }
  }

  disconnect() {
    if (this.client) {
      this.client.end();
    }
  }
}

module.exports = MQTTService;
