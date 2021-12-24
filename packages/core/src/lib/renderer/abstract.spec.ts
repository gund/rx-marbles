// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import {
  EmitableStubMarbleSource,
  StubMarbleOperator,
  StubMarbleRuntime,
} from '@rx-marbles/core/testing';
import { AbstractMarbleRenderer } from './abstract';

class StubAbstractMarbleRenderer extends AbstractMarbleRenderer {
  renderInput = jest.fn();
  renderOutput = jest.fn();
}

describe('AbstractMarbleRenderer', () => {
  function setup() {
    const runtime = new StubMarbleRuntime();
    const operator = new StubMarbleOperator();
    const input1 = new EmitableStubMarbleSource();
    const input2 = new EmitableStubMarbleSource();
    const output = new EmitableStubMarbleSource();
    runtime.getOperator.mockReturnValue(operator);
    runtime.getInputs.mockReturnValue([input1, input2]);
    runtime.getOutput.mockReturnValue(output);

    return { runtime, operator, input1, input2, output };
  }

  describe('render() method', () => {
    it('should call renderInput() on every input event', () => {
      const renderer = new StubAbstractMarbleRenderer();
      const { runtime, operator, input1, input2 } = setup();

      renderer.render(runtime);

      expect(renderer.renderInput).toHaveBeenCalledTimes(0);

      input1.emit('event1');

      expect(renderer.renderInput).toHaveBeenCalledWith(
        operator,
        input1,
        'event1',
      );

      input2.emit('event2');

      expect(renderer.renderInput).toHaveBeenCalledWith(
        operator,
        input2,
        'event2',
      );

      renderer.dispose();
    });

    it('should call renderOutput() on every output event', () => {
      const renderer = new StubAbstractMarbleRenderer();
      const { runtime, operator, output } = setup();

      renderer.render(runtime);

      expect(renderer.renderOutput).toHaveBeenCalledTimes(0);

      output.emit('event1');

      expect(renderer.renderOutput).toHaveBeenCalledWith(
        operator,
        output,
        'event1',
      );

      output.emit('event2');

      expect(renderer.renderOutput).toHaveBeenCalledWith(
        operator,
        output,
        'event2',
      );

      renderer.dispose();
    });

    it('should cancel inputs and outputs when render cancelled', () => {
      const renderer = new StubAbstractMarbleRenderer();
      const { runtime, input1, input2, output } = setup();

      const render = renderer.render(runtime);

      expect(input1.cancelCb).not.toHaveBeenCalled();
      expect(input2.cancelCb).not.toHaveBeenCalled();
      expect(output.cancelCb).not.toHaveBeenCalled();

      render.cancel();

      expect(input1.cancelCb).toHaveBeenCalledTimes(1);
      expect(input2.cancelCb).toHaveBeenCalledTimes(1);
      expect(output.cancelCb).toHaveBeenCalledTimes(1);

      renderer.dispose();
    });

    it('should not cancel inputs and outputs when another render cancelled', () => {
      const renderer = new StubAbstractMarbleRenderer();
      const { runtime, input1, input2, output } = setup();
      const { runtime: runtime2 } = setup();

      renderer.render(runtime);
      const render = renderer.render(runtime2);

      expect(input1.cancelCb).not.toHaveBeenCalled();
      expect(input2.cancelCb).not.toHaveBeenCalled();
      expect(output.cancelCb).not.toHaveBeenCalled();

      render.cancel();

      expect(input1.cancelCb).not.toHaveBeenCalled();
      expect(input2.cancelCb).not.toHaveBeenCalled();
      expect(output.cancelCb).not.toHaveBeenCalled();

      renderer.dispose();
    });
  });

  describe('dispose() method', () => {
    it('should cancel all inputs and outputs', () => {
      const renderer = new StubAbstractMarbleRenderer();
      const {
        runtime: runtime1,
        input1: input11,
        input2: input12,
        output: output1,
      } = setup();
      const {
        runtime: runtime2,
        input1: input21,
        input2: input22,
        output: output2,
      } = setup();

      renderer.render(runtime1);
      renderer.render(runtime2);

      expect(input11.cancelCb).not.toHaveBeenCalled();
      expect(input12.cancelCb).not.toHaveBeenCalled();
      expect(output1.cancelCb).not.toHaveBeenCalled();
      expect(input21.cancelCb).not.toHaveBeenCalled();
      expect(input22.cancelCb).not.toHaveBeenCalled();
      expect(output2.cancelCb).not.toHaveBeenCalled();

      renderer.dispose();

      expect(input11.cancelCb).toHaveBeenCalled();
      expect(input12.cancelCb).toHaveBeenCalled();
      expect(output1.cancelCb).toHaveBeenCalled();
      expect(input21.cancelCb).toHaveBeenCalled();
      expect(input22.cancelCb).toHaveBeenCalled();
      expect(output2.cancelCb).toHaveBeenCalled();
    });
  });
});
