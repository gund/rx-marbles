import { GroupMarbleEventToken, MarbleEventTokenPos } from '../tokens';
import {
  MarbleEventTokenGrammar,
  MarbleEventTokenMatchResult,
} from './grammar';
import { matcher } from './matcher';

export class GroupOpenMarbleEventTokenGrammar
  implements MarbleEventTokenGrammar
{
  constructor(public match = matcher.char('{')) {}
  factory(pos: MarbleEventTokenPos, result: MarbleEventTokenMatchResult) {
    return new GroupMarbleEventToken(true, result.value, pos);
  }
}

export class GroupCloseMarbleEventTokenGrammar
  implements MarbleEventTokenGrammar
{
  constructor(public match = matcher.char('}')) {}
  factory(pos: MarbleEventTokenPos, result: MarbleEventTokenMatchResult) {
    return new GroupMarbleEventToken(false, result.value, pos);
  }
}
