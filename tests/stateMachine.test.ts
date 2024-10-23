import AvatarStateMachine from '../src/models/AvatarStateMachine';

describe('AvatarStateMachine', () => {
  let stateMachine;

  beforeEach(() => {
    stateMachine = new AvatarStateMachine();
  });

  test('should initialize with idle state', () => {
    expect(stateMachine.getState()).toBe('idle');
  });

  test('should transition to a valid state', () => {
    stateMachine.transitionTo('walking');
    expect(stateMachine.getState()).toBe('walking');
  });

  test('should throw an error for invalid state transition', () => {
    expect(() => stateMachine.transitionTo('flying')).toThrow('Invalid state transition to flying');
  });

  test('should track state history', () => {
    stateMachine.transitionTo('walking');
    stateMachine.transitionTo('running');
    expect(stateMachine.getStateHistory()).toEqual(['idle', 'walking']);
  });

  test('should emit stateChange event on valid transition', (done) => {
    stateMachine.on('stateChange', (data) => {
      expect(data.newState).toBe('walking');
      done();
    });
    stateMachine.transitionTo('walking');
  });
});
