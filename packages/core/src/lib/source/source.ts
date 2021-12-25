import { Subscribable, SubscribableCallback } from '../subscribable';
import { MarbleSourceEvent, MarbleSourceEventType } from './source-event';

export interface MarbleSource<T = MarbleSourceEventType>
  extends Subscribable<MarbleSourceEvent<T>> {
  getName(): string;
  getType(): string;
  getDescription(): string;
}

export type MarbleSourceCallback<T = MarbleSourceEventType> =
  SubscribableCallback<MarbleSourceEvent<T>>;
