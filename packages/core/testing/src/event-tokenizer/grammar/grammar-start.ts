import { MarbleEventTokenPos, StartMarbleEventToken } from '../tokens';
import {
  MarbleEventTokenGrammar,
  MarbleEventTokenMatchResult,
} from './grammar';
import { matcher } from './matcher';

export class StartMarbleEventTokenGrammar implements MarbleEventTokenGrammar {
  constructor(public match = matcher.char('^')) {}
  factory(pos: MarbleEventTokenPos, result: MarbleEventTokenMatchResult) {
    return new StartMarbleEventToken(result.value, pos);
  }
}
