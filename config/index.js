const Joi = require('joi');
const dotenv = require('dotenv');

dotenv.config();

const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  SERVER_ADDRESS: Joi.string().default('127.0.0.1'),
  SERVER_PORT: Joi.number().default(8765),
  MQTT_BROKER: Joi.string().required(),
  MQTT_PORT: Joi.number().default(1883),
  MQTT_KEEP_ALIVE_INTERVAL: Joi.number().default(60),
  ANIMATION_TOPIC: Joi.string().default('avatar/animation'),
  AUDIO_TOPIC: Joi.string().default('avatar/audio'),
  EMOTION_TOPIC: Joi.string().default('avatar/emotion'),
  DEBUG: Joi.boolean().default(false),
}).unknown()
  .required();

const { error, value: envVars } = envVarsSchema.validate(process.env);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  env: envVars.NODE_ENV,
  server: {
    address: envVars.SERVER_ADDRESS,
    port: envVars.SERVER_PORT,
  },
  mqtt: {
    broker: envVars.MQTT_BROKER,
    port: envVars.MQTT_PORT,
    keepAliveInterval: envVars.MQTT_KEEP_ALIVE_INTERVAL,
    topics: {
      animation: envVars.ANIMATION_TOPIC,
      audio: envVars.AUDIO_TOPIC,
      emotion: envVars.EMOTION_TOPIC,
    },
  },
  debug: envVars.DEBUG,
};

module.exports = config;
