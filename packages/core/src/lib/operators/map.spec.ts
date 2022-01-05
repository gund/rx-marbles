import { EmitableStubMarbleSource } from '@rx-marbles/core/testing';
import {
  MarbleSourceClosedEvent,
  MarbleSourceStartEvent,
  MarbleSourceValueEvent,
} from '../source';
import { MapMarbleOperator } from './map';

describe('MapMarbleOperator', () => {
  it('should call map function with value inputs', async () => {
    const callback = jest.fn();
    const mapFn = jest.fn<string, []>().mockReturnValue('mapped');
    const input1 = new EmitableStubMarbleSource();
    const input2 = new EmitableStubMarbleSource();
    const operator = new MapMarbleOperator({
      inputs: [input1, input2],
      mapFn,
    });

    const sub = operator.subscribe(callback);

    expect(mapFn).not.toHaveBeenCalled();

    input1.emit(new MarbleSourceValueEvent(1, 'a'));
    await input2.emit(new MarbleSourceValueEvent(1, 'b'));

    expect(mapFn).toHaveBeenNthCalledWith(1, ['a', 'b']);
    expect(callback).toHaveBeenNthCalledWith(
      1,
      new MarbleSourceValueEvent(1, 'mapped'),
    );

    sub.cancel();
  });

  it('should NOT call map function with non value inputs', async () => {
    const callback = jest.fn();
    const mapFn = jest.fn<string, []>().mockReturnValue('mapped');
    const input1 = new EmitableStubMarbleSource();
    const input2 = new EmitableStubMarbleSource();
    const operator = new MapMarbleOperator({
      inputs: [input1, input2],
      mapFn,
    });

    const sub = operator.subscribe(callback);

    input1.emit(new MarbleSourceStartEvent(1));
    await input2.emit(new MarbleSourceClosedEvent(2));

    expect(mapFn).not.toHaveBeenCalled();
    expect(callback).toHaveBeenNthCalledWith(1, new MarbleSourceStartEvent(1));
    expect(callback).toHaveBeenNthCalledWith(2, new MarbleSourceClosedEvent(2));

    sub.cancel();
  });
});
