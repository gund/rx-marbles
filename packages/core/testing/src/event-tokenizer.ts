import { MarbleError } from '@rx-marbles/core';

export interface MarbleEventTokens {
  Frame: string;
  Start: string;
  Closed: string;
  ValueStart: string;
  ValueEnd: string;
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

    return this.consumeToken();
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
        index: String(start),
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
        index: String(this.consumedIndex),
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
        index: String(this.currentIndex),
      });
    }

    this.currentIndex++;
    return new ValueMarbleEventToken(value, this.getCurrentPos());
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

export class ValueMarbleEventToken extends MarbleEventToken {
  constructor(public value: string, pos: MarbleEventTokenPos) {
    super(pos);
  }
}

export class EventTokenizerError extends MarbleError {
  static override text = 'EventTokenizerError';
}

export class UnexpectedCharEventTokenizerError extends EventTokenizerError {
  static override text = 'Unexpected character "${char}" at index ${index}';
}

export class ExpectedTokenEventTokenizerError extends EventTokenizerError {
  static override text = 'Expected token "${token}" at index ${index}';
}

export class ExpectedValueEventTokenizerError extends EventTokenizerError {
  static override text = 'Expected value at index ${index}';
}
