import { MarbleInputs } from '@rx-marbles/core';
import {
  MarbleOperatorFactory,
  MarbleOperatorTester,
} from '@rx-marbles/core/testing';
import { MapMarbleOperator } from './map';

describe('MapMarbleOperator', () => {
  class MapOperatorFactory<I extends unknown[], O>
    implements MarbleOperatorFactory<I>
  {
    constructor(private mapFn: (inputs: I) => O) {}

    create(inputs: MarbleInputs<I>) {
      return new MapMarbleOperator(inputs, this.mapFn);
    }
  }

  it('should apply map function to input events', () => {
    const operatorFactory = new MapOperatorFactory(([input1]: [string]) =>
      input1.charCodeAt(0).toString(),
    );
    const mapTester = new MarbleOperatorTester({
      operatorFactory,
      inputs: { letters: { name: 'Letters' } },
    });

    mapTester.emitInputs({ letters: '^(a)-(b)-(c)-X' });

    mapTester.expectOutput('^(97)-(98)-(99)-X');
  });
});
