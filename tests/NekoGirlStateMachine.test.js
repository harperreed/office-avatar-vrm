const {
    NekoGirlStateMachine,
    Emotion,
    Animation,
    LookDirections,
} = require("../NekoGirlStateMachine");

describe("NekoGirlStateMachine", () => {
    let stateMachine;
    const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    };

    beforeEach(() => {
        jest.useFakeTimers();
        stateMachine = new NekoGirlStateMachine(30);
        stateMachine.logger = mockLogger; // Replace default console logger
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.clearAllMocks();
    });

    describe("Constructor", () => {
        it("should initialize with default state", () => {
            expect(stateMachine.currentEmotion).toBe(Emotion.NEUTRAL);
            expect(stateMachine.currentAnimation).toBe(Animation.NONE);
            expect(stateMachine.currentAudio).toBeNull();
            expect(stateMachine.activityTimeout).toBe(30);
        });

        it("should accept custom timeout value", () => {
            const customStateMachine = new NekoGirlStateMachine(60);
            expect(customStateMachine.activityTimeout).toBe(60);
        });
    });

    describe("setEmotion", () => {
        it("should set emotion and emit event", () => {
            const emotionSpy = jest.spyOn(stateMachine, "emit");

            stateMachine.setEmotion(Emotion.HAPPY);

            expect(stateMachine.currentEmotion).toBe(Emotion.HAPPY);
            expect(emotionSpy).toHaveBeenCalledWith("emotion_change", {
                emotion: Emotion.HAPPY,
            });
            expect(mockLogger.info).toHaveBeenCalledWith(
                `Emotion set to ${Emotion.HAPPY}`,
            );
        });

        it("should reset activity timer when emotion changes", () => {
            const resetSpy = jest.spyOn(stateMachine, "resetActivityTimer");

            stateMachine.setEmotion(Emotion.SAD);

            expect(resetSpy).toHaveBeenCalled();
        });
    });

    describe("setAnimation", () => {
        it("should set animation and emit event", () => {
            const animationSpy = jest.spyOn(stateMachine, "emit");

            stateMachine.setAnimation(Animation.DANCING);

            expect(stateMachine.currentAnimation).toBe(Animation.DANCING);
            expect(animationSpy).toHaveBeenCalledWith("animation_change", {
                animation: Animation.DANCING,
            });
            expect(mockLogger.info).toHaveBeenCalledWith(
                `Animation set to ${Animation.DANCING}`,
            );
        });

        it("should reset activity timer when animation changes", () => {
            const resetSpy = jest.spyOn(stateMachine, "resetActivityTimer");

            stateMachine.setAnimation(Animation.ANGRY);

            expect(resetSpy).toHaveBeenCalled();
        });
    });

    describe("setAudio", () => {
        it("should set audio URL and emit event", () => {
            const audioSpy = jest.spyOn(stateMachine, "emit");
            const testUrl = "http://example.com/audio.mp3";

            stateMachine.setAudio(testUrl);

            expect(stateMachine.currentAudio).toBe(testUrl);
            expect(audioSpy).toHaveBeenCalledWith("audio_change", {
                audioUrl: testUrl,
            });
            expect(mockLogger.info).toHaveBeenCalledWith(
                `Audio URL set to ${testUrl}`,
            );
        });

        it("should reset activity timer when audio changes", () => {
            const resetSpy = jest.spyOn(stateMachine, "resetActivityTimer");

            stateMachine.setAudio("http://example.com/audio.mp3");

            expect(resetSpy).toHaveBeenCalled();
        });
    });

    describe("resetActivityTimer", () => {
        it("should clear existing timer before setting new one", () => {
            const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

            stateMachine.resetTimer = setTimeout(() => {}, 1000);
            stateMachine.resetActivityTimer();

            expect(clearTimeoutSpy).toHaveBeenCalled();
        });

        it("should set new timer that calls resetToNeutral", () => {
            const resetToNeutralSpy = jest.spyOn(
                stateMachine,
                "resetToNeutral",
            );

            stateMachine.resetActivityTimer();
            jest.advanceTimersByTime(30000); // Advance by 30 seconds

            expect(resetToNeutralSpy).toHaveBeenCalled();
        });

        it("should not call resetToNeutral before timeout", () => {
            const resetToNeutralSpy = jest.spyOn(
                stateMachine,
                "resetToNeutral",
            );

            stateMachine.resetActivityTimer();
            jest.advanceTimersByTime(29999); // Advance by just under 30 seconds

            expect(resetToNeutralSpy).not.toHaveBeenCalled();
        });
    });

    describe("resetToNeutral", () => {
        it("should reset all states to default values", () => {
            // Set non-default states first
            stateMachine.currentEmotion = Emotion.HAPPY;
            stateMachine.currentAnimation = Animation.DANCING;
            stateMachine.currentAudio = "http://example.com/audio.mp3";

            stateMachine.resetToNeutral();

            expect(stateMachine.currentEmotion).toBe(Emotion.NEUTRAL);
            expect(stateMachine.currentAnimation).toBe(Animation.NONE);
            expect(stateMachine.currentAudio).toBeNull();
        });

        it("should emit state_reset event with current states", () => {
            const emitSpy = jest.spyOn(stateMachine, "emit");

            stateMachine.resetToNeutral();

            expect(emitSpy).toHaveBeenCalledWith("state_reset", {
                emotion: Emotion.NEUTRAL,
                animation: Animation.NONE,
            });
            expect(mockLogger.info).toHaveBeenCalledWith(
                "Reset to neutral due to inactivity",
            );
        });
    });

    describe("Enum Validations", () => {
        // Helper function to get all getter values from a class
        const getEnumValues = (enumClass) => {
            return Object.getOwnPropertyNames(enumClass)
                .filter((prop) => {
                    const descriptor = Object.getOwnPropertyDescriptor(
                        enumClass,
                        prop,
                    );
                    return descriptor && typeof descriptor.get === "function";
                })
                .map((prop) => enumClass[prop]);
        };

        it("should have all required Emotion states", () => {
            const emotionValues = getEnumValues(Emotion);
            expect(emotionValues).toContain("neutral");
            expect(emotionValues).toContain("happy");
            expect(emotionValues).toContain("sad");
            expect(emotionValues).toContain("angry");
            expect(emotionValues).toContain("surprised");
        });

        it("should have all required Animation states", () => {
            const animationValues = getEnumValues(Animation);
            expect(animationValues).toContain("none");
            expect(animationValues).toContain("silly_dancing");
            expect(animationValues).toContain("angry");
            expect(animationValues).toContain("neutral");
            expect(animationValues).toContain("look_left");
            expect(animationValues).toContain("look_right");
        });

        it("should have all required LookDirections", () => {
            const lookDirectionValues = getEnumValues(LookDirections);
            expect(lookDirectionValues).toContain("forward");
            expect(lookDirectionValues).toContain("up");
            expect(lookDirectionValues).toContain("down");
            expect(lookDirectionValues).toContain("left");
            expect(lookDirectionValues).toContain("right");
        });
    });

    describe("Integration Tests", () => {
        it("should maintain state through multiple changes until timeout", () => {
            // Set initial states
            stateMachine.setEmotion(Emotion.HAPPY);
            stateMachine.setAnimation(Animation.DANCING);
            stateMachine.setAudio("http://example.com/audio.mp3");

            // Verify states are set
            expect(stateMachine.currentEmotion).toBe(Emotion.HAPPY);
            expect(stateMachine.currentAnimation).toBe(Animation.DANCING);
            expect(stateMachine.currentAudio).toBe(
                "http://example.com/audio.mp3",
            );

            // Advance time but not to timeout
            jest.advanceTimersByTime(25000);

            // States should still be the same
            expect(stateMachine.currentEmotion).toBe(Emotion.HAPPY);
            expect(stateMachine.currentAnimation).toBe(Animation.DANCING);
            expect(stateMachine.currentAudio).toBe(
                "http://example.com/audio.mp3",
            );

            // Advance to timeout
            jest.advanceTimersByTime(5000);

            // States should be reset
            expect(stateMachine.currentEmotion).toBe(Emotion.NEUTRAL);
            expect(stateMachine.currentAnimation).toBe(Animation.NONE);
            expect(stateMachine.currentAudio).toBeNull();
        });

        it("should reset timer when any state changes", () => {
            stateMachine.setEmotion(Emotion.HAPPY);
            jest.advanceTimersByTime(25000); // Almost at timeout

            stateMachine.setAnimation(Animation.DANCING); // Should reset timer
            jest.advanceTimersByTime(25000); // Not enough for new timeout

            // States should still be maintained
            expect(stateMachine.currentEmotion).toBe(Emotion.HAPPY);
            expect(stateMachine.currentAnimation).toBe(Animation.DANCING);
        });
    });
});
