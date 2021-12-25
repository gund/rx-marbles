export interface Cancellable {
  cancel(): void;
}

export class NoopCancellable implements Cancellable {
  cancel(): void {
    // noop
  }
}
