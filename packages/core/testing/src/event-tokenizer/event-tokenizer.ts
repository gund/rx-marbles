import { MarbleEventToken, MarbleEventTokenPos } from './tokens';

export interface MarbleEventTokenizer extends Iterable<MarbleEventToken> {
  next(): MarbleEventToken | undefined;
  getInput(): string;
}

export function pos(start: number, end: number): MarbleEventTokenPos {
  return { start, end };
}
