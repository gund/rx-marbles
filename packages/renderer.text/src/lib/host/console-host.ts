import { NoopSubscribable, Subscribable } from '@rx-marbles/core';
import { TextHost } from './host';

export type RequiredConsole = Pick<Console, 'log' | 'clear'>;

export class ConsoleTextHost implements TextHost {
  constructor(private console: RequiredConsole, private cols = 100) {}

  print(text: string): void {
    this.console.log(text);
  }

  clear(): void {
    this.console.clear();
  }

  getColsSize(): number {
    return this.cols;
  }

  getColsSizeWatcher(): Subscribable<number> {
    return new NoopSubscribable();
  }
}
