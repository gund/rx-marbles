import { FrameMarbleEventToken } from '../../event-tokenizer';
import { UnexpectedTokenMarbleEventParserError } from '../errors';
import {
  TokenMarbleEventParser,
  TokenMarbleEventParserOptions,
  TokenMarbleEventParserResult,
} from './linear-event-parser';

declare module './linear-event-parser' {
  interface LinearMarbleEventParserState {
    isInValue: boolean;
    isInGroup: boolean;
  }
}

export class FrameTokenMarbleEventParser
  implements TokenMarbleEventParser<FrameMarbleEventToken>
{
  getTokenType() {
    return FrameMarbleEventToken;
  }

  initState() {
    return { isInValue: false, isInGroup: false };
  }

  parseToken({
    token,
    state,
    controller,
  }: TokenMarbleEventParserOptions<FrameMarbleEventToken>): TokenMarbleEventParserResult {
    if (state.isInValue || state.isInGroup) {
      throw new UnexpectedTokenMarbleEventParserError(token);
    }

    controller.advanceTime();

    return {};
  }
}
