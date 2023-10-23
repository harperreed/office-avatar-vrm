from flask import Flask, request, jsonify, send_from_directory
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
from NekoGirlStateMachine import NekoGirlStateMachine, Emotion, Animation
import structlog
import os
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
    except:
        pass

neko_state_machine.emit = emit_state_change
neko_state_machine.reset_to_neutral = reset_to_neutral

#Flask setup
app = Flask(__name__, static_folder='static')
socketio = SocketIO(app)

# MQTT setup
MQTT_BROKER = os.getenv("MQTT_BROKER")
MQTT_PORT = int(os.getenv("MQTT_PORT"))

client = mqtt.Client("NekoGirlFlask")

#MQTT Magic
def on_connect(client, userdata, flags, rc):
    logger.info(f"Connected to MQTT broker with result code {rc}")
    client.subscribe("avatar/#")

def on_message(client, userdata, msg):
    topic = msg.topic.split('/')[-1]
    payload = msg.payload.decode('utf-8')

    logger.info(f"Received message on topic {topic} with payload {payload}")
    
    if topic == 'emotion':
        neko_state_machine.set_emotion(Emotion(payload))
    elif topic == 'animation':
        neko_state_machine.set_animation(Animation(payload))
    elif topic == 'audio':
        neko_state_machine.set_audio(payload)
        # Your logic for handling audio
        pass
    elif topic == 'reload':
        emit_state_change("reload_page", {})

client.on_connect = on_connect
client.on_message = on_message

client.connect(MQTT_BROKER, MQTT_PORT, 60)
client.loop_start()
#Handle API

@app.route('/')
def index():
    logger.info("Serving index.html")
    # neko_state_machine.set_audio("/static/mp3/dearbaby.mp3")
    return render_template('index.html')

@app.route('/api/emotion', methods=['POST'])
def set_emotion():
    emotion = request.json.get('emotion')
    neko_state_machine.set_emotion(Emotion(emotion))
    return jsonify({"status": "success"}), 200

@app.route('/api/animation', methods=['POST'])
def set_animation():
    animation = request.json.get('animation')
    neko_state_machine.set_animation(Animation(animation))
    return jsonify({"status": "success"}), 200

@app.route('/api/audio', methods=['POST'])
def set_audio():
    audio_url = request.json.get('audio_url')
    neko_state_machine.set_audio(audio_url)
    return jsonify({"status": "success"}), 200

@app.route('/api/reload', methods=['POST'])
def reload_avatar():
    emit_state_change("reload_page", {})
    return jsonify({"status": "success"}), 200

if __name__ == '__main__':
    # app.run(debug=True)\
    socketio.run(app, host='0.0.0.0', port=8765, debug=True)
