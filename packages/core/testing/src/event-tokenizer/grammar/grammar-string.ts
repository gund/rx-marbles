import { MarbleEventTokenPos, StringMarbleEventToken } from '../tokens';
import {
  MarbleEventTokenGrammar,
  MarbleEventTokenMatchResult,
} from './grammar';
import { matcher } from './matcher';

export class StringMarbleEventTokenGrammar implements MarbleEventTokenGrammar {
  constructor(public match = matcher.regex(/([a-z0-9]+)/i)) {}
  factory(pos: MarbleEventTokenPos, result: MarbleEventTokenMatchResult) {
    return new StringMarbleEventToken(result.value, result.match, pos);
  }
}
