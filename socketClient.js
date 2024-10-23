const socketIO = require('socket.io');
const winston = require('winston');

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

function setupSocketIO(server, nekoStateMachine) {
  const io = socketIO(server);

  nekoStateMachine.on('emotion_change', (data) => {
    const emotion = data.emotion;
    logger.debug(`SM Event: Emotion set to ${emotion}`);
    io.emit('set_emotion', { emotion });
  });

  nekoStateMachine.on('animation_change', (data) => {
    const animation = data.animation;
    console.log(`SM Event: Animation set to ${data.animation}`);
    io.emit('set_animation', { animation });
  });

  nekoStateMachine.on('audio_change', (data) => {
    const audioUrl = data.audioUrl;
    logger.info(`SM Event: Audio URL set to ${audioUrl}`);
    io.emit('set_audio', { audioUrl });
  });

  return io;
}

module.exports = { setupSocketIO };
