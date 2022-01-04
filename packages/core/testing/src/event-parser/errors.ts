// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { MarbleError } from '@rx-marbles/core';
import { MarbleEventToken } from '../event-tokenizer';

export interface MarbleEventParserErrorData extends Record<string, unknown> {
  token: MarbleEventToken;
  pos: string;
}

export class MarbleEventParserError extends MarbleError<MarbleEventParserErrorData> {
  static override text = 'MarbleEventParserError';

  static getPos(token: MarbleEventToken) {
    return `[${token.pos.start}:${token.pos.end}]`;
  }

  constructor(token: MarbleEventToken, messageData?: Record<string, unknown>) {
    const pos = MarbleEventParserError.getPos(token);
    super({ ...messageData, token, pos });
  }
}

export interface FriendlyMarbleEventParserErrorData
  extends Record<string, unknown> {
  error: MarbleEventParserError;
  input: string;
}

export class FriendlyMarbleEventParserError extends MarbleError<FriendlyMarbleEventParserErrorData> {
  static override text = '${error} in ${input}';

  static getPositionedInput(token: MarbleEventToken, input: string) {
    const { start, end } = token.pos;
    return `
${input.slice(0, start)} ${input.slice(start, end)} ${input.slice(end)}
${' '.repeat(start)}${'^'.repeat(end - start + 2)}${' '.repeat(
      input.length - end,
    )}`;
  }

  constructor({ error, input: inputStr }: FriendlyMarbleEventParserErrorData) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const token = error.messageData!.token;
    const input = FriendlyMarbleEventParserError.getPositionedInput(
      token,
      inputStr,
    );
    super({ error, input });
  }
}

export class UnexpectedTokenMarbleEventParserError extends MarbleEventParserError {
  static override text = 'Unexpected token ${token} at position ${pos}';
}
