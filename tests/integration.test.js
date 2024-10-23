const request = require("supertest");
const express = require("express");
const {
    NekoGirlStateMachine,
    Emotion,
    Animation,
} = require("../NekoGirlStateMachine");
const { EventEmitter } = require("events");
const mqtt = require("mqtt");
const socketIO = require("socket.io");
const http = require("http");

// Mock the NekoGirlStateMachine
jest.mock("../NekoGirlStateMachine", () => {
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
jest.mock("socket.io", () => ({
    Server: jest.fn(() => ({
        on: jest.fn(),
        emit: jest.fn(),
        close: jest.fn(),
    })),
}));

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

describe("Integration Tests for app.js", () => {
    let app;
    let server;
    let io;
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

        // Set up server and socket.io
        server = http.createServer(app);
        io = socketIO(server);

        io.on("connection", (socket) => {
            socket.on("set_emotion", (data) => {
                const emotion = data.emotion;
                const isValidEmotion = Object.values(Emotion).includes(emotion);
                if (isValidEmotion) {
                    nekoStateMachine.setEmotion(emotion);
                    io.emit("set_emotion", { emotion });
                }
            });

            socket.on("set_animation", (data) => {
                const animation = data.animation;
                const isValidAnimation = Object.values(Animation).includes(animation);
                if (isValidAnimation) {
                    nekoStateMachine.setAnimation(animation);
                    io.emit("set_animation", { animation });
                }
            });

            socket.on("set_audio", (data) => {
                const audioUrl = data.audioUrl;
                nekoStateMachine.setAudio(audioUrl);
                io.emit("set_audio", { audioUrl });
            });

            socket.on("reload_page", () => {
                io.emit("reload_page");
            });
        });

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
                        io.emit("set_emotion", { emotion });
                    }
                    break;

                case "avatar/animation":
                    const animation = payload.animation;
                    const isValidAnimation = Object.values(Animation).includes(animation);
                    if (isValidAnimation) {
                        nekoStateMachine.setAnimation(animation);
                        io.emit("set_animation", { animation });
                    }
                    break;

                case "avatar/audio":
                    const audioUrl = payload.url;
                    nekoStateMachine.setAudio(audioUrl);
                    io.emit("set_audio", { audioUrl });
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

    describe("API Endpoints", () => {
        it("should set emotion and return 200 for valid emotion", async () => {
            const response = await request(app)
                .post("/api/emotion")
                .send({ emotion: "neutral" });
            expect(response.status).toBe(200);
        });

        it("should return 400 for invalid emotion", async () => {
            const response = await request(app)
                .post("/api/emotion")
                .send({ emotion: "invalid_emotion" });
            expect(response.status).toBe(400);
        });

        it("should set animation and return 200 for valid animation", async () => {
            const response = await request(app)
                .post("/api/animation")
                .send({ animation: "none" });
            expect(response.status).toBe(200);
        });

        it("should return 400 for invalid animation", async () => {
            const response = await request(app)
                .post("/api/animation")
                .send({ animation: "invalid_animation" });
            expect(response.status).toBe(400);
        });

        it("should set audio and return 200", async () => {
            const response = await request(app)
                .post("/api/audio")
                .send({ audioUrl: "http://example.com/audio.mp3" });
            expect(response.status).toBe(200);
        });

        it("should reload and return 200", async () => {
            const response = await request(app).post("/api/reload");
            expect(response.status).toBe(200);
        });
    });

    describe("MQTT Functionality", () => {
        it("should handle MQTT messages for emotion", () => {
            const message = JSON.stringify({ emotion: "happy" });
            mqttClient.emit("message", "avatar/emotion", message);
            expect(nekoStateMachine.setEmotion).toHaveBeenCalledWith("happy");
            expect(io.emit).toHaveBeenCalledWith("set_emotion", { emotion: "happy" });
        });

        it("should handle MQTT messages for animation", () => {
            const message = JSON.stringify({ animation: "dancing" });
            mqttClient.emit("message", "avatar/animation", message);
            expect(nekoStateMachine.setAnimation).toHaveBeenCalledWith("dancing");
            expect(io.emit).toHaveBeenCalledWith("set_animation", { animation: "dancing" });
        });

        it("should handle MQTT messages for audio", () => {
            const message = JSON.stringify({ url: "http://example.com/audio.mp3" });
            mqttClient.emit("message", "avatar/audio", message);
            expect(nekoStateMachine.setAudio).toHaveBeenCalledWith("http://example.com/audio.mp3");
            expect(io.emit).toHaveBeenCalledWith("set_audio", { audioUrl: "http://example.com/audio.mp3" });
        });
    });

    describe("Socket.IO Events", () => {
        it("should handle socket.io events for emotion", (done) => {
            const socket = {
                on: jest.fn((event, callback) => {
                    if (event === "set_emotion") {
                        callback({ emotion: "happy" });
                    }
                }),
                emit: jest.fn(),
            };

            io.emit("connection", socket);

            setImmediate(() => {
                expect(nekoStateMachine.setEmotion).toHaveBeenCalledWith("happy");
                expect(io.emit).toHaveBeenCalledWith("set_emotion", { emotion: "happy" });
                done();
            });
        });

        it("should handle socket.io events for animation", (done) => {
            const socket = {
                on: jest.fn((event, callback) => {
                    if (event === "set_animation") {
                        callback({ animation: "dancing" });
                    }
                }),
                emit: jest.fn(),
            };

            io.emit("connection", socket);

            setImmediate(() => {
                expect(nekoStateMachine.setAnimation).toHaveBeenCalledWith("dancing");
                expect(io.emit).toHaveBeenCalledWith("set_animation", { animation: "dancing" });
                done();
            });
        });

        it("should handle socket.io events for audio", (done) => {
            const socket = {
                on: jest.fn((event, callback) => {
                    if (event === "set_audio") {
                        callback({ audioUrl: "http://example.com/audio.mp3" });
                    }
                }),
                emit: jest.fn(),
            };

            io.emit("connection", socket);

            setImmediate(() => {
                expect(nekoStateMachine.setAudio).toHaveBeenCalledWith("http://example.com/audio.mp3");
                expect(io.emit).toHaveBeenCalledWith("set_audio", { audioUrl: "http://example.com/audio.mp3" });
                done();
            });
        });

        it("should handle socket.io events for reload", (done) => {
            const socket = {
                on: jest.fn((event, callback) => {
                    if (event === "reload_page") {
                        callback();
                    }
                }),
                emit: jest.fn(),
            };

            io.emit("connection", socket);

            setImmediate(() => {
                expect(io.emit).toHaveBeenCalledWith("reload_page");
                done();
            });
        });
    });
});
