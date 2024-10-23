const express = require('express');
const promClient = require('prom-client');

const router = express.Router();

// Create a Registry which registers the metrics
const register = new promClient.Registry();

// Add a default metrics collection
promClient.collectDefaultMetrics({ register });

// Define a custom metric
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 5, 15, 50, 100, 300, 500, 1000, 3000, 5000] // buckets for response time from 0.1ms to 5s
});

register.registerMetric(httpRequestDurationMicroseconds);

// Middleware to measure request duration
router.use((req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.route ? req.route.path : req.url, code: res.statusCode });
  });
  next();
});

// Endpoint to expose metrics
router.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

module.exports = router;
