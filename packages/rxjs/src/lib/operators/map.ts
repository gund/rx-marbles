import { MarbleInputs } from '@rx-marbles/core';
import { map, pipe } from 'rxjs';
import { RxjsMarbleOperator } from '../operator';

export class MapMarbleOperator<
  I extends unknown[],
  O,
> extends RxjsMarbleOperator<I, O> {
  constructor(inputs: MarbleInputs<I>, mapFn: (inputs: I) => O) {
    super(
      pipe(
        map((input) => input.inputs),
        map(mapFn),
      ),
      inputs,
      {
        name: 'map',
        description: 'Transforms input events to some another events',
        type: '(a) => b',
      },
    );
  }
}
