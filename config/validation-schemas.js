const Joi = require('joi');

const serverSchema = Joi.object({
  SERVER_ADDRESS: Joi.string().default('127.0.0.1'),
  SERVER_PORT: Joi.number().default(8765),
});

const mqttSchema = Joi.object({
  MQTT_BROKER: Joi.string().required(),
  MQTT_PORT: Joi.number().default(1883),
  MQTT_KEEP_ALIVE_INTERVAL: Joi.number().default(60),
  ANIMATION_TOPIC: Joi.string().default('avatar/animation'),
  AUDIO_TOPIC: Joi.string().default('avatar/audio'),
  EMOTION_TOPIC: Joi.string().default('avatar/emotion'),
});

const vrmModelSchema = Joi.object({
  VRM_MODEL_PATH: Joi.string().required(),
});

const loggingSchema = Joi.object({
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
});

const configSchema = Joi.object({
  server: serverSchema,
  mqtt: mqttSchema,
  vrmModel: vrmModelSchema,
  logging: loggingSchema,
});

module.exports = {
  serverSchema,
  mqttSchema,
  vrmModelSchema,
  loggingSchema,
  configSchema,
};
