import { MarbleSource, MarbleSourceEventType } from '../source';

export interface MarbleTimeline<T = MarbleSourceEventType>
  extends MarbleSource<T> {
  getBounds(): MarbleTimelineBounds;
}

export interface MarbleTimelineBounds {
  start: number;
  end: number;
}

export function isSourceTimeline<T>(
  source: MarbleSource<T>,
): source is MarbleTimeline<T> {
  return 'getBounds' in source;
}
