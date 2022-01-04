import { MarbleEventTokenPos, ParenMarbleEventToken } from '../tokens';
import {
  MarbleEventTokenGrammar,
  MarbleEventTokenMatchResult,
} from './grammar';
import { matcher } from './matcher';

export class ParenOpenMarbleEventTokenGrammar
  implements MarbleEventTokenGrammar
{
  constructor(public match = matcher.char('(')) {}
  factory(pos: MarbleEventTokenPos, result: MarbleEventTokenMatchResult) {
    return new ParenMarbleEventToken(true, result.value, pos);
  }
}

export class ParenCloseMarbleEventTokenGrammar
  implements MarbleEventTokenGrammar
{
  constructor(public match = matcher.char(')')) {}
  factory(pos: MarbleEventTokenPos, result: MarbleEventTokenMatchResult) {
    return new ParenMarbleEventToken(false, result.value, pos);
  }
}
