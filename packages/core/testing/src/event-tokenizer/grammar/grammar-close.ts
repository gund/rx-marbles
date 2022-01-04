import { MarbleEventTokenPos, CloseMarbleEventToken } from '../tokens';
import {
  MarbleEventTokenGrammar,
  MarbleEventTokenMatchResult,
} from './grammar';
import { matcher } from './matcher';

export class CloseMarbleEventTokenGrammar implements MarbleEventTokenGrammar {
  constructor(public match = matcher.char('X')) {}
  factory(pos: MarbleEventTokenPos, result: MarbleEventTokenMatchResult) {
    return new CloseMarbleEventToken(result.value, pos);
  }
}
