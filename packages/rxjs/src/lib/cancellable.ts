import { Cancellable } from '@rx-marbles/core';
import { Subscription } from 'rxjs';

export class RxjsCancellable implements Cancellable {
  constructor(private subscription: Subscription) {}

  cancel(): void {
    this.subscription.unsubscribe();
  }
}
