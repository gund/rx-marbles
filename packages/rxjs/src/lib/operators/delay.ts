import { MarbleInput } from '@rx-marbles/core';
import { map, pipe } from 'rxjs';
import { RxjsMarbleOperator } from '../operator';

export class DelayMarbleOperator<T> extends RxjsMarbleOperator<[T], T> {
  constructor(input: MarbleInput<T>, delayTime: number) {
    super(
      pipe(
        map(({ events: [event] }) => ({
          ...event,
          time: Math.min(event.time + delayTime, this.getBounds().end),
        })),
      ),
      [input],
      {
        name: 'delay',
        description: 'Delays input events',
        type: '(a) => (delayed) a',
      },
    );
  }
}
