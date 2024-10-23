const request = require('supertest');
const express = require('express');
const {
  NekoGirlStateMachine,
  Emotion,
  Animation,
} = require('../../NekoGirlStateMachine');
const { EventEmitter } = require('events');
const mqtt = require('mqtt');
const http = require('http');

// Mock the NekoGirlStateMachine
jest.mock('../../NekoGirlStateMachine', () => {
  return {
    NekoGirlStateMachine: jest.fn(() => ({
      setEmotion: jest.fn(),
      setAnimation: jest.fn(),
      setAudio: jest.fn(),
      on: jest.fn(),
      emit: jest.fn(),
    })),
    Emotion: {
      NEUTRAL: 'neutral',
      HAPPY: 'happy',
      SAD: 'sad',
      ANGRY: 'angry',
      SURPRISED: 'surprised',
    },
    Animation: {
      NONE: 'none',
      DANCING: 'silly_dancing',
      ANGRY: 'angry',
      NEUTRAL: 'neutral',
      LOOK_LEFT: 'look_left',
      LOOK_RIGHT: 'look_right',
    },
  };
});

// Create a mock MQTT client that extends EventEmitter
class MockMqttClient extends EventEmitter {
  constructor() {
    super();
    this.subscribe = jest.fn();
    this.end = jest.fn();
  }
}

// Mock mqtt module
jest.mock('mqtt', () => ({
  connect: jest.fn(() => new MockMqttClient()),
}));

jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
  format: { json: jest.fn() },
  transports: { Console: jest.fn() },
}));

describe('Integration Tests for MQTT in app.js', () => {
  let app;
  let server;
  let mqttClient;
  let nekoStateMachine;

  beforeAll(() => {
    EventEmitter.defaultMaxListeners = 20;
  });

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Create a new instance of NekoGirlStateMachine
    nekoStateMachine = new NekoGirlStateMachine(30);

    // Set up server
    server = http.createServer(app);

    // Create MQTT client
    mqttClient = mqtt.connect('mqtt://localhost:1883');

    // Set up MQTT message handling
    mqttClient.on('message', (topic, message) => {
      const payload = JSON.parse(message.toString());

      switch (topic) {
      case 'avatar/emotion':
        const emotion = payload.emotion;
        const isValidEmotion =
                        Object.values(Emotion).includes(emotion);
        if (isValidEmotion) {
          nekoStateMachine.setEmotion(emotion);
        }
        break;

      case 'avatar/animation':
        const animation = payload.animation;
        const isValidAnimation =
                        Object.values(Animation).includes(animation);
        if (isValidAnimation) {
          nekoStateMachine.setAnimation(animation);
        }
        break;

      case 'avatar/audio':
        const audioUrl = payload.url;
        nekoStateMachine.setAudio(audioUrl);
        break;
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    server.close();
    mqttClient.end();
  });

  afterAll(() => {
    EventEmitter.defaultMaxListeners = 10;
  });

  describe('MQTT Functionality', () => {
    it('should handle MQTT messages for emotion', () => {
      // Trigger a message event directly on the MQTT client
      mqttClient.emit(
        'message',
        'avatar/emotion',
        Buffer.from(JSON.stringify({ emotion: 'happy' })),
      );

      expect(nekoStateMachine.setEmotion).toHaveBeenCalledWith('happy');
    });

    it('should handle MQTT messages for animation', () => {
      // Trigger a message event directly on the MQTT client
      mqttClient.emit(
        'message',
        'avatar/animation',
        Buffer.from(JSON.stringify({ animation: 'silly_dancing' })),
      );

      expect(nekoStateMachine.setAnimation).toHaveBeenCalledWith(
        'silly_dancing',
      );
    });

    it('should handle MQTT messages for audio', () => {
      // Trigger a message event directly on the MQTT client
      mqttClient.emit(
        'message',
        'avatar/audio',
        Buffer.from(
          JSON.stringify({ url: 'http://example.com/audio.mp3' }),
        ),
      );

      expect(nekoStateMachine.setAudio).toHaveBeenCalledWith(
        'http://example.com/audio.mp3',
      );
    });

    it('should ignore invalid emotions', () => {
      mqttClient.emit(
        'message',
        'avatar/emotion',
        Buffer.from(JSON.stringify({ emotion: 'invalid_emotion' })),
      );

      expect(nekoStateMachine.setEmotion).not.toHaveBeenCalled();
    });

    it('should ignore invalid animations', () => {
      mqttClient.emit(
        'message',
        'avatar/animation',
        Buffer.from(JSON.stringify({ animation: 'invalid_animation' })),
      );

      expect(nekoStateMachine.setAnimation).not.toHaveBeenCalled();
    });
  });
});
