import {
  EmitableStubMarbleSource,
  StubMarbleSource,
} from '../source/source.stub';
import { MarbleTimeline } from './timeline';

export class StubMarbleTimeline
  extends StubMarbleSource
  implements MarbleTimeline
{
  getBounds = jest.fn();
}

export class EmitableStubMarbleTimeline
  extends EmitableStubMarbleSource
  implements MarbleTimeline
{
  getBounds = jest.fn();
}
