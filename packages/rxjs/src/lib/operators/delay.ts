import { MarbleInput, MarbleSourceValueEvent } from '@rx-marbles/core';
import { map, pipe } from 'rxjs';
import { RxjsMarbleOperator } from '../operator';

export class DelayMarbleOperator<T> extends RxjsMarbleOperator<[T], T> {
  constructor(input: MarbleInput<T>, private delayTime: number) {
    super(
      pipe(
        map(
          ({ events: [event] }) =>
            new MarbleSourceValueEvent(
              Math.min(event.time + this.delayTime, this.getBounds().end),
              event.value,
            ),
        ),
      ),
      [input],
      {
        name: 'delay',
        description: 'Delays input events',
        type: '(a) => (delayed) a',
        eventsMapper: (event) => {
          const newEvent = { ...event };

          if ('time' in event && 'time' in newEvent) {
            newEvent.time = Math.min(
              event.time + this.delayTime,
              this.getBounds().end,
            );
          }

          return newEvent;
        },
      },
    );
  }

  setDelay(delayTime: number) {
    this.delayTime = delayTime;
    this.restartEvents();
  }
}
