import { MarbleSourceStartEvent } from '@rx-marbles/core';
import { StartMarbleEventToken } from '../../event-tokenizer';
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

export class StartTokenMarbleEventParser
  implements TokenMarbleEventParser<StartMarbleEventToken>
{
  getTokenType() {
    return StartMarbleEventToken;
  }

  initState() {
    return { isStarted: false };
  }

  parseToken({
    token,
    state,
    controller,
  }: TokenMarbleEventParserOptions<StartMarbleEventToken>): TokenMarbleEventParserResult {
    if (state.isStarted) {
      throw new UnexpectedTokenMarbleEventParserError(token);
    }

    const event = new MarbleSourceStartEvent(controller.advanceTime());

    return { event, state: { isStarted: true } };
  }
}
