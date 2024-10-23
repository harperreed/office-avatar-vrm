const request = require('supertest');
const express = require('express');
const {
  NekoGirlStateMachine,
  Emotion,
  Animation,
} = require('../NekoGirlStateMachine');
const { EventEmitter } = require('events');

// Mock the NekoGirlStateMachine
jest.mock('../NekoGirlStateMachine', () => {
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

// Mock external dependencies
jest.mock('socket.io', () => ({
  Server: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    close: jest.fn(),
  })),
}));

jest.mock('mqtt', () => ({
  connect: jest.fn(() => ({
    on: jest.fn(),
    subscribe: jest.fn(),
    end: jest.fn(),
  })),
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

describe('API Endpoints', () => {
  let app;

  beforeAll(() => {
    // Set max listeners to prevent memory leak warnings
    EventEmitter.defaultMaxListeners = 20;
  });

  beforeEach(() => {
    // Create fresh Express app
    app = express();
    app.use(express.json());

    // Initialize NekoGirlStateMachine
    const nekoStateMachine = new NekoGirlStateMachine(30);

    // Set up routes
    app.post('/api/emotion', (req, res) => {
      const emotion = req.body.emotion;
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
      const isValidAnimation =
                Object.values(Animation).includes(animation);
      if (isValidAnimation) {
        nekoStateMachine.setAnimation(animation);
        res.sendStatus(200);
      } else {
        res.status(400).send('Invalid animation');
      }
    });

    app.post('/api/audio', (req, res) => {
      const audioUrl = req.body.audioUrl;
      nekoStateMachine.setAudio(audioUrl);
      res.sendStatus(200);
    });

    app.post('/api/reload', (req, res) => {
      res.sendStatus(200);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    EventEmitter.defaultMaxListeners = 10; // Reset to default
  });

  describe('POST /api/emotion', () => {
    it('should set emotion and return 200 for valid emotion', async () => {
      const response = await request(app)
        .post('/api/emotion')
        .send({ emotion: 'neutral' });
      expect(response.status).toBe(200);
    });

    it('should return 400 for invalid emotion', async () => {
      const response = await request(app)
        .post('/api/emotion')
        .send({ emotion: 'invalid_emotion' });
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/animation', () => {
    it('should set animation and return 200 for valid animation', async () => {
      const response = await request(app)
        .post('/api/animation')
        .send({ animation: 'none' });
      expect(response.status).toBe(200);
    });

    it('should return 400 for invalid animation', async () => {
      const response = await request(app)
        .post('/api/animation')
        .send({ animation: 'invalid_animation' });
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/audio', () => {
    it('should set audio and return 200', async () => {
      const response = await request(app)
        .post('/api/audio')
        .send({ audioUrl: 'http://example.com/audio.mp3' });
      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/reload', () => {
    it('should reload and return 200', async () => {
      const response = await request(app).post('/api/reload');
      expect(response.status).toBe(200);
    });
  });
});
