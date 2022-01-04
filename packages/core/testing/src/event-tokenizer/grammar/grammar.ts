import { MarbleEventToken, MarbleEventTokenPos } from '../tokens';

export interface MarbleEventTokenGrammar<
  MATCH extends MarbleEventTokenMatchResult = MarbleEventTokenMatchResult,
> {
  match(value: string): MATCH;
  factory(pos: MarbleEventTokenPos, match: MATCH): MarbleEventToken;
}

export type MarbleEventTokenGrammarMatcher<
  MATCH extends MarbleEventTokenMatchResult = MarbleEventTokenMatchResult,
> = MarbleEventTokenGrammar<MATCH>['match'];

export interface MarbleEventTokenMatchResult {
  match: string;
  value: string;
}
