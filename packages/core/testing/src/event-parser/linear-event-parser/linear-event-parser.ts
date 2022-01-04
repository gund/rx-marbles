// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { MarbleSourceEvent } from '@rx-marbles/core';
import { MarbleEventToken, MarbleEventTokenizer } from '../../event-tokenizer';
import {
  FriendlyMarbleEventParserError,
  MarbleEventParserError,
} from '../errors';
import { MarbleEventParser } from '../event-parser';
import { defaultLinearParsers } from './parser-default';

export interface TokenMarbleEventParserOptions<
  TOKEN extends MarbleEventToken = MarbleEventToken,
> {
  token: TOKEN;
  state: LinearMarbleEventParserState;
  controller: LinearMarbleEventParserController;
}

export interface TokenMarbleEventParser<
  TOKEN extends MarbleEventToken = MarbleEventToken,
> {
  getTokenType(): { prototype: TOKEN };
  initState(): Partial<LinearMarbleEventParserState>;
  parseToken(
    options: TokenMarbleEventParserOptions<TOKEN>,
  ): TokenMarbleEventParserResult;
}

export interface TokenMarbleEventParserResult {
  event?: MarbleSourceEvent;
  state?: Partial<LinearMarbleEventParserState>;
}

export interface LinearMarbleEventParserState {
  readonly currentTime: number;
}

export interface LinearMarbleEventParserController {
  advanceTime(): number;
  pauseTime(): void;
  resumeTime(): void;
}

export interface LinearMarbleEventParserOptions {
  frameTime?: number;
  tokenParsers?: TokenMarbleEventParser[];
}

export class LinearMarbleEventParser implements MarbleEventParser {
  protected initialState = { currentTime: 0 };
  protected state = this.getInitialState();
  protected isTimePaused = false;

  protected frameTime = this.options?.frameTime ?? 10;
  protected tokenParsers = this.options?.tokenParsers ?? defaultLinearParsers;

  protected controller: LinearMarbleEventParserController = {
    advanceTime: this.advanceTime.bind(this),
    pauseTime: () => (this.isTimePaused = true),
    resumeTime: () => (this.isTimePaused = false),
  };

  protected parserMap = new Map<
    { prototype: MarbleEventToken },
    TokenMarbleEventParser
  >(
    this.tokenParsers.map((tokenParser) => [
      tokenParser.getTokenType(),
      tokenParser,
    ]),
  );

  constructor(
    protected tokenizer: MarbleEventTokenizer,
    protected options?: LinearMarbleEventParserOptions,
  ) {}

  *getEvents(): IterableIterator<MarbleSourceEvent> {
    this.reset();

    try {
      yield* this.parseTokensFrom(this.tokenizer);
    } catch (error) {
      if (error instanceof MarbleEventParserError) {
        throw new FriendlyMarbleEventParserError({
          error,
          input: this.tokenizer.getInput(),
        });
      } else {
        throw error;
      }
    }
  }

  reset() {
    this.state = this.tokenParsers.reduce(
      (state, tokenParser) => ({ ...tokenParser.initState(), ...state }),
      this.getInitialState(),
    );
  }

  protected *parseTokensFrom(tokenizer: MarbleEventTokenizer) {
    for (const token of tokenizer) {
      const event = this.parseToken(token);

      if (event) {
        yield event;
      }
    }
  }

  protected parseToken(token: MarbleEventToken): MarbleSourceEvent | undefined {
    const result = this.parserMap.get(token.constructor)?.parseToken({
      token,
      state: this.state as LinearMarbleEventParserState,
      controller: this.controller,
    });

    if (result?.state) {
      Object.assign(this.state, result.state);
    }

    return result?.event;
  }

  protected advanceTime() {
    const time = this.state.currentTime;

    if (!this.isTimePaused) {
      this.state.currentTime += this.frameTime;
    }

    return time;
  }

  protected getInitialState() {
    return Object.assign({}, this.initialState);
  }
}
