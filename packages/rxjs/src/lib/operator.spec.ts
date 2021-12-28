import {
  MarbleSourceClosedEvent,
  MarbleSourceEventType,
  MarbleSourceMoveEvent,
  MarbleSourceNoopEvent,
  MarbleSourceStartEvent,
  MarbleSourceValueEvent,
} from '@rx-marbles/core';
import {
  EmitableStubMarbleSource,
  EmitableStubMarbleTimeline,
} from '@rx-marbles/core/testing';
import { map } from 'rxjs';
import {
  RxjsMarbleOperator,
  RxjsMarbleOperatorFunction,
  RxjsOperatorInput,
  RxjsOperatorValueOutput,
} from './operator';

describe('RxjsMarbleOperator', () => {
  class StubOperatorFn {
    fn = jest
      .fn<
        RxjsOperatorValueOutput<MarbleSourceEventType>,
        [RxjsOperatorInput<MarbleSourceEventType[]>]
      >()
      .mockReturnValue(this.outputValue);

    constructor(
      private outputValue?: RxjsOperatorValueOutput<MarbleSourceEventType>,
    ) {}

    getOperator() {
      const stubOperatorFn: RxjsMarbleOperatorFunction<
        MarbleSourceEventType[],
        MarbleSourceEventType
      > = (source$) => source$.pipe(map((inputs) => this.fn(inputs)));

      return stubOperatorFn;
    }
  }

  function setup() {
    const callback = jest.fn();
    const input1 = new EmitableStubMarbleTimeline();
    const input2 = new EmitableStubMarbleTimeline();

    return { callback, input1, input2 };
  }

  describe('operator function', () => {
    it('should be called when all inputs emit at least one value', () => {
      const { callback, input1, input2 } = setup();
      const operatorFn = new StubOperatorFn();
      const operator = new RxjsMarbleOperator(operatorFn.getOperator(), [
        input1,
        input2,
      ]);

      const sub = operator.subscribe(callback);

      expect(operatorFn.fn).not.toHaveBeenCalled();

      input1.emit(new MarbleSourceValueEvent(0, 'value1'));

      expect(operatorFn.fn).not.toHaveBeenCalled();

      input2.emit(new MarbleSourceValueEvent(1, 'value2'));

      expect(operatorFn.fn).toHaveBeenCalledWith({
        inputs: ['value1', 'value2'],
        events: [
          new MarbleSourceValueEvent(0, 'value1'),
          new MarbleSourceValueEvent(1, 'value2'),
        ],
      });

      sub.cancel();
    });

    it('should be called when any inputs emits value', () => {
      const { callback, input1, input2 } = setup();
      const operatorFn = new StubOperatorFn();
      const operator = new RxjsMarbleOperator(operatorFn.getOperator(), [
        input1,
        input2,
      ]);

      const sub = operator.subscribe(callback);

      input1.emit(new MarbleSourceValueEvent(0, 'value1'));
      input2.emit(new MarbleSourceValueEvent(0, 'value2'));

      expect(operatorFn.fn).toHaveBeenCalledWith({
        inputs: ['value1', 'value2'],
        events: [
          new MarbleSourceValueEvent(0, 'value1'),
          new MarbleSourceValueEvent(0, 'value2'),
        ],
      });

      input1.emit(new MarbleSourceValueEvent(1, 'value3'));
      expect(operatorFn.fn).toHaveBeenCalledWith({
        inputs: ['value3', 'value2'],
        events: [
          new MarbleSourceValueEvent(1, 'value3'),
          new MarbleSourceValueEvent(0, 'value2'),
        ],
      });

      input2.emit(new MarbleSourceValueEvent(2, 'value4'));
      expect(operatorFn.fn).toHaveBeenCalledWith({
        inputs: ['value3', 'value4'],
        events: [
          new MarbleSourceValueEvent(1, 'value3'),
          new MarbleSourceValueEvent(2, 'value4'),
        ],
      });

      input1.emit(new MarbleSourceValueEvent(3, 'value5'));
      input2.emit(new MarbleSourceValueEvent(3, 'value6'));
      expect(operatorFn.fn).toHaveBeenCalledWith({
        inputs: ['value5', 'value6'],
        events: [
          new MarbleSourceValueEvent(3, 'value5'),
          new MarbleSourceValueEvent(3, 'value6'),
        ],
      });

      sub.cancel();
    });

    it('should emit value output when is called', () => {
      const { callback, input1, input2 } = setup();
      const operatorFn = new StubOperatorFn('output');
      const operator = new RxjsMarbleOperator(operatorFn.getOperator(), [
        input1,
        input2,
      ]);

      const sub = operator.subscribe(callback);

      expect(callback).not.toHaveBeenCalled();

      input1.emit(new MarbleSourceValueEvent(0, 'value1'));

      expect(callback).not.toHaveBeenCalled();

      input2.emit(new MarbleSourceValueEvent(1, 'value2'));

      expect(callback).toHaveBeenCalledWith(
        new MarbleSourceValueEvent(1, 'output'),
      );

      sub.cancel();
    });

    it('should emit output with custom event when is called', () => {
      const { callback, input1, input2 } = setup();
      const customEvent = new MarbleSourceValueEvent(2, 'custom');
      const operatorFn = new StubOperatorFn(customEvent);
      const operator = new RxjsMarbleOperator(operatorFn.getOperator(), [
        input1,
        input2,
      ]);

      const sub = operator.subscribe(callback);

      expect(callback).not.toHaveBeenCalled();

      input1.emit(new MarbleSourceValueEvent(0, 'value1'));

      expect(callback).not.toHaveBeenCalled();

      input2.emit(new MarbleSourceValueEvent(1, 'value2'));

      expect(callback).toHaveBeenCalledWith(customEvent);

      sub.cancel();
    });

    it('should emit start/closed events when all are same', () => {
      const { callback, input1, input2 } = setup();
      const operatorFn = new StubOperatorFn();
      const operator = new RxjsMarbleOperator(operatorFn.getOperator(), [
        input1,
        input2,
      ]);

      const sub = operator.subscribe(callback);

      input1.emit(new MarbleSourceStartEvent(0));
      input2.emit(new MarbleSourceStartEvent(1));

      expect(callback).toHaveBeenCalledWith(new MarbleSourceStartEvent(1));

      input1.emit(new MarbleSourceClosedEvent(2));
      input2.emit(new MarbleSourceClosedEvent(3));

      expect(callback).toHaveBeenCalledWith(new MarbleSourceClosedEvent(3));

      sub.cancel();
    });

    it('should emit noop events on other events', () => {
      const { callback, input1, input2 } = setup();
      const operatorFn = new StubOperatorFn();
      const operator = new RxjsMarbleOperator(operatorFn.getOperator(), [
        input1,
        input2,
      ]);

      const sub = operator.subscribe(callback);

      input1.emit(new MarbleSourceNoopEvent());
      input2.emit(new MarbleSourceNoopEvent());

      expect(callback).toHaveBeenCalledWith(new MarbleSourceNoopEvent());

      input1.emit(
        new MarbleSourceMoveEvent(new MarbleSourceValueEvent(1, 'a'), 0),
      );
      input2.emit(
        new MarbleSourceMoveEvent(new MarbleSourceValueEvent(1, 'b'), 0),
      );

      expect(callback).toHaveBeenCalledWith(new MarbleSourceNoopEvent());

      sub.cancel();
    });

    it('should stop emitting output after cancellation', () => {
      const { callback, input1, input2 } = setup();
      const operatorFn = new StubOperatorFn('output');
      const operator = new RxjsMarbleOperator(operatorFn.getOperator(), [
        input1,
        input2,
      ]);

      const sub = operator.subscribe(callback);

      input1.emit(new MarbleSourceValueEvent(0, 'value1'));
      input2.emit(new MarbleSourceValueEvent(0, 'value2'));

      expect(callback).toHaveBeenCalledWith(
        new MarbleSourceValueEvent(0, 'output'),
      );

      sub.cancel();

      input1.emit(new MarbleSourceValueEvent(0, 'value3'));
      input2.emit(new MarbleSourceValueEvent(0, 'value4'));

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('getInputs() method', () => {
    it('should return inputs', () => {
      const { input1, input2 } = setup();
      const operatorFn = new StubOperatorFn();
      const operator = new RxjsMarbleOperator(operatorFn.getOperator(), [
        input1,
        input2,
      ]);

      expect(operator.getInputs()).toEqual([input1, input2]);
    });
  });

  describe('getBounds() method', () => {
    it('should return widest bounds from inputs timeline bounds', () => {
      const { input1, input2 } = setup();
      const operatorFn = new StubOperatorFn();
      const operator = new RxjsMarbleOperator(operatorFn.getOperator(), [
        input1,
        input2,
      ]);
      input1.getBounds.mockReturnValue({ start: 1, end: 2 });
      input2.getBounds.mockReturnValue({ start: 3, end: 4 });

      expect(operator.getBounds()).toEqual({ start: 1, end: 4 });
    });

    it('should return default bounds without inputs timeline bounds', () => {
      const input1 = new EmitableStubMarbleSource();
      const input2 = new EmitableStubMarbleSource();
      const operatorFn = new StubOperatorFn();
      const operator = new RxjsMarbleOperator(operatorFn.getOperator(), [
        input1,
        input2,
      ]);

      expect(operator.getBounds()).toEqual({ start: 0, end: 100 });
    });

    it('should return custome default bounds without inputs timeline bounds', () => {
      const input1 = new EmitableStubMarbleSource();
      const input2 = new EmitableStubMarbleSource();
      const operatorFn = new StubOperatorFn();
      const operator = new RxjsMarbleOperator(
        operatorFn.getOperator(),
        [input1, input2],
        { defaultBounds: { start: 5, end: 6 } },
      );

      expect(operator.getBounds()).toEqual({ start: 5, end: 6 });
    });
  });

  describe('getName() method', () => {
    it('should return name of operator function', () => {
      const operatorFn = new StubOperatorFn();
      const operator = new RxjsMarbleOperator(operatorFn.getOperator(), []);

      expect(operator.getName()).toBe('stubOperatorFn');
    });

    it('should return custom name from meta', () => {
      const operatorFn = new StubOperatorFn();
      const operator = new RxjsMarbleOperator(operatorFn.getOperator(), [], {
        name: 'customName',
      });

      expect(operator.getName()).toBe('customName');
    });
  });

  describe('getType() method', () => {
    it('should return empty type by default', () => {
      const operatorFn = new StubOperatorFn();
      const operator = new RxjsMarbleOperator(operatorFn.getOperator(), []);

      expect(operator.getType()).toBe('');
    });

    it('should return custom type from meta', () => {
      const operatorFn = new StubOperatorFn();
      const operator = new RxjsMarbleOperator(operatorFn.getOperator(), [], {
        type: 'customType',
      });

      expect(operator.getType()).toBe('customType');
    });
  });

  describe('getDescription() method', () => {
    it('should return empty description by default', () => {
      const operatorFn = new StubOperatorFn();
      const operator = new RxjsMarbleOperator(operatorFn.getOperator(), []);

      expect(operator.getDescription()).toBe('');
    });

    it('should return custom description from meta', () => {
      const operatorFn = new StubOperatorFn();
      const operator = new RxjsMarbleOperator(operatorFn.getOperator(), [], {
        description: 'customDesc',
      });

      expect(operator.getDescription()).toBe('customDesc');
    });
  });
});
