import {
  EmitableStubMarbleSource,
  StubMarbleSource,
} from '../source/source.stub';
import { MarbleOperator } from './operator';

export class StubMarbleOperator
  extends StubMarbleSource
  implements MarbleOperator
{
  getInputs = jest.fn();
  getBounds = jest.fn();
}

export class EmitableStubMarbleOperator
  extends EmitableStubMarbleSource
  implements MarbleOperator
{
  getInputs = jest.fn();
  getBounds = jest.fn();
}
