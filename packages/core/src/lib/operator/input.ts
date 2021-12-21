import { MarbleSource, MarbleSourceEventType } from '../source';
import { MarbleTimelineInput } from '../timeline';

export type MarbleInput<T = MarbleSourceEventType> =
  | MarbleTimelineInput<T>
  | MarbleSource<T>;

export type MarbleInputs<INPUTS extends unknown[] = MarbleSourceEventType[]> = {
  [I in keyof INPUTS]: MarbleInput<INPUTS[I]>;
};
