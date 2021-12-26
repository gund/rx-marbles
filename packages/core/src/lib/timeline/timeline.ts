import { MarbleSource, MarbleSourceEventType } from '../source';
import { MarbleTimelineBounds } from './bounds';

export interface MarbleTimeline<T = MarbleSourceEventType>
  extends MarbleSource<T> {
  getBounds(): MarbleTimelineBounds;
}

export function isSourceTimeline<T>(
  source: MarbleSource<T>,
): source is MarbleTimeline<T> {
  return 'getBounds' in source;
}
