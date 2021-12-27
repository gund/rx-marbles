import {
  Cancellable,
  MarbleInputs,
  MarbleOperator,
  MarbleSourceClosedEvent,
  MarbleSourceEvent,
  MarbleSourceEventType,
  MarbleSourceNoopEvent,
  MarbleSourceStartEvent,
  MarbleSourceValueEvent,
  MarbleTimeline,
  MarbleTimelineBounds,
} from '@rx-marbles/core';
import {
  ClosedMarbleEventToken,
  EmitableStubMarbleTimeline,
  MarbleEventToken,
  MarbleEventTokenizer,
  StartMarbleEventToken,
  ValueMarbleEventToken,
} from '@rx-marbles/core/testing';

export interface MarbleOperatorTesterOptions<
  INPUTS extends unknown[],
  OUTPUT,
  META extends Record<string, unknown>,
> {
  operatorFactory: MarbleOperatorFactory<INPUTS, OUTPUT>;
  inputs: MarbleOperatorInputMetas<META>;
  bounds?: MarbleTimelineBounds;
  frameTime?: number;
  noDisposeAfterExpect?: boolean;
}

export interface MarbleOperatorFactory<INPUTS extends unknown[], OUTPUT> {
  create(inputs: MarbleInputs<INPUTS>): MarbleOperator<INPUTS, OUTPUT>;
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
    private options: MarbleOperatorTesterOptions<INPUTS, OUTPUT, META>,
  ) {}

  emitInputs(inputsEventsStr: Partial<TestInputEvents<META>>): void {
    this.initOperator();

    Object.keys(inputsEventsStr)
      .filter((key) => !!inputsEventsStr[key])
      .forEach((key) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const inputEventsStr = inputsEventsStr[key]!;
        const input = this.metaToInput[key];
        const tokens = this.strToTokens(inputEventsStr);

        this.updateBounds(input, tokens.length);

        const events = this.tokensToEvents(tokens, input);

        events.forEach((event) => input.emit(event));
      });
  }

  expectOutput(eventsStr: string): void {
    const events = this.strToEvents(eventsStr, this.operator);

    events.forEach((event) =>
      expect(this.outptuCallback).toHaveBeenCalledWith(event),
    );

    if (!this.options.noDisposeAfterExpect) {
      this.dispose();
    }
  }

  getInput(name: keyof META): EmitableStubMarbleTimeline {
    return this.metaToInput[name as string];
  }

  getOperator() {
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

  private updateBounds(input: EmitableStubMarbleTimeline, eventsCount: number) {
    if (this.options.bounds) {
      return;
    }

    const frameTime = this.getFrameTime(eventsCount);

    input.getBounds.mockReturnValue({
      start: 0,
      end: frameTime * eventsCount,
    });
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

  private strToEvents(
    eventsStr: string,
    timeline?: MarbleTimeline,
  ): MarbleSourceEvent[] {
    const tokens = this.strToTokens(eventsStr);
    return this.tokensToEvents(tokens, timeline);
  }

  private strToTokens(eventsStr: string) {
    return Array.from(new MarbleEventTokenizer(eventsStr));
  }

  private tokensToEvents(
    tokens: MarbleEventToken[],
    timeline?: MarbleTimeline,
  ) {
    const frameTime = this.getFrameTime(tokens.length, timeline?.getBounds());
    let time = 0;

    return tokens.map((token) => {
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

      time += frameTime;

      return event;
    });
  }

  private getFrameTime(eventsCount: number, bounds?: MarbleTimelineBounds) {
    return bounds
      ? Math.ceil(Math.abs(bounds.end - bounds.start) / eventsCount)
      : this.options.frameTime ?? 10;
  }
}
