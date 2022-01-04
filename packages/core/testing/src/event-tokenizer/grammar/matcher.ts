import { MarbleEventTokenGrammarMatcher } from './grammar';

export const matcher = {
  char(char: string): MarbleEventTokenGrammarMatcher {
    return (input: string) => {
      const value = input[0] === char ? char : '';
      return { match: value, value };
    };
  },
  regex(regex: RegExp): MarbleEventTokenGrammarMatcher {
    return (input: string) => {
      const [match, value] = input.match(regex) || ['', ''];
      return { match, value };
    };
  },
};
