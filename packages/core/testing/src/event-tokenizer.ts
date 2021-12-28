import { MarbleError } from '@rx-marbles/core';

export interface MarbleEventTokens {
  Frame: string;
  Start: string;
  Closed: string;
  ValueStart: string;
  ValueEnd: string;
  GroupStart: string;
  GroupEnd: string;
  // Reverse char lookups
  [char: string]: string;
}

export class MarbleEventTokenizer implements Iterable<MarbleEventToken> {
  protected charToToken: Record<string, () => FrameMarbleEventToken> = {
    [this.tokenChars.Frame]: () => this.consumeTokenFrame(),
    [this.tokenChars.Start]: () => this.consumeTokenStart(),
    [this.tokenChars.Closed]: () => this.consumeTokenClosed(),
    [this.tokenChars.ValueStart]: () => this.consumeTokenValueStart(),
    [this.tokenChars.ValueEnd]: () => this.consumeTokenValueEnd(),
    [this.tokenChars.GroupStart]: () => this.consumeTokenGroupStart(),
    [this.tokenChars.GroupEnd]: () => this.consumeTokenGroupEnd(),
  };

  protected currentIndex = 0;
  protected consumedIndex = 0;
  protected advancedBy = 0;

  constructor(
    protected eventsStr: string,
    protected tokenChars: MarbleEventTokens = MarbleEventTokenChar,
  ) {}

  next(): MarbleEventToken | undefined {
    if (this.currentIndex >= this.eventsStr.length) {
      return undefined;
    }

    try {
      return this.consumeToken();
    } catch (error) {
      throw new InputEventTokenizerError({
        error: String(error),
        input:
          error instanceof EventTokenizerError
            ? error.getErroredInput(this.eventsStr)
            : this.eventsStr,
      });
    }
  }

  *[Symbol.iterator](): Iterator<MarbleEventToken, void, void> {
    let token: MarbleEventToken | undefined;

    while ((token = this.next())) {
      yield token;
    }
  }

  protected advanceTo(tokenChar: string): void {
    const start = this.currentIndex;
    const end = this.eventsStr.indexOf(tokenChar, start);

    if (end === -1) {
      throw new ExpectedTokenEventTokenizerError({
        token: tokenChar,
        index: start,
      });
    }

    this.advancedBy = start - this.consumedIndex;
    this.consumedIndex = start;
    this.currentIndex = end;
  }

  protected consumeAdvanced() {
    const value = this.eventsStr.substring(
      this.consumedIndex,
      this.currentIndex,
    );
    this.consumedIndex -= this.advancedBy;
    return value;
  }

  protected consumeToken(): MarbleEventToken {
    const char = this.eventsStr[this.currentIndex];

    if (char in this.charToToken === false) {
      throw new UnexpectedCharEventTokenizerError({
        char: this.eventsStr[this.consumedIndex],
        index: this.consumedIndex,
      });
    }

    const token = this.charToToken[char]();

    this.consumedIndex = this.currentIndex;

    return token;
  }

  protected consumeTokenFrame() {
    this.currentIndex++;
    return new FrameMarbleEventToken(this.getCurrentPos());
  }

  protected consumeTokenStart() {
    this.currentIndex++;
    return new StartMarbleEventToken(this.getCurrentPos());
  }

  protected consumeTokenClosed() {
    this.currentIndex++;
    return new ClosedMarbleEventToken(this.getCurrentPos());
  }

  protected consumeTokenValueStart() {
    this.currentIndex++;
    this.advanceTo(this.tokenChars.ValueEnd);
    return this.consumeToken();
  }

  protected consumeTokenValueEnd() {
    const value = this.consumeAdvanced();

    if (!value) {
      throw new ExpectedValueEventTokenizerError({
        index: this.currentIndex,
      });
    }

    this.currentIndex++;
    return new ValueMarbleEventToken(value, this.getCurrentPos());
  }

  protected consumeTokenGroupStart() {
    this.currentIndex++;
    return new GroupStartMarbleEventToken(this.getCurrentPos());
  }

  protected consumeTokenGroupEnd() {
    this.currentIndex++;
    return new GroupEndMarbleEventToken(this.getCurrentPos());
  }

  protected getCurrentPos(): MarbleEventTokenPos {
    return pos(this.consumedIndex, this.currentIndex);
  }
}

export enum MarbleEventTokenChar {
  Frame = '-',
  Start = '^',
  Closed = 'X',
  ValueStart = '(',
  ValueEnd = ')',
  GroupStart = '{',
  GroupEnd = '}',
}

export interface MarbleEventTokenPos {
  start: number;
  end: number;
}

export function pos(start: number, end: number): MarbleEventTokenPos {
  return { start, end };
}

export class MarbleEventToken {
  constructor(public pos: MarbleEventTokenPos) {}
}

export class FrameMarbleEventToken extends MarbleEventToken {}

export class StartMarbleEventToken extends MarbleEventToken {}

export class ClosedMarbleEventToken extends MarbleEventToken {}

export class GroupStartMarbleEventToken extends MarbleEventToken {}
export class GroupEndMarbleEventToken extends MarbleEventToken {}

export class ValueMarbleEventToken extends MarbleEventToken {
  constructor(public value: string, pos: MarbleEventTokenPos) {
    super(pos);
  }
}

export class EventTokenizerError extends MarbleError {
  static override text = 'EventTokenizerError';

  getErroredInput(input: string) {
    return input;
  }
}

function getErroredInputIndex(this: EventTokenizerError, input: string) {
  const idx = Number(this.messageData?.['index']);
  return `${input.slice(0, idx)}>>>${input.slice(idx)}`;
}

export class InputEventTokenizerError extends EventTokenizerError {
  static override text = '${error} in ${input}';
}

export class UnexpectedCharEventTokenizerError extends EventTokenizerError {
  static override text = 'Unexpected character "${char}" at index ${index}';
  override getErroredInput = getErroredInputIndex;
}

export class ExpectedTokenEventTokenizerError extends EventTokenizerError {
  static override text = 'Expected token "${token}" at index ${index}';
  override getErroredInput = getErroredInputIndex;
}

export class ExpectedValueEventTokenizerError extends EventTokenizerError {
  static override text = 'Expected value at index ${index}';
  override getErroredInput = getErroredInputIndex;
}
