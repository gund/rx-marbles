import {
  AbstractMarbleRenderer,
  Cancellable,
  MarbleError,
  MarbleInput,
  MarbleOperator,
  MarbleOutput,
  MarbleRuntime,
  MarbleSourceClosedEvent,
  MarbleSourceEvent,
  MarbleSourceEventKind,
  MarbleSourceMoveEvent,
  MarbleSourceValueEvent,
} from '@rx-marbles/core';
import { TextHost } from './host';
import { moveItemInArray } from './utils';

export interface TextMarbleRendererOptions {
  host: TextHost;
  timelineSeparator?: string;
  edgeSeparator?: string;
}

type MarbleRenderingEvent = MarbleSourceClosedEvent | MarbleSourceValueEvent;

class MarbleOperatorState {
  inputsEvents = new Map<MarbleInput, MarbleRenderingEvent[]>();
  outputEvents: MarbleRenderingEvent[] = [];
  readyToRender = false;

  constructor(public operator: MarbleOperator) {}
}

export class TextMarbleRenderer extends AbstractMarbleRenderer {
  protected host = this.options.host;
  protected timelineSeparator = this.options.timelineSeparator ?? '-';
  protected edgeSeparator = this.options.edgeSeparator ?? '|';
  protected operators = new Map<MarbleOperator, MarbleOperatorState>();

  constructor(private options: TextMarbleRendererOptions) {
    super();
  }

  protected override prepareRuntime(runtime: MarbleRuntime): Set<Cancellable> {
    const operator = runtime.getOperator();
    this.operators.set(operator, new MarbleOperatorState(operator));

    return super.prepareRuntime(runtime);
  }

  protected override disposeRuntime(runtime: MarbleRuntime) {
    this.operators.delete(runtime.getOperator());

    return super.disposeRuntime(runtime);
  }

  protected override doDispose(): void {
    super.doDispose();
    this.operators.clear();
  }

  protected renderInput(
    operator: MarbleOperator,
    input: MarbleInput,
    event: MarbleSourceEvent,
  ): void {
    const state = this.operators.get(operator);

    if (!state) {
      return;
    }

    let inputEvents: MarbleRenderingEvent[];

    if (!state.inputsEvents.has(input)) {
      state.inputsEvents.set(input, (inputEvents = []));
    } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      inputEvents = state.inputsEvents.get(input)!;
    }

    this.processEvent(state, inputEvents, event);
  }

  protected renderOutput(
    operator: MarbleOperator,
    output: MarbleOutput,
    event: MarbleSourceEvent,
  ): void {
    const state = this.operators.get(operator);

    if (!state) {
      return;
    }

    this.processEvent(state, state.outputEvents, event, true);
  }

  private processEvent(
    state: MarbleOperatorState,
    events: MarbleRenderingEvent[],
    event: MarbleSourceEvent,
    isOutput = false,
  ): void {
    switch (event.kind) {
      case MarbleSourceEventKind.Start:
        this.processEventStart(state, events);
        break;
      case MarbleSourceEventKind.Value:
        this.processEventValue(events, event);
        break;
      case MarbleSourceEventKind.Closed:
        this.processEventClosed(state, events, event, isOutput);
        break;
      case MarbleSourceEventKind.Move:
        this.processEventMove(state, events, event);
        break;
    }
  }

  private processEventStart(
    state: MarbleOperatorState,
    events: MarbleRenderingEvent[],
  ) {
    state.readyToRender = false;
    events.splice(0, events.length);
  }

  private processEventValue(
    events: MarbleRenderingEvent[],
    event: MarbleRenderingEvent,
  ) {
    events.push(event);
  }

  private processEventClosed(
    state: MarbleOperatorState,
    events: MarbleRenderingEvent[],
    event: MarbleRenderingEvent,
    isOutput: boolean,
  ) {
    events.push(event);

    if (isOutput) {
      state.readyToRender = true;
      this.doRenderOperator(state);
    }
  }

  private processEventMove(
    state: MarbleOperatorState,
    events: MarbleRenderingEvent[],
    moveEvent: MarbleSourceMoveEvent,
  ) {
    const event = moveEvent.event;
    const currentIdx = events.indexOf(event);
    const currentTime = moveEvent.oldTime;
    const newTime = event.time;
    const moveDirection = newTime - currentTime;
    const increment = moveDirection > 0 ? 1 : -1;
    const startI = currentIdx + increment;
    const endI = moveDirection > 0 ? events.length : -1;
    const timeDiffer = newTime * increment;

    let newIdx = -1;

    for (let i = startI; i !== endI; i += increment) {
      if (events[i].time + timeDiffer <= 0) {
        newIdx = i;
        break;
      }
    }

    if (newIdx === -1) {
      throw new MoveEventError(moveEvent);
    }

    moveItemInArray(events, currentIdx, newIdx);

    this.doRenderOperator(state);
  }

  private doRenderOperator(state: MarbleOperatorState): void {
    if (!state.readyToRender) {
      return;
    }

    const operator = state.operator;
    const inputs = operator.getInputs();
    let rendered = '';

    inputs.forEach((input) => {
      const events = state.inputsEvents.get(input) ?? [];

      rendered += this.getRenderedTimeline(input, events);
    });

    rendered += this.getRenderedTimeline(operator, state.outputEvents);

    this.host.print(rendered);
  }

  private getRenderedTimeline(
    source: MarbleInput | MarbleOutput,
    events: MarbleRenderingEvent[],
  ) {
    const cols = this.host.getColsSize();
    const ES = this.edgeSeparator;
    const name = source.getName();

    const separatorLine = `${ES}${' '.repeat(
      Math.max(cols - ES.length * 2, 0),
    )}${ES}\n`;
    const nameLine = this.getRenderedName(name);
    const eventsLine = this.getRenderedEvents(source, events);

    const timeline = nameLine + eventsLine + separatorLine;

    return timeline;
  }

  private getRenderedName(name: string) {
    const cols = this.host.getColsSize();
    const ES = this.edgeSeparator;

    const fillNameLine = ' '.repeat(
      Math.floor(Math.max(cols - name.length - ES.length * 2, 0) / 2),
    );

    return `${ES}${fillNameLine}${name}${fillNameLine}${ES}\n`;
  }

  private getRenderedEvents(
    source: MarbleInput | MarbleOutput,
    events: MarbleRenderingEvent[],
  ) {
    const cols = this.host.getColsSize();
    const TS = this.timelineSeparator;
    const ES = this.edgeSeparator;
    const gridLength = cols - ES.length * 2;
    const bounds = 'getBounds' in source ? source.getBounds() : undefined;
    const maxTime = bounds ? bounds.end - bounds.start : 1;

    // Tracks overflown chars + rounding errors
    let overflowLength = 0;

    const getEventSeparation = bounds
      ? (
          value: string,
          event: MarbleRenderingEvent,
          prevEvent?: MarbleRenderingEvent,
        ) => {
          const startTime = prevEvent?.time ?? 0;
          const endTime = event.time;
          const deltaTime = endTime - startTime;
          const percent = deltaTime / maxTime;

          const rawLength = gridLength * percent;
          const fullLength = Math.floor(rawLength);

          let length = fullLength - value.length;

          overflowLength -= rawLength - fullLength;

          if (length > 0 && (overflowLength > 1 || overflowLength < -1)) {
            const fullOverflow = Math.round(overflowLength);
            length -= fullOverflow;
            overflowLength -= fullOverflow;
          }

          if (length < 0) {
            overflowLength += Math.abs(length);
            length = 0;
          }

          return TS.repeat(length);
        }
      : () => TS;

    const renderedEvents = events.reduce((line, event, i) => {
      const prevEvent = i > 0 ? events[i - 1] : undefined;
      const value = this.getRenderedEvent(event);
      const separation = getEventSeparation(value, event, prevEvent);

      return `${line}${separation}${value}`;
    }, '');

    const fillEventsPre = bounds
      ? ''
      : TS.repeat(
          Math.floor(Math.max(gridLength - renderedEvents.length, 0) / 2),
        );

    const fillEventsPost = bounds
      ? TS.repeat(Math.max(gridLength - renderedEvents.length, 0))
      : fillEventsPre;

    return `${ES}${fillEventsPre}${renderedEvents}${fillEventsPost}${ES}\n`;
  }

  private getRenderedEvent(event: MarbleRenderingEvent) {
    switch (event.kind) {
      case MarbleSourceEventKind.Value:
        return `(${event.value})`;
      case MarbleSourceEventKind.Closed:
        return 'X';
    }
  }
}

class MoveEventError extends MarbleError {
  static override text =
    "Cannot move event '${value}' from ${oldTime} to ${time}!";

  constructor(event: MarbleSourceMoveEvent) {
    super({
      value: String(event.event.value),
      oldTime: String(event.oldTime),
      time: String(event.event.time),
    });
  }
}
