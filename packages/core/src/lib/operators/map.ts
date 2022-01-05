import {
  AbstractMarbleOperator,
  AbstractMarbleOperatorOptions,
  MarbleSourceEvents,
} from '../operator';
import {
  isTimeMarbleSourceEvent,
  MarbleSourceEvent,
  MarbleSourceEventKind,
  MarbleSourceEventType,
  MarbleSourceValueEvent,
} from '../source';

export class MapMarbleOperator<
  INPUTS extends unknown[] = MarbleSourceEventType[],
  OUTPUT = MarbleSourceEventType,
> extends AbstractMarbleOperator<INPUTS, OUTPUT> {
  constructor(
    private mapFn: (inputs: INPUTS) => OUTPUT,
    options: AbstractMarbleOperatorOptions<INPUTS>,
  ) {
    super(options);
  }

  operator(events: MarbleSourceEvents<INPUTS>): MarbleSourceEvent<OUTPUT>[] {
    const outputEvents = [
      ...events.filter((event) => event?.kind !== MarbleSourceEventKind.Value),
    ];

    const inputs = events.map((event) => {
      if (event?.kind === MarbleSourceEventKind.Value) {
        return event.value;
      }
    }) as INPUTS;
    const hasInputs = inputs.some(Boolean);

    if (hasInputs) {
      const maxValuesTime = Math.max(
        ...events
          .filter((event) => event?.kind === MarbleSourceEventKind.Value)
          .filter(isTimeMarbleSourceEvent)
          .map((event) => event.time),
      );

      const output = this.mapFn(inputs);

      outputEvents.push(
        new MarbleSourceValueEvent(
          Math.min(maxValuesTime, this.getBounds().end),
          output,
        ),
      );
    }

    return outputEvents as MarbleSourceEvent<OUTPUT>[];
  }

  override getName() {
    return 'map';
  }

  override getDescription() {
    return 'Maps the input events to the output events';
  }
}
