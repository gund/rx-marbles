import { MarbleSourceValueEvent } from '@rx-marbles/core';
import { ParenMarbleEventToken } from '../../event-tokenizer';
import { UnexpectedTokenMarbleEventParserError } from '../errors';
import {
  TokenMarbleEventParser,
  TokenMarbleEventParserOptions,
  TokenMarbleEventParserResult,
} from './linear-event-parser';

declare module './linear-event-parser' {
  interface LinearMarbleEventParserState {
    isStarted: boolean;
    isInValue: boolean;
    lastString?: string;
  }
}

export class ParenTokenMarbleEventParser
  implements TokenMarbleEventParser<ParenMarbleEventToken>
{
  getTokenType() {
    return ParenMarbleEventToken;
  }

  initState() {
    return { isStarted: false, isInValue: false };
  }

  parseToken({
    token,
    state,
    controller,
  }: TokenMarbleEventParserOptions<ParenMarbleEventToken>): TokenMarbleEventParserResult {
    if (!state.isStarted || state.isInValue === token.isOpen) {
      throw new UnexpectedTokenMarbleEventParserError(token);
    }

    let event: MarbleSourceValueEvent | undefined;

    if (!token.isOpen) {
      const value = state.lastString;

      if (value === '') {
        throw new UnexpectedTokenMarbleEventParserError(token);
      }

      event = new MarbleSourceValueEvent(controller.advanceTime(), value);
    }

    return { event, state: { isInValue: token.isOpen, lastString: undefined } };
  }
}
