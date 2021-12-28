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
  sample,
  scan,
  share,
  Subject,
  switchAll,
  zip,
} from 'rxjs';
import { RxjsCancellable } from './cancellable';
import { inputToObservable } from './input-observable';

export interface RxjsOperatorMeta<INPUTS extends unknown[]> {
  name?: string;
  type?: string;
  description?: string;
  defaultBounds?: MarbleTimelineBounds;
  boundsStrategy?: MarbleTimelineBoundsStrategy;
  eventsMapper?: RxjsMarbleEventsMapper<INPUTS>;
}

export interface RxjsMarbleOperatorFunction<INPUTS extends unknown[], OUTPUT>
  extends OperatorFunction<
    RxjsOperatorInput<INPUTS>,
    RxjsOperatorValueOutput<OUTPUT>
  > {}

export interface RxjsMarbleEventsMapper<INPUTS extends unknown[]>
  extends Function {
  (
    event: MarbleSourceEvent,
    inputs: MarbleSourceEvents<INPUTS>,
  ): MarbleSourceEvent;
}

export interface RxjsOperatorInput<INPUTS extends unknown[]> {
  inputs: INPUTS;
  events: MarbleSourceValueEvents<INPUTS>;
}

export type RxjsOperatorValueOutput<OUTPUT> =
  | OUTPUT
  | MarbleSourceValueEvent<OUTPUT>;

export type MarbleSourceEvents<INPUTS extends unknown[]> = {
  [I in keyof INPUTS]: MarbleSourceEvent<INPUTS[I]>;
};

export type MarbleSourceValueEvents<INPUTS extends unknown[]> = {
  [I in keyof INPUTS]: MarbleSourceValueEvent<INPUTS[I]>;
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
  private restart$ = new Subject<void>();
  private bounds?: MarbleTimelineBounds;
  private eventsMapper = this.operatorMeta?.eventsMapper;

  constructor(
    protected operatorFn: RxjsMarbleOperatorFunction<INPUTS, OUTPUT>,
    private inputs: MarbleInputs<INPUTS>,
    private operatorMeta?: RxjsOperatorMeta<INPUTS>,
  ) {}

  getInputs(): MarbleInputs<INPUTS> {
    return this.inputs;
  }

  getBounds(): MarbleTimelineBounds {
    if (!this.bounds) {
      this.bounds = this.boundsStrategy.getBounds(this.inputs);
    }

    return this.bounds;
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

  protected restartEvents() {
    this.restart$.next();
  }

  private getInputObservables() {
    if (!this.inputObservables) {
      this.inputObservables = this.inputs
        .map(inputToObservable)
        .map((input$) => input$.pipe(share()))
        .map((input$) =>
          merge(
            input$,
            input$.pipe(
              scan(
                (events, event) =>
                  // Clear events on start event
                  event.kind === MarbleSourceEventKind.Start
                    ? [event]
                    : [...events, event],
                [] as MarbleSourceEvent[],
              ),
              sample(this.restart$),
              switchAll(),
            ),
          ),
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
          let event: MarbleSourceEvent<OUTPUT> = new MarbleSourceNoopEvent();

          if (
            inputs.every((input) => input.kind === MarbleSourceEventKind.Start)
          ) {
            event = new MarbleSourceStartEvent(
              Math.max(
                ...inputs.map(
                  (input) => (input as MarbleSourceStartEvent).time,
                ),
              ),
            );
          } else if (
            inputs.every((input) => input.kind === MarbleSourceEventKind.Closed)
          ) {
            event = new MarbleSourceClosedEvent(
              Math.max(
                ...inputs.map(
                  (input) => (input as MarbleSourceClosedEvent).time,
                ),
              ),
            );
          }

          if (this.eventsMapper) {
            event = this.eventsMapper(
              event,
              inputs,
            ) as MarbleSourceEvent<OUTPUT>;
          }

          return event;
        }),
      );

      const sub = merge(output$, events$).subscribe(observer);

      return () => sub.unsubscribe();
    });
  }
}
