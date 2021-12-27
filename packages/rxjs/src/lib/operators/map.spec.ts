import {
  MarbleSourceClosedEvent,
  MarbleSourceStartEvent,
  MarbleSourceValueEvent,
} from '@rx-marbles/core';
import { EmitableStubMarbleTimeline } from '@rx-marbles/core/testing';
import { MapMarbleOperator } from './map';

describe('MapMarbleOperator', () => {
  it('should apply map function to input events', () => {
    const callback = jest.fn();
    const input1 = new EmitableStubMarbleTimeline<string>();
    input1.getName.mockReturnValue('Letters');
    input1.getBounds.mockReturnValue({ start: 0, end: 10 });
    const mapCharCodeOperator = new MapMarbleOperator([input1], ([input1]) =>
      input1.charCodeAt(0),
    );

    const sub = mapCharCodeOperator.subscribe(callback);

    input1.emit(new MarbleSourceStartEvent(0));

    input1.emit(new MarbleSourceValueEvent(0, 'a'));
    input1.emit(new MarbleSourceValueEvent(5, 'b'));
    input1.emit(new MarbleSourceValueEvent(7, 'c'));

    input1.emit(new MarbleSourceClosedEvent(10));

    expect(callback).toHaveBeenCalledWith(new MarbleSourceValueEvent(0, 97));
    expect(callback).toHaveBeenCalledWith(new MarbleSourceValueEvent(5, 98));
    expect(callback).toHaveBeenCalledWith(new MarbleSourceValueEvent(7, 99));

    sub.cancel();
  });
});
