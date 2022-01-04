import { FrameMarbleEventToken, MarbleEventTokenPos } from '../tokens';
import {
  MarbleEventTokenGrammar,
  MarbleEventTokenMatchResult,
} from './grammar';
import { matcher } from './matcher';

export class FrameMarbleEventTokenGrammar implements MarbleEventTokenGrammar {
  constructor(public match = matcher.char('-')) {}
  factory(pos: MarbleEventTokenPos, result: MarbleEventTokenMatchResult) {
    return new FrameMarbleEventToken(result.value, pos);
  }
}
