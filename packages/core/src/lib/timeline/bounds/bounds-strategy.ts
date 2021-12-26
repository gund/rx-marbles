import { MarbleInputs } from '../../operator';
import { MarbleTimelineBounds } from './bounds';

export interface MarbleTimelineBoundsStrategy {
  getBounds(inputs: MarbleInputs): MarbleTimelineBounds;
}
