import {
  MarbleSourceClosedEvent,
  MarbleSourceValueEvent,
} from '@rx-marbles/core';
import { EmitableStubMarbleTimeline } from '@rx-marbles/core/testing';
import { DelayMarbleOperator } from './delay';

describe('DelayMarbleOperator', () => {
  it('should add delay to time of input events', () => {
    const callback = jest.fn();
    const input1 = new EmitableStubMarbleTimeline<string>();
    input1.getName.mockReturnValue('Letters');
    input1.getBounds.mockReturnValue({ start: 0, end: 100 });
    const delayOperator = new DelayMarbleOperator(input1, 10);

    const sub = delayOperator.subscribe(callback);

    input1.emit(new MarbleSourceValueEvent(0, 'a'));
    input1.emit(new MarbleSourceValueEvent(25, 'b'));
    input1.emit(new MarbleSourceValueEvent(50, 'c'));
    input1.emit(new MarbleSourceValueEvent(75, 'd'));
    input1.emit(new MarbleSourceClosedEvent(100));

    expect(callback).toHaveBeenCalledWith(new MarbleSourceValueEvent(10, 'a'));
    expect(callback).toHaveBeenCalledWith(new MarbleSourceValueEvent(35, 'b'));
    expect(callback).toHaveBeenCalledWith(new MarbleSourceValueEvent(60, 'c'));
    expect(callback).toHaveBeenCalledWith(new MarbleSourceValueEvent(85, 'd'));

    sub.cancel();
  });

  it('should clamp delayed time to top bound', () => {
    const callback = jest.fn();
    const input1 = new EmitableStubMarbleTimeline<string>();
    input1.getName.mockReturnValue('Letters');
    input1.getBounds.mockReturnValue({ start: 0, end: 100 });
    const delayOperator = new DelayMarbleOperator(input1, 10);

    const sub = delayOperator.subscribe(callback);

    input1.emit(new MarbleSourceValueEvent(95, 'a'));
    input1.emit(new MarbleSourceClosedEvent(100));

    expect(callback).toHaveBeenCalledWith(new MarbleSourceValueEvent(100, 'a'));

    sub.cancel();
  });

  describe('setDelay() method', () => {
    it('should update the delay time and restart events', () => {
      const callback = jest.fn();
      const input1 = new EmitableStubMarbleTimeline<string>();
      input1.getName.mockReturnValue('Letters');
      input1.getBounds.mockReturnValue({ start: 0, end: 100 });
      const delayOperator = new DelayMarbleOperator(input1, 10);

      const sub = delayOperator.subscribe(callback);

      input1.emit(new MarbleSourceValueEvent(0, 'a'));
      input1.emit(new MarbleSourceValueEvent(25, 'b'));
      input1.emit(new MarbleSourceValueEvent(50, 'c'));
      input1.emit(new MarbleSourceValueEvent(75, 'd'));
      input1.emit(new MarbleSourceClosedEvent(100));

      expect(callback).toHaveBeenCalledTimes(5);

      delayOperator.setDelay(20);

      expect(callback).toHaveBeenCalledTimes(10);
      expect(callback).toHaveBeenCalledWith(
        new MarbleSourceValueEvent(20, 'a'),
      );
      expect(callback).toHaveBeenCalledWith(
        new MarbleSourceValueEvent(45, 'b'),
      );
      expect(callback).toHaveBeenCalledWith(
        new MarbleSourceValueEvent(70, 'c'),
      );
      expect(callback).toHaveBeenCalledWith(
        new MarbleSourceValueEvent(95, 'd'),
      );

      sub.cancel();
    });
  });
});
