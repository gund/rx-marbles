import { MarbleSourceClosedEvent } from '@rx-marbles/core';
import { CloseMarbleEventToken } from '../../event-tokenizer';
import { UnexpectedTokenMarbleEventParserError } from '../errors';
import {
  TokenMarbleEventParser,
  TokenMarbleEventParserOptions,
  TokenMarbleEventParserResult,
} from './linear-event-parser';

declare module './linear-event-parser' {
  interface LinearMarbleEventParserState {
    isStarted: boolean;
  }
}

export class CloseTokenMarbleEventParser
  implements TokenMarbleEventParser<CloseMarbleEventToken>
{
  getTokenType() {
    return CloseMarbleEventToken;
  }

  initState() {
    return { isStarted: false };
  }

  parseToken({
    token,
    state,
    controller,
  }: TokenMarbleEventParserOptions<CloseMarbleEventToken>): TokenMarbleEventParserResult {
    if (!state.isStarted) {
      throw new UnexpectedTokenMarbleEventParserError(token);
    }

    const event = new MarbleSourceClosedEvent(controller.advanceTime());

    return { event, state: { isStarted: false } };
  }
}
