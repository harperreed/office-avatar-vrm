const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  SERVER_ADDRESS: process.env.SERVER_ADDRESS || '127.0.0.1',
  SERVER_PORT: parseInt(process.env.SERVER_PORT || 8765),
  MQTT_BROKER: process.env.MQTT_BROKER,
  MQTT_PORT: parseInt(process.env.MQTT_PORT),
  MQTT_KEEP_ALIVE_INTERVAL: parseInt(process.env.MQTT_KEEP_ALIVE_INTERVAL || 60),
  ANIMATION_TOPIC: process.env.ANIMATION_TOPIC || 'avatar/animation',
  AUDIO_TOPIC: process.env.AUDIO_TOPIC || 'avatar/audio',
  EMOTION_TOPIC: process.env.EMOTION_TOPIC || 'avatar/emotion',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  OPENAI_TEMPERATURE: parseFloat(process.env.OPENAI_TEMPERATURE || 0.9),
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || '',
};
