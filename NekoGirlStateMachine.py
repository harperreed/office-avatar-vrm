import threading
from enum import Enum
from flask_socketio import emit
import structlog



class Emotion(Enum):
    NEUTRAL = "neutral"
    HAPPY = "happy"
    SAD = "sad"
    ANGRY = "angry"
    SURPRISED = "surprised"

class Animation(Enum):
    NONE = "none"
    DANCING = "silly_dancing"
    ANGRY = "angry"
    DAGGER = "dagger"

class NekoGirlStateMachine:
    def __init__(self, activity_timeout=30):
        # Initialize self.logger
        self.logger = structlog.getLogger(__name__)
        self.current_emotion = Emotion.NEUTRAL
        self.current_animation = Animation.NONE
        self.current_audio = None
        self.activity_timeout = activity_timeout
        self.reset_timer = None

    def set_emotion(self, emotion: Emotion):
        self.current_emotion = emotion
        self.emit('set_emotion', {'emotion': emotion.value})
        self.reset_activity_timer()
        self.logger.info(f"Emotion set to {self.current_emotion}")

    def set_animation(self, animation: Animation):
        self.current_animation = animation
        self.emit('set_animation', {'animation': animation.value})
        self.reset_activity_timer()
        self.logger.info(f"Animation set to {self.current_animation}")

    def set_audio(self, audio_url: str):
        self.current_audio = audio_url
        self.emit('set_audio', {'audio_url': audio_url})
        self.reset_activity_timer()
        self.logger.info(f"Audio URL set to {self.current_audio}")

    def reset_activity_timer(self):
        if self.reset_timer:
            self.reset_timer.cancel()
        self.reset_timer = threading.Timer(self.activity_timeout, self.reset_to_neutral)
        self.reset_timer.start()

    def reset_to_neutral(self):
        self.current_emotion = Emotion.NEUTRAL
        self.current_animation = Animation.NONE
        self.current_audio = None
        self.emit('state_reset', {'emotion': self.current_emotion, 'animation': self.current_animation})
        self.logger.info("Reset to neutral due to inactivity")
