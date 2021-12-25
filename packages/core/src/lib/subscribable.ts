import { Cancellable } from './cancellable';

export interface Subscribable<T> {
  subscribe(cb: SubscribableCallback<T>): Cancellable;
}

export type SubscribableCallback<T> = (value: T) => void;
