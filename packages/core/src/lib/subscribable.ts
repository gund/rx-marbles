import { Cancellable, NoopCancellable } from './cancellable';

export interface Subscribable<T> {
  subscribe(cb: SubscribableCallback<T>): Cancellable;
}

export type SubscribableCallback<T> = (value: T) => void;

export class NoopSubscribable<T> implements Subscribable<T> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  subscribe(cb: SubscribableCallback<T>): Cancellable {
    return new NoopCancellable();
  }
}
