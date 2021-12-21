/** A default type for any source event */
export type MarbleSourceEventType = unknown;

export enum MarbleSourceEventKind {
  Start,
  Closed,
  Value,
  Move,
}

export type MarbleSourceEvent<T = MarbleSourceEventType> =
  | MarbleSourceStartEvent
  | MarbleSourceClosedEvent
  | MarbleSourceValueEvent<T>
  | MarbleSourceMoveEvent<T>;

export interface MarbleSourceStartEvent {
  kind: MarbleSourceEventKind.Start;
  time: number;
}

export interface MarbleSourceClosedEvent {
  kind: MarbleSourceEventKind.Closed;
  time: number;
}

export interface MarbleSourceValueEvent<T = MarbleSourceEventType> {
  kind: MarbleSourceEventKind.Value;
  time: number;
  value: T;
}

export interface MarbleSourceMoveEvent<T = MarbleSourceEventType> {
  kind: MarbleSourceEventKind.Move;
  event: MarbleSourceValueEvent<T>;
}
