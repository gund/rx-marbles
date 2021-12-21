import { MarbleSource, MarbleSourceCallback } from './source';

export class StubMarbleSource implements MarbleSource {
  getName = jest.fn();
  getType = jest.fn();
  getDescription = jest.fn();
  cancelCb = jest.fn();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  subscribe = jest.fn((cb: MarbleSourceCallback) => ({
    cancel: this.cancelCb,
  }));
}

export class EmitableStubMarbleSource extends StubMarbleSource {
  callbacks = new Set<MarbleSourceCallback>();

  constructor() {
    super();

    this.subscribe = this.subscribe.mockImplementation(
      (cb: MarbleSourceCallback) => {
        this.callbacks.add(cb);

        return {
          cancel: this.cancelCb.mockImplementation(() =>
            this.callbacks.delete(cb),
          ),
        };
      },
    );
  }

  emit(event: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.callbacks.forEach((cb) => cb(event as any));
  }
}
