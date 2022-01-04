import { StringMarbleEventToken } from '../../event-tokenizer';
import {
  TokenMarbleEventParser,
  TokenMarbleEventParserOptions,
  TokenMarbleEventParserResult,
} from './linear-event-parser';

declare module './linear-event-parser' {
  interface LinearMarbleEventParserState {
    lastString?: string;
  }
}

export class StringTokenMarbleEventParser
  implements TokenMarbleEventParser<StringMarbleEventToken>
{
  getTokenType() {
    return StringMarbleEventToken;
  }

  initState() {
    return {};
  }

  parseToken({
    token,
  }: TokenMarbleEventParserOptions<StringMarbleEventToken>): TokenMarbleEventParserResult {
    return { state: { lastString: token.value } };
  }
}
