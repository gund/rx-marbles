import { MarbleInputs } from '@rx-marbles/core';
import {
  MarbleOperatorFactory,
  MarbleOperatorTester,
} from '@rx-marbles/core/testing';
import { DelayMarbleOperator } from './delay';

describe('DelayMarbleOperator', () => {
  class DelayOperatorFactory<T> implements MarbleOperatorFactory<[T]> {
    constructor(private delayTime: number) {}

    create([input]: MarbleInputs<[T]>) {
      return new DelayMarbleOperator(input, this.delayTime);
    }
  }

  it('should add delay to time of input events', () => {
    const operatorFactory = new DelayOperatorFactory(20);
    const mapTester = new MarbleOperatorTester({
      operatorFactory,
      inputs: { letters: { name: 'Letters' } },
      frameTime: 10,
    });

    mapTester.emitInputs({ letters: '^(a)-(b)-(c)-X-' });

    mapTester.expectOutput('--^(a)-(b)-(c)-X');
  });

  it('should clamp delayed time to top bound', () => {
    const operatorFactory = new DelayOperatorFactory(20);
    const mapTester = new MarbleOperatorTester({
      operatorFactory,
      inputs: { letters: { name: 'Letters' } },
      frameTime: 10,
    });

    mapTester.emitInputs({ letters: '-(a)' });

    mapTester.expectOutput('--(a)');
  });

  describe('setDelay() method', () => {
    it('should update the delay time and restart events', () => {
      const operatorFactory = new DelayOperatorFactory(10);
      const mapTester = new MarbleOperatorTester({
        operatorFactory,
        inputs: { letters: { name: 'Letters' } },
        frameTime: 10,
      });

      mapTester.emitInputs({ letters: '-(a)-(b)-(c)-X--' });

      mapTester.getOperator().setDelay(30);

      mapTester.expectOutput('--(a)-{(a)(b)}-{(b)(c)}-{(c)X}-X');
    });
  });
});
