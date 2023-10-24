from flask import Flask, request, jsonify, send_from_directory
from flask import Flask, render_template, request, jsonify
import threading
from flask_socketio import SocketIO, emit
from NekoGirlStateMachine import NekoGirlStateMachine, Emotion, Animation
import structlog
import uuid
import os
import json
import time
from dotenv import load_dotenv
import paho.mqtt.client as mqtt

load_dotenv()

logger = structlog.getLogger(__name__)

# Handle Neko State
neko_state_machine = NekoGirlStateMachine(activity_timeout=30)

def reset_to_neutral():
    neko_state_machine.current_emotion = Emotion.NEUTRAL
    neko_state_machine.current_animation = Animation.NONE
    logger.info("Reset to neutral due to inactivity")
    socketio.emit('state_reset', {'emotion': 'neutral', 'animation': 'none'})

def emit_state_change(event_name, data):
    logger.info(f"Emitted {event_name} with data {data}")
    socketio.emit(event_name, data)
    try:
        key, value = next(iter(data.items()))
        client.publish(f"avatar/{key}/state", value)
    except Exception as e:  # Specify the type of exception
        logger.error(f"Exception: {e}")

neko_state_machine.emit = emit_state_change
neko_state_machine.reset_to_neutral = reset_to_neutral

#Flask setup
app = Flask(__name__, static_folder='static')
socketio = SocketIO(app)

DEBUG = os.getenv("DEBUG", False)

WEB_ADDRESS = os.getenv("WEB_ADDRESS", "0.0.0.0")
WEB_PORT = os.getenv("WEB_PORT", "8765")

# MQTT setup
MQTT_BROKER = os.getenv("MQTT_BROKER")
MQTT_PORT = int(os.getenv("MQTT_PORT"))
MQTT_TOPIC = os.getenv("MQTT_TOPIC", "avatar/#")

machine_id = uuid.UUID(int=uuid.getnode()).hex[-12:]

# client = mqtt.Client(client_id=f"NekoGirlFlask-{machine_id}")
client = mqtt.Client()
client.enable_logger()

#MQTT Magic
def on_connect(client, userdata, flags, rc):
    logger.info(f"Connected to MQTT broker with result code {rc}")
    
    client.subscribe(MQTT_TOPIC)
    
#MQTT Magic
def on_disconnect(client, userdata, rc):
    logger.info(f"Disconnected to MQTT broker with result code {rc}")
    if rc != 0:
        logger.warning(f"Unexpected disconnection, attempting to reconnect")
        time.sleep(5)
        client.reconnect()



def on_message(client, userdata, msg):
    topic = msg.topic.split('/')[-1]
    payload = msg.payload.decode('utf-8')

    logger.info(f"Received message on topic {topic} with payload {payload}")
    
    if topic == 'emotion':
        logger.debug(f"MQTT: Setting emotion to {payload}")
        neko_state_machine.set_emotion(Emotion(payload))
    elif topic == 'animation':
        logger.debug(f"MQTT: Setting animation to {payload}")
        neko_state_machine.set_animation(Animation(payload))
    elif topic == 'audio':
        logger.debug(f"MQTT: Setting audio to {payload}")
        neko_state_machine.set_audio(payload)
        # Your logic for handling audio
        pass
    elif topic == 'voice':
        voice = json.loads(payload)
        logger.debug(f"MQTT: Setting emotion to {voice['OverallEmotion']}")
        neko_state_machine.set_emotion(Emotion(voice['OverallEmotion']))
        logger.debug(f"MQTT: Setting audio to {voice['audio_url']}")
        neko_state_machine.set_audio(voice['audio_url'])
        # Your logic for handling audio
    elif topic == 'reload':
        logger.debug(f"MQTT: Reloading page")
        emit_state_change("reload_page", {})

client.on_connect = on_connect
client.on_disconnect = on_disconnect
client.on_message = on_message


#Handle API

@app.route('/')
def index():
    logger.info("Serving index.html")
    # neko_state_machine.set_audio("/static/mp3/dearbaby.mp3")
    return render_template('index.html')

@app.route('/api/emotion', methods=['POST'])
def set_emotion():
    if not request.is_json:
        return jsonify({"status": "failure", "reason": "Expecting JSON"}), 400
    logger.debug(f"API: Setting emotion to {request.json.get('emotion')}")
    emotion = request.json.get('emotion')
    if emotion is None:
        return jsonify({"status": "failure", "reason": "Missing 'emotion'"}), 400
    neko_state_machine.set_emotion(Emotion(emotion))
    return jsonify({"status": "success"}), 200

@app.route('/api/animation', methods=['POST'])
def set_animation():
    if not request.is_json:
        return jsonify({"status": "failure", "reason": "Expecting JSON"}), 400
    logger.debug(f"API: Setting animation to {request.json.get('animation')}")
    animation = request.json.get('animation')
    if animation is None:
        return jsonify({"status": "failure", "reason": "Missing 'animation'"}), 400
    
    neko_state_machine.set_animation(Animation(animation))
    return jsonify({"status": "success"}), 200

@app.route('/api/audio', methods=['POST'])
def set_audio():
    if not request.is_json:
        return jsonify({"status": "failure", "reason": "Expecting JSON"}), 400
    logger.debug(f"API: Setting audio to {request.json.get('audio_url')}")
    audio_url = request.json.get('audio_url')
    if audio_url is None:
        return jsonify({"status": "failure", "reason": "Missing 'audio_url'"}), 400
    neko_state_machine.set_audio(audio_url)
    return jsonify({"status": "success"}), 200

@app.route('/api/reload', methods=['POST'])
def reload_avatar():
    if not request.is_json:
        return jsonify({"status": "failure", "reason": "Expecting JSON"}), 400
    logger.debug(f"API: Reloading page")
    emit_state_change("reload_page", {})
    return jsonify({"status": "success"}), 200

if __name__ == '__main__':

    try:
        logger.info("Starting MQTT thread")
        
        rc = client.connect(MQTT_BROKER, MQTT_PORT, 60)
        if rc == 0:  # Successful connect
            client.loop_start()
        else:
            logger.error(f"Failed to connect with result code {rc}")

        # client.loop_forever()
    except Exception as e:
        logger.error(f"Exception in MQTT thread: {e}")

    socketio.run(app, host=WEB_ADDRESS, port=WEB_PORT, debug=DEBUG)