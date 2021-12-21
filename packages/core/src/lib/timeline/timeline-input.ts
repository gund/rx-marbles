import { MarbleSourceEventType, MarbleSourceValueEvent } from '../source';
import { MarbleTimeline } from './timeline';

export interface MarbleTimelineInput<T = MarbleSourceEventType>
  extends MarbleTimeline<T> {
  moveEvent(event: MarbleSourceValueEvent<T>, time: number): void;
}
