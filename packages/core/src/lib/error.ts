/* eslint-disable @typescript-eslint/no-explicit-any */

export class MarbleError extends Error {
  static text = 'MarbleError';

  constructor(messageData?: Record<string, string>) {
    super('');

    const ctor = this.constructor as typeof MarbleError;

    this.message = messageData
      ? Object.keys(messageData).reduce(
          (t, key) => t.replace(`\${${key}}`, messageData[key]),
          ctor.text,
        )
      : ctor.text;
  }
}
