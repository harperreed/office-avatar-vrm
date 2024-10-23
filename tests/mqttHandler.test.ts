import MQTTService from '../src/services/MQTTService';

describe('MQTTService', () => {
  let mqttService;

  beforeEach(() => {
    mqttService = new MQTTService();
  });

  test('should connect to MQTT broker', (done) => {
    mqttService.on('connect', () => {
      expect(mqttService.isConnected).toBe(true);
      done();
    });
    mqttService.connect();
  });

  test('should handle connection errors', (done) => {
    mqttService.on('error', (error) => {
      expect(error).toBeDefined();
      done();
    });
    mqttService.connect();
    mqttService.client.emit('error', new Error('Connection error'));
  });

  test('should automatically reconnect on disconnection', (done) => {
    mqttService.on('close', () => {
      expect(mqttService.isConnected).toBe(false);
      setTimeout(() => {
        expect(mqttService.isConnected).toBe(true);
        done();
      }, mqttService.reconnectInterval + 1000);
    });
    mqttService.connect();
    mqttService.client.emit('close');
  });

  test('should subscribe to topics', (done) => {
    const topics = ['test/topic1', 'test/topic2'];
    mqttService.on('subscribed', (topic) => {
      expect(topics).toContain(topic);
      if (topics.every(t => mqttService.client.subscriptions[t])) {
        done();
      }
    });
    mqttService.connect();
    mqttService.subscribeToTopics({ test1: 'test/topic1', test2: 'test/topic2' });
  });

  test('should publish messages', (done) => {
    const topic = 'test/topic';
    const message = { data: 'test' };
    mqttService.on('published', (publishedTopic, publishedMessage) => {
      expect(publishedTopic).toBe(topic);
      expect(publishedMessage).toEqual(message);
      done();
    });
    mqttService.connect();
    mqttService.publish(topic, message);
  });

  test('should handle incoming messages', (done) => {
    const topic = 'test/topic';
    const message = 'test message';
    mqttService.on('message', (receivedTopic, receivedMessage) => {
      expect(receivedTopic).toBe(topic);
      expect(receivedMessage).toBe(message);
      done();
    });
    mqttService.connect();
    mqttService.client.emit('message', topic, message);
  });
});
