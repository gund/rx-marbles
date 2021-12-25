import { Subscribable } from '@rx-marbles/core';

export interface TextHost {
  print(text: string): void;
  clear(): void;
  getColsSize(): number;
  getColsSizeWatcher(): Subscribable<number>;
}
