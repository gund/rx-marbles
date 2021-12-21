import { Cancellable } from '../cancellable';
import { MarbleSourceEvent, MarbleSourceEventType } from './source-event';

export interface MarbleSource<T = MarbleSourceEventType> {
  getName(): string;
  getType(): string;
  getDescription(): string;
  subscribe(cb: MarbleSourceCallback<T>): Cancellable;
}

export type MarbleSourceCallback<T = MarbleSourceEventType> = (
  event: MarbleSourceEvent<T>,
) => void;
