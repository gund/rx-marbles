import { MarbleSourceEventType } from '../source';
import { MarbleTimelineOutput } from '../timeline';

export type MarbleOutput<T = MarbleSourceEventType> = MarbleTimelineOutput<T>;
