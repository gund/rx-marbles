export interface StreamBuffer<T> {
  getData(): T;
}

export interface StreamBufferFactory<T> {
  create(data: T[]): StreamBuffer<T>;
}

export interface StreamController<T> {
  append(data: T): StreamController<T>;
  complete(): CompletedStreamController;
}

export interface CompletedStreamController {}

export interface StreamSource<T> extends Function {
  bufferFactorty: StreamBufferFactory<T>;
  (controller: StreamController<T>): void;
}

export class Stream<T> {
  private data: T[] = [];
  private isCompleted = false;
  private isFlushing = false;
  private flushPromise?: Promise<void>;
  private flush?: () => void;

  protected controller: StreamController<T> = {
    append: (data) => {
      this.append(data);
      return this.controller;
    },
    complete: () => {
      this.complete();
      return {};
    },
  };

  constructor(protected source: StreamSource<T>) {
    Promise.resolve().then(() => this.source.call(null, this.controller));
  }

  async *getData(): AsyncIterableIterator<T> {
    while (!this.isCompleted) {
      this.initPromise();
      await this.flushPromise;
      const data = this.dataToBuffer(this.data).getData();
      this.data = [];

      if (data) {
        yield data;
      }
    }
  }

  private append(data: T) {
    this.data.push(data);
    this.scheduleFlush();
  }

  private complete() {
    this.isCompleted = true;
    this.scheduleFlush();
  }

  private dataToBuffer(data: T[]) {
    return this.source.bufferFactorty.create(data);
  }

  private initPromise() {
    if (!this.flushPromise) {
      this.flushPromise = new Promise((resolve) => {
        this.flush = resolve;
      });
    }
  }

  private scheduleFlush() {
    if (this.isFlushing) {
      return;
    }

    this.isFlushing = true;

    Promise.resolve().then(() => this.doFlush());
  }

  private doFlush() {
    this.isFlushing = false;

    if (this.flush) {
      this.flush();
      this.flushPromise = undefined;
      this.flush = undefined;
    }
  }
}

export class StringStreamBufferFactory implements StreamBufferFactory<string> {
  create(data: string[]): StreamBuffer<string> {
    return new StringStreamBuffer(data.join(''));
  }
}

export class StringStreamBuffer implements StreamBuffer<string> {
  constructor(private data: string) {}

  getData(): string {
    return this.data;
  }
}
