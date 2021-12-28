/* eslint-disable @typescript-eslint/no-explicit-any */

export class MarbleError extends Error {
  static text = 'MarbleError';

  constructor(protected messageData?: Record<string, unknown>) {
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
