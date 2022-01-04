import { IdentityMarbleOperatorFactory } from './identity-operator';
import { MarbleOperatorTester } from './operator-tester';

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

  it('should dispose after expect', () => {
    const operatorFactory = new IdentityMarbleOperatorFactory();
    const operatorTester = new MarbleOperatorTester({
      operatorFactory,
      inputs: { letters: { name: 'Letters' } },
    });
    jest.spyOn(operatorTester, 'dispose');

    operatorTester.emitInputs({ letters: '^-(a)-X' });

    expect(operatorTester.dispose).not.toHaveBeenCalled();

    operatorTester.expectOutput('^-(a)-X');

    expect(operatorTester.dispose).toHaveBeenCalled();
  });

  it('should NOT dispose after expect when noDisposeAfterExpect set', () => {
    const operatorFactory = new IdentityMarbleOperatorFactory();
    const operatorTester = new MarbleOperatorTester({
      operatorFactory,
      inputs: { letters: { name: 'Letters' } },
      noDisposeAfterExpect: true,
    });
    jest.spyOn(operatorTester, 'dispose');

    operatorTester.emitInputs({ letters: '^-(a)-X' });

    expect(operatorTester.dispose).not.toHaveBeenCalled();

    operatorTester.expectOutput('^-(a)-X');

    expect(operatorTester.dispose).not.toHaveBeenCalled();

    operatorTester.dispose();
  });
});
