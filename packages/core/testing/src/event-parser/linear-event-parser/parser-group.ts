import { GroupMarbleEventToken } from '../../event-tokenizer';
import { UnexpectedTokenMarbleEventParserError } from '../errors';
import {
  TokenMarbleEventParser,
  TokenMarbleEventParserOptions,
  TokenMarbleEventParserResult,
} from './linear-event-parser';

declare module './linear-event-parser' {
  interface LinearMarbleEventParserState {
    isInGroup: boolean;
    isInValue: boolean;
  }
}

export class GroupTokenMarbleEventParser
  implements TokenMarbleEventParser<GroupMarbleEventToken>
{
  getTokenType() {
    return GroupMarbleEventToken;
  }

  initState() {
    return { isStarted: false, isInValue: false };
  }

  parseToken({
    token,
    state,
    controller,
  }: TokenMarbleEventParserOptions<GroupMarbleEventToken>): TokenMarbleEventParserResult {
    if (state.isInGroup === token.isOpen || state.isInValue) {
      throw new UnexpectedTokenMarbleEventParserError(token);
    }

    if (token.isOpen) {
      controller.pauseTime();
    } else {
      controller.resumeTime();
      controller.advanceTime();
    }

    return { state: { isInGroup: token.isOpen } };
  }
}
