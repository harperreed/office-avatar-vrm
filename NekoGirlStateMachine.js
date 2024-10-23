const EventEmitter = require('events');

class Emotion {
  static get NEUTRAL() {
    return 'neutral';
  }
  static get HAPPY() {
    return 'happy';
  }
  static get SAD() {
    return 'sad';
  }
  static get ANGRY() {
    return 'angry';
  }
  static get SURPRISED() {
    return 'surprised';
  }
}

class Animation {
  static get NONE() {
    return 'none';
  }
  static get DANCING() {
    return 'silly_dancing';
  }
  static get ANGRY() {
    return 'angry';
  }
  static get NEUTRAL() {
    return 'neutral';
  }
  static get LOOK_LEFT() {
    return 'look_left';
  }
  static get LOOK_RIGHT() {
    return 'look_right';
  }
}

class LookDirections {
  static get FORWARD() {
    return 'forward';
  }
  static get UP() {
    return 'up';
  }
  static get DOWN() {
    return 'down';
  }
  static get LEFT() {
    return 'left';
  }
  static get RIGHT() {
    return 'right';
  }
}

class NekoGirlStateMachine extends EventEmitter {
  constructor(activityTimeout = 30) {
    super();
    this.logger = console; // Replace with your preferred logger
    this.currentEmotion = Emotion.NEUTRAL;
    this.currentAnimation = Animation.NONE;
    this.currentAudio = null;
    this.activityTimeout = activityTimeout;
    this.resetTimer = null;
  }

  setEmotion(emotion) {
    this.currentEmotion = emotion;
    this.emit('emotion_change', { emotion });
    this.resetActivityTimer();
    this.logger.info(`Emotion set to ${this.currentEmotion}`);
  }

  setAnimation(animation) {
    this.currentAnimation = animation;
    this.emit('animation_change', { animation });
    this.resetActivityTimer();
    this.logger.info(`Animation set to ${this.currentAnimation}`);
  }

  setAudio(audioUrl) {
    this.currentAudio = audioUrl;
    this.emit('audio_change', { audioUrl });
    this.resetActivityTimer();
    this.logger.info(`Audio URL set to ${this.currentAudio}`);
  }

  resetActivityTimer() {
    if (this.resetTimer) {clearTimeout(this.resetTimer);}
    this.resetTimer = setTimeout(
      () => this.resetToNeutral(),
      this.activityTimeout * 1000,
    );
  }

  resetToNeutral() {
    this.currentEmotion = Emotion.NEUTRAL;
    this.currentAnimation = Animation.NONE;
    this.currentAudio = null;
    this.emit('state_reset', {
      emotion: this.currentEmotion,
      animation: this.currentAnimation,
    });
    this.logger.info('Reset to neutral due to inactivity');
  }
}

module.exports = { NekoGirlStateMachine, Emotion, Animation, LookDirections };
