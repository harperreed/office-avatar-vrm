const request = require("supertest");
const express = require("express");
const {
    NekoGirlStateMachine,
    Emotion,
    Animation,
} = require("../../NekoGirlStateMachine");
const { EventEmitter } = require("events");
const mqtt = require("mqtt");
const http = require("http");

// Mock the NekoGirlStateMachine
jest.mock("../../NekoGirlStateMachine", () => {
    return {
        NekoGirlStateMachine: jest.fn(() => ({
            setEmotion: jest.fn(),
            setAnimation: jest.fn(),
            setAudio: jest.fn(),
            on: jest.fn(),
            emit: jest.fn(),
        })),
        Emotion: {
            NEUTRAL: "neutral",
            HAPPY: "happy",
            SAD: "sad",
            ANGRY: "angry",
            SURPRISED: "surprised",
        },
        Animation: {
            NONE: "none",
            DANCING: "silly_dancing",
            ANGRY: "angry",
            NEUTRAL: "neutral",
            LOOK_LEFT: "look_left",
            LOOK_RIGHT: "look_right",
        },
    };
});

// Mock external dependencies
jest.mock("mqtt", () => ({
    connect: jest.fn(() => ({
        on: jest.fn(),
        subscribe: jest.fn(),
        end: jest.fn(),
    })),
}));

jest.mock("winston", () => ({
    createLogger: jest.fn(() => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    })),
    format: { json: jest.fn() },
    transports: { Console: jest.fn() },
}));

describe("Integration Tests for MQTT in app.js", () => {
    let app;
    let server;
    let mqttClient;

    beforeAll(() => {
        // Set max listeners to prevent memory leak warnings
        EventEmitter.defaultMaxListeners = 20;
    });

    beforeEach(() => {
        // Create fresh Express app
        app = express();
        app.use(express.json());

        // Initialize NekoGirlStateMachine
        const nekoStateMachine = new NekoGirlStateMachine(30);

        // Set up routes
        app.post("/api/emotion", (req, res) => {
            const emotion = req.body.emotion;
            const isValidEmotion = Object.values(Emotion).includes(emotion);
            if (isValidEmotion) {
                nekoStateMachine.setEmotion(emotion);
                res.sendStatus(200);
            } else {
                res.status(400).send("Invalid emotion");
            }
        });

        app.post("/api/animation", (req, res) => {
            const animation = req.body.animation;
            const isValidAnimation =
                Object.values(Animation).includes(animation);
            if (isValidAnimation) {
                nekoStateMachine.setAnimation(animation);
                res.sendStatus(200);
            } else {
                res.status(400).send("Invalid animation");
            }
        });

        app.post("/api/audio", (req, res) => {
            const audioUrl = req.body.audioUrl;
            nekoStateMachine.setAudio(audioUrl);
            res.sendStatus(200);
        });

        app.post("/api/reload", (req, res) => {
            res.sendStatus(200);
        });

        // Set up server
        server = http.createServer(app);

        // Set up MQTT client
        mqttClient = mqtt.connect("mqtt://localhost:1883");

        mqttClient.on("connect", () => {
            mqttClient.subscribe("avatar/#", (err) => {
                if (err) {
                    console.error("Subscription error:", err);
                }
            });
        });

        mqttClient.on("message", (topic, message) => {
            const payload = JSON.parse(message.toString());

            switch (topic) {
                case "avatar/emotion":
                    const emotion = payload.emotion;
                    const isValidEmotion = Object.values(Emotion).includes(emotion);
                    if (isValidEmotion) {
                        nekoStateMachine.setEmotion(emotion);
                    }
                    break;

                case "avatar/animation":
                    const animation = payload.animation;
                    const isValidAnimation = Object.values(Animation).includes(animation);
                    if (isValidAnimation) {
                        nekoStateMachine.setAnimation(animation);
                    }
                    break;

                case "avatar/audio":
                    const audioUrl = payload.url;
                    nekoStateMachine.setAudio(audioUrl);
                    break;

                default:
                    console.warn("Unknown MQTT topic");
            }
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
        server.close();
        mqttClient.end();
    });

    afterAll(() => {
        EventEmitter.defaultMaxListeners = 10; // Reset to default
    });

    describe("MQTT Functionality", () => {
        it("should handle MQTT messages for emotion", () => {
            const message = JSON.stringify({ emotion: "happy" });
            mqttClient.emit("message", "avatar/emotion", message);
            expect(nekoStateMachine.setEmotion).toHaveBeenCalledWith("happy");
        });

        it("should handle MQTT messages for animation", () => {
            const message = JSON.stringify({ animation: "dancing" });
            mqttClient.emit("message", "avatar/animation", message);
            expect(nekoStateMachine.setAnimation).toHaveBeenCalledWith("dancing");
        });

        it("should handle MQTT messages for audio", () => {
            const message = JSON.stringify({ url: "http://example.com/audio.mp3" });
            mqttClient.emit("message", "avatar/audio", message);
            expect(nekoStateMachine.setAudio).toHaveBeenCalledWith("http://example.com/audio.mp3");
        });
    });
});
