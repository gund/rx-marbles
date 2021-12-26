import { MarbleInput, MarbleSourceEvent } from '@rx-marbles/core';
import { Observable } from 'rxjs';

export function inputToObservable<T>(
  input: MarbleInput<T>,
): Observable<MarbleSourceEvent<T>> {
  return new Observable((observer) => {
    const subscription = input.subscribe((value) => observer.next(value));
    return () => subscription.cancel();
  });
}
