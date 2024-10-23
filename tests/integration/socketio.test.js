const express = require('express');
const {
  NekoGirlStateMachine,
  Emotion,
  Animation,
} = require('../../NekoGirlStateMachine');
const { EventEmitter } = require('events');
const { Server } = require('socket.io');
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

// Create MockSocket class
class MockSocket {
  constructor() {
    this.handlers = {};
    this.emit = jest.fn();
  }

  on(event, handler) {
    this.handlers[event] = handler;
  }

  // Method to simulate receiving an event
  simulateEvent(event, data) {
    if (this.handlers[event]) {
      this.handlers[event](data);
    }
  }
}

// Create MockIO class
class MockIO {
  constructor() {
    this.handlers = {};
    this.emit = jest.fn();
    this.sockets = {
      emit: jest.fn(),
    };
  }

  on(event, handler) {
    this.handlers[event] = handler;
  }

  // Method to simulate a connection
  simulateConnection() {
    const socket = new MockSocket();
    if (this.handlers.connection) {
      this.handlers.connection(socket);
    }
    return socket;
  }
}

// Mock socket.io
jest.mock('socket.io', () => ({
  Server: jest.fn(() => new MockIO()),
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

describe('Integration Tests for Socket.IO in app.js', () => {
  let app;
  let server;
  let io;
  let nekoStateMachine;
  let socket;

  beforeAll(() => {
    EventEmitter.defaultMaxListeners = 20;
  });

  beforeEach(() => {
    app = express();
    app.use(express.json());

    nekoStateMachine = new NekoGirlStateMachine(30);
    server = http.createServer(app);
    io = new Server(server);

    io.on('connection', (socket) => {
      socket.on('set_emotion', (data) => {
        const emotion = data.emotion;
        const isValidEmotion = Object.values(Emotion).includes(emotion);
        if (isValidEmotion) {
          nekoStateMachine.setEmotion(emotion);
          io.emit('set_emotion', { emotion });
        }
      });

      socket.on('set_animation', (data) => {
        const animation = data.animation;
        const isValidAnimation =
                    Object.values(Animation).includes(animation);
        if (isValidAnimation) {
          nekoStateMachine.setAnimation(animation);
          io.emit('set_animation', { animation });
        }
      });

      socket.on('set_audio', (data) => {
        const audioUrl = data.audioUrl;
        nekoStateMachine.setAudio(audioUrl);
        io.emit('set_audio', { audioUrl });
      });

      socket.on('reload_page', () => {
        io.emit('reload_page');
      });
    });

    // Get a mock socket for testing
    socket = io.simulateConnection();
  });

  afterEach(() => {
    jest.clearAllMocks();
    server.close();
  });

  afterAll(() => {
    EventEmitter.defaultMaxListeners = 10;
  });

  describe('Socket.IO Events', () => {
    it('should handle socket.io events for emotion', () => {
      socket.simulateEvent('set_emotion', { emotion: 'happy' });

      expect(nekoStateMachine.setEmotion).toHaveBeenCalledWith('happy');
      expect(io.emit).toHaveBeenCalledWith('set_emotion', {
        emotion: 'happy',
      });
    });

    it('should handle socket.io events for animation', () => {
      socket.simulateEvent('set_animation', {
        animation: 'silly_dancing',
      });

      expect(nekoStateMachine.setAnimation).toHaveBeenCalledWith(
        'silly_dancing',
      );
      expect(io.emit).toHaveBeenCalledWith('set_animation', {
        animation: 'silly_dancing',
      });
    });

    it('should handle socket.io events for audio', () => {
      socket.simulateEvent('set_audio', {
        audioUrl: 'http://example.com/audio.mp3',
      });

      expect(nekoStateMachine.setAudio).toHaveBeenCalledWith(
        'http://example.com/audio.mp3',
      );
      expect(io.emit).toHaveBeenCalledWith('set_audio', {
        audioUrl: 'http://example.com/audio.mp3',
      });
    });

    it('should handle socket.io events for reload', () => {
      socket.simulateEvent('reload_page');

      expect(io.emit).toHaveBeenCalledWith('reload_page');
    });

    it('should not emit events for invalid emotions', () => {
      socket.simulateEvent('set_emotion', { emotion: 'invalid_emotion' });

      expect(nekoStateMachine.setEmotion).not.toHaveBeenCalled();
      expect(io.emit).not.toHaveBeenCalled();
    });

    it('should not emit events for invalid animations', () => {
      socket.simulateEvent('set_animation', {
        animation: 'invalid_animation',
      });

      expect(nekoStateMachine.setAnimation).not.toHaveBeenCalled();
      expect(io.emit).not.toHaveBeenCalled();
    });
  });
});
