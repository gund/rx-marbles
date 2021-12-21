import { StubMarbleOperator } from '../operator/operator.stub';
import { BasicMarbleRuntime } from './basic';

describe('BasicMarbleRuntime', () => {
  describe('getOperator() method', () => {
    it('should return operator', () => {
      const operator = new StubMarbleOperator();
      const runtime = new BasicMarbleRuntime(operator);

      expect(runtime.getOperator()).toBe(operator);
    });
  });

  describe('getInputs() method', () => {
    it('should return call from operator.getInputs()', () => {
      const operator = new StubMarbleOperator();
      operator.getInputs.mockReturnValue('inputs');
      const runtime = new BasicMarbleRuntime(operator);

      expect(runtime.getInputs()).toBe('inputs');
    });
  });

  describe('getOutput() method', () => {
    it('should return operator', () => {
      const operator = new StubMarbleOperator();
      const runtime = new BasicMarbleRuntime(operator);

      expect(runtime.getOutput()).toBe(operator);
    });
  });
});
