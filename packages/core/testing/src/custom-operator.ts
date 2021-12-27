import {
  Cancellable,
  isSourceTimeline,
  MarbleInput,
  MarbleInputs,
  MarbleOperator,
  MarbleSourceCallback,
  MarbleSourceEvent,
  MarbleSourceEventType,
  MarbleTimelineBounds,
} from '@rx-marbles/core';
import {
  EmitableStubMarbleOperator,
  MarbleOperatorFactory,
} from '@rx-marbles/core/testing';

export interface MarbleOperatorFn extends Function {
  (
    this: CustomMarbleOperator,
    input: MarbleInput,
    event: MarbleSourceEvent,
  ): MarbleSourceEvent;
}

export interface CustomMarbleOperatorOptions {
  operatorFn: MarbleOperatorFn;
  operatorName?: string;
  defaultBounds?: MarbleTimelineBounds;
}

export class CustomMarbleOperator extends EmitableStubMarbleOperator {
  private subs?: Cancellable[];
  private operatorFn = this.options.operatorFn;

  constructor(
    inputs: MarbleInputs,
    private options: CustomMarbleOperatorOptions,
  ) {
    super();
    this.getInputs.mockReturnValue(inputs);
    this.getBounds.mockImplementation(() => this.getBoundsFromInputs(inputs));
    this.getName.mockReturnValue(
      this.options.operatorName ?? this.operatorFn.name,
    );
  }

  protected override doSubscribe(cb: MarbleSourceCallback) {
    this.initSubs();
    return super.doSubscribe(cb);
  }

  protected override doCancel(cb: MarbleSourceCallback) {
    this.cancelSubs();
    super.doCancel(cb);
  }

  private getBoundsFromInputs(inputs: MarbleInputs) {
    return (
      inputs.find(isSourceTimeline)?.getBounds() ??
      this.options.defaultBounds ?? { start: 0, end: 100 }
    );
  }

  private initSubs() {
    if (!this.subs) {
      this.subs = this.getInputs().map((input: MarbleInput) =>
        input.subscribe((event) => this.emit(this.operatorFn(input, event))),
      );
    }
  }

  private cancelSubs() {
    if (this.subs) {
      this.subs.forEach((sub) => sub.cancel());
      this.subs = undefined;
    }
  }
}

export interface CustomMarbleOperatorCtor<
  INPUTS extends unknown[] = MarbleSourceEventType[],
  OUTPUT = MarbleSourceEventType,
> {
  new (
    inputs: MarbleInputs<INPUTS>,
    options: CustomMarbleOperatorOptions,
  ): MarbleOperator<INPUTS, OUTPUT>;
}

export class CustomMarbleOperatorFactory<
  INPUTS extends unknown[] = MarbleSourceEventType[],
  OUTPUT = MarbleSourceEventType,
> implements MarbleOperatorFactory<INPUTS, OUTPUT>
{
  constructor(
    private options: CustomMarbleOperatorOptions,
    private operatorCtor: CustomMarbleOperatorCtor<
      INPUTS,
      OUTPUT
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    > = CustomMarbleOperator as any,
  ) {}

  create(inputs: MarbleInputs<INPUTS>): MarbleOperator<INPUTS, OUTPUT> {
    return new this.operatorCtor(inputs, this.options);
  }
}
