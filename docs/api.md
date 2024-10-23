# API Documentation

## Endpoints

### POST /api/emotion
Sets the emotion of the character.

**Request Body:**
```json
{
  "emotion": "happy"
}
```

**Responses:**
- `200 OK`: Emotion set successfully.
- `400 Bad Request`: Invalid emotion.

### POST /api/animation
Sets the animation of the character.

**Request Body:**
```json
{
  "animation": "dancing"
}
```

**Responses:**
- `200 OK`: Animation set successfully.
- `400 Bad Request`: Invalid animation.

### POST /api/audio
Sets the audio URL for the character.

**Request Body:**
```json
{
  "audioUrl": "http://example.com/audio.mp3"
}
```

**Responses:**
- `200 OK`: Audio URL set successfully.
- `400 Bad Request`: Invalid audio URL.

### POST /api/reload
Reloads the character state.

**Responses:**
- `200 OK`: Character state reloaded successfully.

## Configuration

The application uses a centralized configuration system located in `config/index.js`. This system manages all configurable values and validates environment variables using `joi`.

## State Management

The application uses a type-safe state machine class `AvatarStateMachine` with proper event handling and clean state transitions. The state machine ensures robust state management and validation for all state changes.

## MQTT Service

The `MQTTService` class handles MQTT connections, subscriptions, and message processing. It includes automatic reconnection, better error handling, and proper subscription management.

## Logging

The application uses a logger utility implemented with `winston` for consistent logging throughout the application.

## Health Check

The application includes a health check endpoint to monitor the application's health.

## Metrics

The application includes metrics collection to monitor the application's performance.

## Rate Limiting

The application includes rate limiting to prevent abuse of the API endpoints.

## Input Sanitization

The application includes input sanitization to prevent injection attacks and ensure data integrity.
