/* eslint-disable @typescript-eslint/no-explicit-any */

export class MarbleError<
  D extends Record<string, unknown> = Record<string, unknown>,
> extends Error {
  static text = 'MarbleError';

  constructor(public messageData?: D) {
    super('');

    const ctor = this.constructor as typeof MarbleError;

    this.message = messageData
      ? Object.keys(messageData).reduce(
          (t, key) => t.replace(`\${${key}}`, String(messageData[key])),
          ctor.text,
        )
      : ctor.text;
  }
}
