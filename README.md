# Office Avatar (using VRM files)
![image](https://github.com/harperreed/office-avatar-vrm/assets/18504/acdcd1ac-eb71-458c-8369-78900208920a)

## Overview

Office Avatar is a Node.js server designed to manage and control a virtual character's state (emotion, animation, audio) using API endpoints and MQTT subscriptions. It leverages the AvatarStateMachine class for managing the character's state and emits relevant information to connected clients via Socket.io.

## Prerequisites

- Node.js v20.8.1 or later
- MQTT broker
- Uses [ChatVRM-js](https://github.com/josephrocca/ChatVRM-js), a JavaScript conversion/adaptation of parts of the ChatVRM (TypeScript), for the VRM viewer features.

## Installation

1. Clone the repository.
2. Run `npm install` to install the required packages.
3. Create a `.env` file in the project directory and specify the following variables:
   ```
   MQTT_BROKER=your_mqtt_broker_address
   MQTT_PORT=your_mqtt_port
   MQTT_TOPIC=avatar/#
   DEBUG=true_or_false
   ```

## Running the Server

Run `node app.js` to start the server. The server will listen on port 8765.

## API Endpoints

- `POST /api/emotion`: Sets the emotion of the character.
- `POST /api/animation`: Sets the animation of the character.
- `POST /api/audio`: Sets the audio URL for the character.
- `POST /api/reload`: Reloads the character state.

## MQTT Topics

The server subscribes to the following MQTT topics:

- `avatar/emotion`: Sets the emotion of the character.
- `avatar/animation`: Sets the animation of the character.
- `avatar/audio`: Sets the audio of the character.

## Configuration System

The application uses a centralized configuration system located in `config/index.js`. This system manages all configurable values and validates environment variables using `joi`.

## State Management

The application uses a type-safe state machine class `AvatarStateMachine` with proper event handling and clean state transitions. The state machine ensures robust state management and validation for all state changes.

## Development

To reload the server on file changes, you can use tools like `nodemon`.

## Logging

Winston and Morgan are recommended for comprehensive logging.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
