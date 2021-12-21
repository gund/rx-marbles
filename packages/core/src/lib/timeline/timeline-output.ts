import { MarbleSourceEventType } from '../source';
import { MarbleTimeline } from './timeline';

export interface MarbleTimelineOutput<T = MarbleSourceEventType>
  extends MarbleTimeline<T> {}
