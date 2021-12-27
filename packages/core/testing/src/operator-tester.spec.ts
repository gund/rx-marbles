import {
  IdentityMarbleOperatorFactory,
  MarbleOperatorTester,
} from '@rx-marbles/core/testing';

describe('MarbleOperatorTester', () => {
  it('should assert output events from input events', () => {
    const operatorFactory = new IdentityMarbleOperatorFactory();
    const operatorTester = new MarbleOperatorTester({
      operatorFactory,
      inputs: { letters: { name: 'Letters' } },
    });

    operatorTester.emitInputs({ letters: '^-(a)--(b)-(c)X' });

    operatorTester.expectOutput('^-(a)--(b)-(c)X');
  });
});
