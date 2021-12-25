import { MarbleError } from './error';

describe('MarbleError', () => {
  it('should have default message `MarbleError`', () => {
    const error = new MarbleError();

    expect(error.message).toBe('MarbleError');
  });

  it('should allow to override message statically', () => {
    class CustomError extends MarbleError {
      static override text = 'CustomError';
    }

    const error = new CustomError();

    expect(error.message).toBe('CustomError');
  });

  describe('message data', () => {
    it('should templetize the message using ${}', () => {
      class CustomError extends MarbleError {
        static override text = 'CustomError ${foo} and ${bar}';
        constructor(foo: string, bar: number) {
          super({
            foo,
            bar: String(bar),
          });
        }
      }

      const error = new CustomError('foo', 42);

      expect(error.message).toBe('CustomError foo and 42');
    });
  });
});
