import { EmitableStubMarbleSource } from '@rx-marbles/core/testing';
import { MarbleSourceValueEvent } from '../source';
import { AbstractMarbleOperator } from './abstract';

describe('AbstractMarbleOperator', () => {
  class StubAbstractMarbleOperator extends AbstractMarbleOperator {
    operator = jest.fn();
  }

  it('should NOT call operator without subscription', async () => {
    const input1 = new EmitableStubMarbleSource();
    const input2 = new EmitableStubMarbleSource();
    const operator = new StubAbstractMarbleOperator({
      inputs: [input1, input2],
    });

    input1.emit(new MarbleSourceValueEvent(1, 'input11'));
    await input2.emit(new MarbleSourceValueEvent(2, 'input22'));

    expect(operator.operator).not.toHaveBeenCalled();
  });

  it('should call operator with inputs and callback with output', async () => {
    const callback = jest.fn();
    const input1 = new EmitableStubMarbleSource();
    const input2 = new EmitableStubMarbleSource();
    const operator = new StubAbstractMarbleOperator({
      inputs: [input1, input2],
    });
    operator.operator.mockReturnValue('output');

    const sub = operator.subscribe(callback);

    expect(operator.operator).not.toHaveBeenCalled();

    await input1.emit(new MarbleSourceValueEvent(1, 'input11'));
    expect(operator.operator).toHaveBeenNthCalledWith(1, [
      new MarbleSourceValueEvent(1, 'input11'),
    ]);
    expect(callback).toHaveBeenNthCalledWith(1, 'output');

    await input2.emit(new MarbleSourceValueEvent(2, 'input22'));
    expect(operator.operator).toHaveBeenNthCalledWith(2, [
      undefined,
      new MarbleSourceValueEvent(2, 'input22'),
    ]);
    expect(callback).toHaveBeenNthCalledWith(2, 'output');

    input1.emit(new MarbleSourceValueEvent(3, 'input13'));
    await input2.emit(new MarbleSourceValueEvent(3, 'input23'));
    expect(operator.operator).toHaveBeenNthCalledWith(3, [
      new MarbleSourceValueEvent(3, 'input13'),
      new MarbleSourceValueEvent(3, 'input23'),
    ]);
    expect(callback).toHaveBeenNthCalledWith(3, 'output');

    input1.emit(new MarbleSourceValueEvent(4, 'input14'));
    await input2.emit(new MarbleSourceValueEvent(5, 'input25'));
    expect(operator.operator).toHaveBeenNthCalledWith(4, [
      new MarbleSourceValueEvent(4, 'input14'),
    ]);
    expect(operator.operator).toHaveBeenNthCalledWith(5, [
      undefined,
      new MarbleSourceValueEvent(5, 'input25'),
    ]);
    expect(callback).toHaveBeenNthCalledWith(4, 'output');
    expect(callback).toHaveBeenNthCalledWith(5, 'output');

    sub.cancel();
  });

  it('should NOT call operator and callback after cancelling', async () => {
    const callback = jest.fn();
    const input1 = new EmitableStubMarbleSource();
    const input2 = new EmitableStubMarbleSource();
    const operator = new StubAbstractMarbleOperator({
      inputs: [input1, input2],
    });

    const sub = operator.subscribe(callback);

    input1.emit(new MarbleSourceValueEvent(1, 'input11'));
    await input2.emit(new MarbleSourceValueEvent(2, 'input22'));

    sub.cancel();

    operator.operator.mockClear();
    callback.mockClear();

    input1.emit(new MarbleSourceValueEvent(3, 'input13'));
    await input2.emit(new MarbleSourceValueEvent(4, 'input24'));

    expect(operator.operator).not.toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalled();
  });

  it('should call many callbacks', async () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const input1 = new EmitableStubMarbleSource();
    const operator = new StubAbstractMarbleOperator({
      inputs: [input1],
    });
    operator.operator.mockReturnValue('output');

    const sub1 = operator.subscribe(callback1);
    const sub2 = operator.subscribe(callback2);

    await input1.emit(new MarbleSourceValueEvent(1, 'input11'));

    expect(callback1).toHaveBeenNthCalledWith(1, 'output');
    expect(callback2).toHaveBeenNthCalledWith(1, 'output');

    sub1.cancel();
    sub2.cancel();
  });

  it('should NOT call cancelled callbacks', async () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const input1 = new EmitableStubMarbleSource();
    const operator = new StubAbstractMarbleOperator({
      inputs: [input1],
    });
    operator.operator.mockReturnValue('output');

    const sub1 = operator.subscribe(callback1);
    const sub2 = operator.subscribe(callback2);

    await input1.emit(new MarbleSourceValueEvent(1, 'input11'));

    expect(callback1).toHaveBeenNthCalledWith(1, 'output');
    expect(callback2).toHaveBeenNthCalledWith(1, 'output');

    sub1.cancel();

    await input1.emit(new MarbleSourceValueEvent(2, 'input12'));

    expect(callback1).not.toHaveBeenNthCalledWith(2, 'output');
    expect(callback2).toHaveBeenNthCalledWith(2, 'output');

    sub2.cancel();
  });
});
