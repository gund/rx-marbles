import { MarbleRuntime } from './runtime';

export class StubMarbleRuntime implements MarbleRuntime {
  getOperator = jest.fn();
  getInputs = jest.fn();
  getOutput = jest.fn();
}
