/** A default type for any source event */
export type MarbleSourceEventType = unknown;

export enum MarbleSourceEventKind {
  Noop,
  Start,
  Closed,
  Value,
  Move,
}

export type MarbleSourceEvent<T = MarbleSourceEventType> =
  | MarbleSourceNoopEvent
  | MarbleSourceStartEvent
  | MarbleSourceClosedEvent
  | MarbleSourceValueEvent<T>
  | MarbleSourceMoveEvent<T>;

export class MarbleSourceNoopEvent {
  kind: MarbleSourceEventKind.Noop = MarbleSourceEventKind.Noop;
}

export class MarbleSourceStartEvent {
  kind: MarbleSourceEventKind.Start = MarbleSourceEventKind.Start;
  constructor(public time: number) {}
}

export class MarbleSourceClosedEvent {
  kind: MarbleSourceEventKind.Closed = MarbleSourceEventKind.Closed;
  constructor(public time: number) {}
}

export class MarbleSourceValueEvent<T = MarbleSourceEventType> {
  kind: MarbleSourceEventKind.Value = MarbleSourceEventKind.Value;
  constructor(public time: number, public value: T) {}
}

export class MarbleSourceMoveEvent<T = MarbleSourceEventType> {
  kind: MarbleSourceEventKind.Move = MarbleSourceEventKind.Move;
  constructor(
    public event: MarbleSourceValueEvent<T>,
    public oldTime: number,
  ) {}
}
