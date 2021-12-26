import { MarbleInput } from '../../operator';
import { isSourceTimeline } from '../timeline';
import { MarbleTimelineBounds } from './bounds';
import { MarbleTimelineBoundsStrategy } from './bounds-strategy';

/**
 * Get widest bounds from all inputs timeline bounds
 */
export class WidestMarbleTimelineBoundsStrategy
  implements MarbleTimelineBoundsStrategy
{
  constructor(protected defaultBounds: MarbleTimelineBounds) {}

  getBounds(inputs: MarbleInput[]): MarbleTimelineBounds {
    const inputBounds = inputs
      .filter(isSourceTimeline)
      .map((inputTimeline) => inputTimeline.getBounds());

    if (inputBounds.length) {
      return inputBounds.reduce((prevBounds, bounds) => ({
        start: Math.min(prevBounds.start, bounds.start),
        end: Math.max(prevBounds.end, bounds.end),
      }));
    }

    return this.defaultBounds;
  }
}
