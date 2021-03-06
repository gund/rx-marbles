import { Cancellable } from '../cancellable';
import { MarbleSource, MarbleSourceCallback } from './source';
import { MarbleSourceEventType } from './source-event';

export class StubMarbleSource<T = MarbleSourceEventType>
  implements MarbleSource<T>
{
  getName = jest.fn().mockReturnValue('StubMarbleSource');
  getType = jest.fn().mockReturnValue('stub type');
  getDescription = jest.fn().mockReturnValue('stub description');
  cancelCb = jest.fn();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  subscribe = jest.fn<Cancellable, [MarbleSourceCallback<T>]>((cb) => ({
    cancel: this.cancelCb,
  }));
}

export class EmitableStubMarbleSource<
  T = MarbleSourceEventType,
> extends StubMarbleSource<T> {
  callbacks = new Set<MarbleSourceCallback<T>>();

  constructor() {
    super();

    this.subscribe = this.subscribe.mockImplementation(
      (cb: MarbleSourceCallback<T>) => this.doSubscribe(cb),
    );
  }

  emit(event: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.callbacks.forEach((cb) => cb(event as any));
  }

  protected doSubscribe(cb: MarbleSourceCallback<T>) {
    this.callbacks.add(cb);

    return {
      cancel: () => this.doCancel(cb),
    };
  }

  protected doCancel(cb: MarbleSourceCallback<T>) {
    this.callbacks.delete(cb);
    this.cancelCb();
  }
}
