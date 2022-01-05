import {
  MarbleOperatorFactory,
  MarbleOperatorTester,
} from '@rx-marbles/core/testing';
import { MarbleInputs } from '../operator';
import { MapMarbleOperator } from './map';

describe('MapMarbleOperator', () => {
  class MapOperatorFactory<I extends unknown[], O>
    implements MarbleOperatorFactory<I>
  {
    constructor(private mapFn: (inputs: I) => O) {}

    create(inputs: MarbleInputs<I>) {
      return new MapMarbleOperator(this.mapFn, { inputs });
    }
  }

  it('should apply map function to input events', async () => {
    const operatorFactory = new MapOperatorFactory(
      ([input1, input2]: [string, string]) => input1 + input2,
    );
    const mapTester = new MarbleOperatorTester({
      operatorFactory,
      inputs: {
        letters: { name: 'Letters' },
        numbers: { name: 'Numbers' },
      },
    });

    await mapTester.emitInputs({
      letters: '^(a)-(b)-(c)-X',
      numbers: '^(1)-(2)-(3)-X',
    });

    mapTester.expectOutput('^(a1)-(b2)-(c3)-X');
  });
});
