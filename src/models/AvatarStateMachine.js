const EventEmitter = require('events');

class AvatarStateMachine extends EventEmitter {
  constructor() {
    super();
    this.state = 'idle';
    this.validStates = ['idle', 'walking', 'running', 'jumping'];
    this.stateHistory = [];
  }

  transitionTo(newState) {
    if (this.validStates.includes(newState)) {
      this.stateHistory.push(this.state);
      this.state = newState;
      this.emit('stateChange', { newState });
    } else {
      throw new Error(`Invalid state transition to ${newState}`);
    }
  }

  getState() {
    return this.state;
  }

  getStateHistory() {
    return this.stateHistory;
  }
}

module.exports = AvatarStateMachine;
