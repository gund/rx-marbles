import { SubscribableCallback } from '@rx-marbles/core';
import { TextHost } from './host';

export class StubTextHost implements TextHost {
  private buffer = '';
  private colsSizeCallbacks: SubscribableCallback<number>[] = [];

  print = jest.fn((text: string) => {
    this.buffer += text;
  });

  clear = jest.fn(() => {
    this.buffer = '';
  });

  getColsSize = jest.fn(() => this.colsSize);

  getColsSizeWatcher = jest.fn(() => ({
    subscribe: (cb: SubscribableCallback<number>) => {
      this.colsSizeCallbacks.push(cb);
      return {
        cancel: () => {
          const idx = this.colsSizeCallbacks.indexOf(cb);
          if (idx >= 0) {
            this.colsSizeCallbacks.splice(idx, 1);
          }
        },
      };
    },
  }));

  constructor(public colsSize = 100) {}

  getBuffer(): string {
    return this.buffer;
  }

  setColsSize(colsSize: number) {
    this.colsSize = colsSize;
    this.colsSizeCallbacks.forEach((cb) => cb(colsSize));
  }
}
