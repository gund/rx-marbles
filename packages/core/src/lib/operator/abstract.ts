import { Cancellable } from '../cancellable';
import {
  isTimeMarbleSourceEvent,
  MarbleSourceEvent,
  MarbleSourceEventType,
} from '../source';
import { SubscribableCallback } from '../subscribable';
import {
  MarbleTimelineBounds,
  MarbleTimelineBoundsStrategy,
  WidestMarbleTimelineBoundsStrategy,
} from '../timeline';
import { MarbleInput, MarbleInputs } from './input';
import { MarbleOperator } from './operator';

export interface AbstractMarbleOperatorOptions<
  INPUTS extends unknown[] = MarbleSourceEventType[],
> {
  inputs: MarbleInputs<INPUTS>;
  boundsStrategy?: MarbleTimelineBoundsStrategy;
}

export type MarbleSourceEvents<
  INPUTS extends unknown[] = MarbleSourceEventType[],
> = {
  [I in keyof INPUTS]?: MarbleSourceEvent<INPUTS[I]>;
};

interface EventRecord {
  input: MarbleInput;
  event: MarbleSourceEvent;
}

export abstract class AbstractMarbleOperator<
  INPUTS extends unknown[] = MarbleSourceEventType[],
  OUTPUT = MarbleSourceEventType,
> implements MarbleOperator
{
  private bounds?: MarbleTimelineBounds;
  private callbacks = new Set<
    SubscribableCallback<MarbleSourceEvent<OUTPUT>>
  >();
  private eventRecords: EventRecord[] = [];
  private processingScheduled = false;
  private sub?: Cancellable;

  constructor(protected options: AbstractMarbleOperatorOptions<INPUTS>) {}

  abstract operator(
    events: MarbleSourceEvents<INPUTS>,
  ): MarbleSourceEvent<OUTPUT>[];

  getInputs(): MarbleInputs<INPUTS> {
    return this.options.inputs;
  }

  getBounds(): MarbleTimelineBounds {
    if (!this.bounds) {
      this.bounds = this.getBoundsStrategy().getBounds(this.getInputs());
    }

    return this.bounds;
  }

  getName(): string {
    return this.constructor.name;
  }

  getType(): string {
    return '';
  }

  getDescription(): string {
    return '';
  }

  subscribe(cb: SubscribableCallback<MarbleSourceEvent<OUTPUT>>): Cancellable {
    this.callbacks.add(cb);

    this.maybeInitSub();

    return {
      cancel: () => {
        this.callbacks.delete(cb);
        this.maybeCancelSub();
      },
    };
  }

  protected getBoundsStrategy() {
    return (
      this.options.boundsStrategy ??
      new WidestMarbleTimelineBoundsStrategy({ start: 0, end: 100 })
    );
  }

  private maybeInitSub() {
    if (!this.sub) {
      this.sub = this.subscribeToInputs();
    }
  }

  private maybeCancelSub() {
    if (this.sub && this.callbacks.size === 0) {
      this.sub.cancel();
      this.sub = undefined;
    }
  }

  private subscribeToInputs() {
    const sub = new NestedCancellable();

    const inputSubs = this.getInputs().map((input) =>
      input.subscribe((event) => this.handleInputEvent(input, event)),
    );

    inputSubs.forEach((inputSub) => sub.add(inputSub));

    return sub;
  }

  private handleInputEvent(input: MarbleInput, event: MarbleSourceEvent) {
    this.eventRecords.push({ input, event });
    this.scheduleEventsProcessing();
  }

  private scheduleEventsProcessing() {
    if (this.processingScheduled) {
      return;
    }

    this.processingScheduled = true;
    Promise.resolve().then(this.processEvents.bind(this));
  }

  private processEvents() {
    this.processingScheduled = false;

    const eventRecords = this.eventRecords;
    this.eventRecords = [];

    const eventGroups = this.groupEvents(eventRecords);
    const operatorArgs = this.groupsToArgs(eventGroups);

    const outputs = operatorArgs
      .map((operatorArgs) => this.operator(operatorArgs))
      .flat()
      .filter(Boolean);

    outputs.forEach((event) => this.callbacks.forEach((cb) => cb(event)));
  }

  private groupEvents(eventRecords: EventRecord[]) {
    eventRecords.sort((a, b) =>
      isTimeMarbleSourceEvent(a.event) && isTimeMarbleSourceEvent(b.event)
        ? a.event.time - b.event.time
        : 0,
    );

    const { eventGroups } = eventRecords.reduce(
      (state, eventRecord) => {
        if (
          !isTimeMarbleSourceEvent(eventRecord.event) ||
          eventRecord.event.time !== state.time
        ) {
          state.time = isTimeMarbleSourceEvent(eventRecord.event)
            ? eventRecord.event.time
            : state.time;
          state.currentGroup = [];
          state.eventGroups.push(state.currentGroup);
        }
        state.currentGroup.push(eventRecord);
        return state;
      },
      {
        time: -1,
        eventGroups: [] as EventRecord[][],
        currentGroup: [] as EventRecord[],
      },
    );

    return eventGroups;
  }

  private groupsToArgs(eventGroups: EventRecord[][]) {
    const inputs = this.getInputs();

    return eventGroups.map((eventGroup) => {
      const eventIdxs = eventGroup.map((eventRecord) =>
        inputs.indexOf(eventRecord.input),
      );
      const maxIdx = Math.max(...eventIdxs);
      const args = new Array<MarbleSourceEvent | undefined>(maxIdx + 1).fill(
        undefined,
      );
      eventGroup.forEach(
        (eventRecord, i) => (args[eventIdxs[i]] = eventRecord.event),
      );
      return args;
    }) as MarbleSourceEvents<INPUTS>[];
  }
}

class NestedCancellable implements Cancellable {
  private subs: Cancellable[] = [];

  cancel(): void {
    this.subs.forEach((sub) => sub.cancel());
    this.subs = [];
  }

  add(sub: Cancellable): void {
    this.subs.push(sub);
  }
}
