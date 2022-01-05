// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import {
  Cancellable,
  MarbleInputs,
  MarbleOperator,
  MarbleSourceEvent,
  MarbleSourceEventKind,
  MarbleSourceEventType,
  MarbleTimelineBounds,
} from '@rx-marbles/core';
import { LinearMarbleEventParser } from './event-parser';
import { GrammarMarbleEventTokenizer } from './event-tokenizer';
import { EmitableStubMarbleTimeline } from './index';

export interface MarbleOperatorTesterOptions<
  INPUTS extends unknown[],
  OPERATOR extends MarbleOperator,
  META extends Record<string, unknown>,
> {
  operatorFactory: MarbleOperatorFactory<INPUTS, OPERATOR>;
  inputs: MarbleOperatorInputMetas<META>;
  bounds?: MarbleTimelineBounds;
  frameTime?: number;
  noDisposeAfterExpect?: boolean;
  logEvents?: boolean;
}

export interface MarbleOperatorFactory<
  INPUTS extends unknown[],
  OPERATOR extends MarbleOperator = MarbleOperator,
> {
  create(inputs: MarbleInputs<INPUTS>): OPERATOR;
}

export type MarbleOperatorInputMetas<META extends Record<string, unknown>> = {
  [I in keyof META]: MarbleOperatorInputMeta;
};

export interface MarbleOperatorInputMeta {
  name: string;
  description?: string;
  type?: string;
}

export type TestInputEvents<META extends Record<string, unknown>> = {
  [I in keyof META]: string;
};

export class MarbleOperatorTester<
  INPUTS extends unknown[] = MarbleSourceEventType[],
  OUTPUT = MarbleSourceEventType,
  OPERATOR extends MarbleOperator = MarbleOperator<INPUTS, OUTPUT>,
  META extends Record<string, unknown> = Record<string, unknown>,
> {
  private bounds = this.options.bounds ?? { start: 0, end: 100 };
  private metaToInput = this.convertMetaToInputs(this.options.inputs);
  private inputs = Object.values(this.metaToInput) as {
    [I in keyof INPUTS]: EmitableStubMarbleTimeline<INPUTS[I]>;
  };
  private operator = this.options.operatorFactory.create(this.inputs);
  private outputCallback = jest.fn();
  private subscription?: Cancellable;

  constructor(
    private options: MarbleOperatorTesterOptions<INPUTS, OPERATOR, META>,
  ) {}

  async emitInputs(
    inputsEventsStr: Partial<TestInputEvents<META>>,
  ): Promise<void> {
    this.initOperator();

    const inputTokens = Object.keys(inputsEventsStr)
      .filter((input) => !!inputsEventsStr[input])
      .map((input) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const inputEventsStr = inputsEventsStr[input]!;
        const tokens = this.strToTokens(inputEventsStr);
        return { input, tokens, eventsStr: inputEventsStr };
      });

    this.updateBounds(Math.max(...inputTokens.map((e) => e.tokens.length)));

    const inputEvents = inputTokens.map((inputToken) => ({
      input: inputToken.input,
      events: this.tokensToEvents(inputToken.eventsStr),
    }));

    const events = this.groupEventsByTime(inputEvents);

    if (this.options.logEvents) {
      console.log(`Input events (${events.length})`, events);
    }

    events.forEach((event) => this.getInput(event.input).emit(event.event));
  }

  expectOutput(eventsStr: string): void {
    const expectedEvents = this.strToEvents(eventsStr);
    const actualEvents: MarbleSourceEvent[] =
      this.outputCallback.mock.calls.map(([event]) => event);

    if (this.options.logEvents) {
      console.log(`Expected events (${expectedEvents.length})`, expectedEvents);
      console.log(`Output events (${actualEvents.length})`, actualEvents);
    }

    expectedEvents.forEach((expectedEvent) =>
      expect(actualEvents).toContainEqual(expectedEvent),
    );

    if (!this.options.noDisposeAfterExpect) {
      this.dispose();
    }
  }

  getInput(name: keyof META): EmitableStubMarbleTimeline {
    return this.metaToInput[name as string];
  }

  getOperator(): OPERATOR {
    return this.operator;
  }

  getOutputCallback(): jest.Mock {
    return this.outputCallback;
  }

  dispose(): void {
    this.subscription?.cancel();
    this.subscription = undefined;
  }

  private initOperator() {
    if (!this.subscription) {
      this.subscription = this.operator.subscribe(this.outputCallback);
    }
  }

  private updateBounds(maxEvents: number) {
    if (!this.options.bounds) {
      this.bounds.end = maxEvents * this.getFrameTime();
    }
  }

  private convertMetaToInputs(metas: MarbleOperatorInputMetas<META>) {
    return Object.keys(metas).reduce(
      (obj, key) => ({
        ...obj,
        [key]: this.convertMetaToInput(metas[key]),
      }),
      {} as Record<string, EmitableStubMarbleTimeline>,
    );
  }

  private convertMetaToInput(
    meta: MarbleOperatorInputMeta,
  ): EmitableStubMarbleTimeline {
    const input = new EmitableStubMarbleTimeline();

    input.getName.mockReturnValue(meta.name);
    input.getBounds.mockReturnValue(this.bounds);
    input.getDescription.mockReturnValue(meta.description);
    input.getType.mockReturnValue(meta.type);

    return input;
  }

  private strToEvents(eventsStr: string): MarbleSourceEvent[] {
    return this.tokensToEvents(eventsStr);
  }

  private strToTokens(eventsStr: string) {
    return Array.from(new GrammarMarbleEventTokenizer(eventsStr));
  }

  private tokensToEvents(eventsStr: string): MarbleSourceEvent[] {
    const frameTime = this.getFrameTime();
    const eventsTokenizer = new GrammarMarbleEventTokenizer(eventsStr);
    const eventsParser = new LinearMarbleEventParser(eventsTokenizer, {
      frameTime,
    });
    const events = Array.from(eventsParser.getEvents());

    return events.filter((event) => event.kind !== MarbleSourceEventKind.Noop);
  }

  private groupEventsByTime(
    inputEvents: { input: string; events: MarbleSourceEvent[] }[],
  ) {
    return inputEvents
      .reduce(
        (allEvents, { input, events }) => [
          ...allEvents,
          ...events.map((event) => ({ input, event })),
        ],
        [] as { input: string; event: MarbleSourceEvent<unknown> }[],
      )
      .sort(({ event: eventA }, { event: eventB }) =>
        'time' in eventA && 'time' in eventB ? eventA.time - eventB.time : 0,
      );
  }

  private getFrameTime() {
    return this.options.frameTime ?? 10;
  }
}
