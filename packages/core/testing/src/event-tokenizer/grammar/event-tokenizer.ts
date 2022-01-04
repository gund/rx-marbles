import {
  EventTokenizerError,
  UnexpectedTokenEventTokenizerError,
  FriendlyEventTokenizerError,
} from '../errors';
import { MarbleEventTokenizer, pos } from '../event-tokenizer';
import { MarbleEventToken } from '../tokens';
import { MarbleEventTokenGrammar } from './grammar';
import { defaultEventTokenGrammar } from './grammar-default';

export class GrammarMarbleEventTokenizer implements MarbleEventTokenizer {
  protected currentIndex = 0;

  constructor(
    protected events: string,
    protected grammar: MarbleEventTokenGrammar[] = defaultEventTokenGrammar,
  ) {}

  getInput(): string {
    return this.events;
  }

  reset() {
    this.currentIndex = 0;
  }

  next(): MarbleEventToken | undefined {
    try {
      return this.tokenize();
    } catch (error) {
      if (error instanceof EventTokenizerError) {
        throw new FriendlyEventTokenizerError({
          error,
          input: error.getInput(this.events),
        });
      } else {
        throw error;
      }
    }
  }

  *[Symbol.iterator](): IterableIterator<MarbleEventToken> {
    let token: MarbleEventToken | undefined;

    while ((token = this.next())) {
      yield token;
    }

    this.reset();
  }

  protected tokenize() {
    if (this.currentIndex >= this.events.length) {
      return;
    }

    const currStr = this.events.substring(this.currentIndex);

    for (const grammar of this.grammar) {
      const matched = grammar.match(currStr);

      if (matched.match.length !== 0) {
        const tokenPos = pos(
          this.currentIndex,
          this.currentIndex + matched.match.length,
        );
        const token = grammar.factory(tokenPos, matched);
        this.currentIndex = tokenPos.end;
        return token;
      }
    }

    throw new UnexpectedTokenEventTokenizerError({
      token: currStr[0],
      index: this.currentIndex,
    });
  }
}
