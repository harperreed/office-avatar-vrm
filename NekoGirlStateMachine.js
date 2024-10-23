const EventEmitter = require("events");

// Define enum-like properties
class Emotion {
    static NEUTRAL = "neutral";
    static HAPPY = "happy";
    static SAD = "sad";
    static ANGRY = "angry";
    static SURPRISED = "surprised";
}

class Animation {
    // Define enum-like properties
    static NONE = "none";
    static DANCING = "silly_dancing";
    static ANGRY = "angry";
    static NEUTRAL = "neutral";
    static LOOK_LEFT = "look_left";
    static LOOK_RIGHT = "look_right";
}

class LookDirections {
    // Define enum-like properties
    static FORWARD = "forward";
    static UP = "up";
    static DOWN = "down";
    static LEFT = "left";
    static RIGHT = "right";
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
        this.emit("emotion_change", { emotion });
        this.resetActivityTimer();
        this.logger.info(`Emotion set to ${this.currentEmotion}`);
    }

    setAnimation(animation) {
        this.currentAnimation = animation;
        this.emit("animation_change", { animation });
        this.resetActivityTimer();
        this.logger.info(`Animation set to ${this.currentAnimation}`);
    }

    setAudio(audioUrl) {
        this.currentAudio = audioUrl;
        this.emit("audio_change", { audioUrl });
        this.resetActivityTimer();
        this.logger.info(`Audio URL set to ${this.currentAudio}`);
    }

    resetActivityTimer() {
        if (this.resetTimer) clearTimeout(this.resetTimer);
        this.resetTimer = setTimeout(
            () => this.resetToNeutral(),
            this.activityTimeout * 1000,
        );
    }

    resetToNeutral() {
        this.currentEmotion = Emotion.NEUTRAL;
        this.currentAnimation = Animation.NONE;
        this.currentAudio = null;
        this.emit("state_reset", {
            emotion: this.currentEmotion,
            animation: this.currentAnimation,
        });
        this.logger.info("Reset to neutral due to inactivity");
    }
}

module.exports = { NekoGirlStateMachine, Emotion, Animation, LookDirections };
