import {
  Cancellable,
  MarbleInputs,
  MarbleOperator,
  MarbleSourceClosedEvent,
  MarbleSourceEvent,
  MarbleSourceEventKind,
  MarbleSourceEventType,
  MarbleSourceNoopEvent,
  MarbleSourceStartEvent,
  MarbleSourceValueEvent,
  MarbleTimelineBounds,
} from '@rx-marbles/core';
import {
  ClosedMarbleEventToken,
  EmitableStubMarbleTimeline,
  GroupEndMarbleEventToken,
  GroupStartMarbleEventToken,
  MarbleEventToken,
  MarbleEventTokenizer,
  StartMarbleEventToken,
  ValueMarbleEventToken,
} from '@rx-marbles/core/testing';

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
  private outptuCallback = jest.fn();
  private subscription?: Cancellable;

  constructor(
    private options: MarbleOperatorTesterOptions<INPUTS, OPERATOR, META>,
  ) {}

  emitInputs(inputsEventsStr: Partial<TestInputEvents<META>>): void {
    this.initOperator();

    const inputTokens = Object.keys(inputsEventsStr)
      .filter((key) => !!inputsEventsStr[key])
      .map((key) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const inputEventsStr = inputsEventsStr[key]!;
        const tokens = this.strToTokens(inputEventsStr);
        return { key, tokens };
      });

    const maxTokens = Math.max(...inputTokens.map((e) => e.tokens.length));
    this.updateBounds(maxTokens);

    inputTokens.forEach((inputEvent) => {
      const input = this.getInput(inputEvent.key);
      const events = this.tokensToEvents(inputEvent.tokens);

      if (this.options.logEvents) {
        console.log(
          `Input events (${inputEvent.key}) (${events.length})`,
          events,
        );
      }

      events.forEach((event) => input.emit(event));
    });
  }

  expectOutput(eventsStr: string): void {
    const expectedEvents = this.strToEvents(eventsStr);
    const actualEvents: MarbleSourceEvent[] =
      this.outptuCallback.mock.calls.map(([event]) => event);

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
    return this.outptuCallback;
  }

  dispose(): void {
    this.subscription?.cancel();
    this.subscription = undefined;
  }

  private initOperator() {
    if (!this.subscription) {
      this.subscription = this.operator.subscribe(this.outptuCallback);
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
    const tokens = Array.from(new MarbleEventTokenizer(eventsStr));
    return this.tokensToEvents(tokens);
  }

  private strToTokens(eventsStr: string) {
    return Array.from(new MarbleEventTokenizer(eventsStr));
  }

  private tokensToEvents(tokens: MarbleEventToken[]) {
    const frameTime = this.getFrameTime();
    let time = 0,
      isInGroup = false;

    return tokens
      .map((token) => {
        let event: MarbleSourceEvent;

        if (token instanceof StartMarbleEventToken) {
          event = new MarbleSourceStartEvent(time);
        } else if (token instanceof ClosedMarbleEventToken) {
          event = new MarbleSourceClosedEvent(time);
        } else if (token instanceof ValueMarbleEventToken) {
          event = new MarbleSourceValueEvent(time, token.value);
        } else {
          event = new MarbleSourceNoopEvent();
        }

        if (token instanceof GroupStartMarbleEventToken) {
          isInGroup = true;
        } else if (token instanceof GroupEndMarbleEventToken) {
          isInGroup = false;
        }

        if (!isInGroup) {
          time += frameTime;
        }

        return event;
      })
      .filter((event) => event.kind !== MarbleSourceEventKind.Noop);
  }

  private getFrameTime() {
    return this.options.frameTime ?? 10;
  }
}
