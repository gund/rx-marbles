import {
  Cancellable,
  isMarbleSourceEvent,
  MarbleInputs,
  MarbleOperator,
  MarbleSourceClosedEvent,
  MarbleSourceEvent,
  MarbleSourceEventKind,
  MarbleSourceNoopEvent,
  MarbleSourceStartEvent,
  MarbleSourceValueEvent,
  MarbleTimelineBounds,
  MarbleTimelineBoundsStrategy,
  SubscribableCallback,
  WidestMarbleTimelineBoundsStrategy,
} from '@rx-marbles/core';
import {
  combineLatest,
  map,
  merge,
  Observable,
  OperatorFunction,
  partition,
  zip,
} from 'rxjs';
import { RxjsCancellable } from './cancellable';
import { inputToObservable } from './input-observable';

export interface RxjsOperatorMeta {
  name?: string;
  type?: string;
  description?: string;
  defaultBounds?: MarbleTimelineBounds;
  boundsStrategy?: MarbleTimelineBoundsStrategy;
}

export interface RxjsMarbleOperatorFunction<INPUTS extends unknown[], OUTPUT>
  extends OperatorFunction<
    RxjsOperatorInput<INPUTS>,
    RxjsOperatorOutput<OUTPUT>
  > {}

export interface RxjsOperatorInput<INPUTS extends unknown[]> {
  inputs: INPUTS;
  events: MarbleSourceEvents<INPUTS>;
}

export type RxjsOperatorOutput<OUTPUT> =
  | OUTPUT
  | MarbleSourceValueEvent<OUTPUT>;

export type MarbleSourceEvents<INPUTS extends unknown[]> = {
  [I in keyof INPUTS]: MarbleSourceEvent<INPUTS[I]>;
};

export type MarbleInputObservables<INPUTS extends unknown[]> = {
  [I in keyof INPUTS]: Observable<MarbleSourceEvent<INPUTS[I]>>;
};

export class RxjsMarbleOperator<INPUTS extends unknown[], OUTPUT>
  implements MarbleOperator<INPUTS, OUTPUT>
{
  private static defaultBounds: MarbleTimelineBounds = { start: 0, end: 100 };

  private boundsStrategy =
    this.operatorMeta?.boundsStrategy ??
    new WidestMarbleTimelineBoundsStrategy(
      this.operatorMeta?.defaultBounds ?? RxjsMarbleOperator.defaultBounds,
    );

  private inputObservables?: MarbleInputObservables<INPUTS>;

  constructor(
    protected operatorFn: RxjsMarbleOperatorFunction<INPUTS, OUTPUT>,
    private inputs: MarbleInputs<INPUTS>,
    private operatorMeta?: RxjsOperatorMeta,
  ) {}

  getInputs(): MarbleInputs<INPUTS> {
    return this.inputs;
  }

  getBounds(): MarbleTimelineBounds {
    return this.boundsStrategy.getBounds(this.inputs);
  }

  getName(): string {
    return this.operatorMeta?.name ?? this.operatorFn.name;
  }

  getType(): string {
    return this.operatorMeta?.type ?? '';
  }

  getDescription(): string {
    return this.operatorMeta?.description ?? '';
  }

  subscribe(cb: SubscribableCallback<MarbleSourceEvent<OUTPUT>>): Cancellable {
    const inputs$ = combineLatest<MarbleSourceEvents<INPUTS>>(
      this.getInputObservables(),
    );
    const output$ = inputs$.pipe(this.applyOperator.bind(this));

    const subscription = output$.subscribe(cb);

    return new RxjsCancellable(subscription);
  }

  private getInputObservables() {
    if (!this.inputObservables) {
      this.inputObservables = this.inputs.map(
        inputToObservable,
      ) as MarbleInputObservables<INPUTS>;
    }

    return this.inputObservables;
  }

  private applyOperator(
    inputs$: Observable<MarbleSourceEvents<INPUTS>>,
  ): Observable<MarbleSourceEvent<OUTPUT>> {
    return new Observable((observer) => {
      const [values$, nonValues$] = partition(inputs$, (inputs) =>
        inputs.every((input) => input.kind === MarbleSourceEventKind.Value),
      );

      const output$ = zip(
        values$,
        values$.pipe(
          map(
            (values) =>
              ({
                inputs: values.map(
                  (value) => (value as MarbleSourceValueEvent).value,
                ),
                events: values,
              } as RxjsOperatorInput<INPUTS>),
          ),
          this.operatorFn,
        ),
      ).pipe(
        map(([values, output]) => {
          if (isMarbleSourceEvent(output)) {
            return output;
          }

          return new MarbleSourceValueEvent(
            Math.max(
              ...values.map((value) => (value as MarbleSourceValueEvent).time),
            ),
            output,
          );
        }),
      );

      const events$ = nonValues$.pipe(
        map((inputs) => {
          if (
            inputs.every((input) => input.kind === MarbleSourceEventKind.Start)
          ) {
            return new MarbleSourceStartEvent(
              Math.max(
                ...inputs.map(
                  (input) => (input as MarbleSourceStartEvent).time,
                ),
              ),
            );
          }

          if (
            inputs.every((input) => input.kind === MarbleSourceEventKind.Closed)
          ) {
            return new MarbleSourceClosedEvent(
              Math.max(
                ...inputs.map(
                  (input) => (input as MarbleSourceClosedEvent).time,
                ),
              ),
            );
          }

          return new MarbleSourceNoopEvent();
        }),
      );

      const sub = merge(output$, events$).subscribe(observer);

      return () => sub.unsubscribe();
    });
  }
}
