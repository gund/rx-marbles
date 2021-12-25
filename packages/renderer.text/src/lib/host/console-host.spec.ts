import { NoopCancellable, NoopSubscribable } from '@rx-marbles/core';
import { ConsoleTextHost, RequiredConsole } from './console-host';

describe('ConsoleTextHost', () => {
  class FakeConsole implements RequiredConsole {
    private buffer = '';

    log = jest.fn((...messages: unknown[]) => {
      this.buffer += `${messages.join('')}\n`;
    });

    clear = jest.fn(() => {
      this.buffer = '';
    });

    getBuffer() {
      return this.buffer;
    }
  }

  describe('print() method', () => {
    it('should call console.log() with messages', () => {
      const console = new FakeConsole();
      const host = new ConsoleTextHost(console);

      expect(console.log).not.toHaveBeenCalled();

      host.print('foo');

      expect(console.log).toHaveBeenCalledWith('foo');
    });
  });

  describe('clear() method', () => {
    it('should call console.clear()', () => {
      const console = new FakeConsole();
      const host = new ConsoleTextHost(console);

      expect(console.clear).not.toHaveBeenCalled();

      host.clear();

      expect(console.clear).toHaveBeenCalled();
    });
  });

  describe('getColsSize() method', () => {
    it('should return cols value', () => {
      const console = new FakeConsole();
      const host = new ConsoleTextHost(console, 20);

      expect(host.getColsSize()).toBe(20);
    });

    it('should return by defaule 100', () => {
      const console = new FakeConsole();
      const host = new ConsoleTextHost(console);

      expect(host.getColsSize()).toBe(100);
    });
  });

  describe('getColsSizeWatcher() method', () => {
    it('should return noop subscribable', () => {
      const console = new FakeConsole();
      const host = new ConsoleTextHost(console);
      const callback = jest.fn();

      const watcher = host.getColsSizeWatcher();

      expect(watcher).toBeInstanceOf(NoopSubscribable);

      const subscription = watcher.subscribe(callback);

      expect(subscription).toBeInstanceOf(NoopCancellable);

      subscription.cancel();

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
