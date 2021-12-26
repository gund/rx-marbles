import { MarbleSourceEventType } from '../source';
import {
  EmitableStubMarbleSource,
  StubMarbleSource,
} from '../source/source.stub';
import { MarbleTimeline } from './timeline';

export class StubMarbleTimeline<T = MarbleSourceEventType>
  extends StubMarbleSource<T>
  implements MarbleTimeline<T>
{
  getBounds = jest.fn();
}

export class EmitableStubMarbleTimeline<T = MarbleSourceEventType>
  extends EmitableStubMarbleSource<T>
  implements MarbleTimeline<T>
{
  getBounds = jest.fn();
}
