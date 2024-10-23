const request = require('supertest');
const app = require('../app');

describe('API Endpoints', () => {
  describe('POST /api/emotion', () => {
    it('should set emotion and return 200 for valid emotion', async () => {
      const response = await request(app)
        .post('/api/emotion')
        .send({ emotion: 'happy' });
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
        .send({ animation: 'dancing' });
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
      const response = await request(app)
        .post('/api/reload');
      expect(response.status).toBe(200);
    });
  });
});
