import { MarbleOperator } from './operator';

export class StubMarbleOperator implements MarbleOperator {
  getInputs = jest.fn();
  getBounds = jest.fn();
  getName = jest.fn();
  getType = jest.fn();
  getDescription = jest.fn();
  subscribe = jest.fn();
}
