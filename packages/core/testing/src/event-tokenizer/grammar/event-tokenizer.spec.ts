import {
  FriendlyEventTokenizerError,
  UnexpectedTokenEventTokenizerError,
} from '../errors';
import { pos } from '../event-tokenizer';
import {
  CloseMarbleEventToken,
  FrameMarbleEventToken,
  GroupMarbleEventToken,
  ParenMarbleEventToken,
  StartMarbleEventToken,
  StringMarbleEventToken,
} from '../tokens';
import { GrammarMarbleEventTokenizer } from './event-tokenizer';
import { MarbleEventTokenGrammar } from './grammar';
import { CloseMarbleEventTokenGrammar } from './grammar-close';
import { FrameMarbleEventTokenGrammar } from './grammar-frame';
import {
  GroupCloseMarbleEventTokenGrammar,
  GroupOpenMarbleEventTokenGrammar,
} from './grammar-group';
import {
  ParenCloseMarbleEventTokenGrammar,
  ParenOpenMarbleEventTokenGrammar,
} from './grammar-paren';
import { StartMarbleEventTokenGrammar } from './grammar-start';
import { StringMarbleEventTokenGrammar } from './grammar-string';
import { matcher } from './matcher';

describe('GrammarMarbleEventTokenizer', () => {
  it('should return undefined when empty', () => {
    const tokenizer = new GrammarMarbleEventTokenizer('');
    expect(tokenizer.next()).toBeUndefined();
  });

  it('should tokenize frame event from -', () => {
    const tokenizer = new GrammarMarbleEventTokenizer('-');
    expect(tokenizer.next()).toEqual(new FrameMarbleEventToken('-', pos(0, 1)));
  });

  it('should tokenize start event from ^', () => {
    const tokenizer = new GrammarMarbleEventTokenizer('^');
    expect(tokenizer.next()).toEqual(new StartMarbleEventToken('^', pos(0, 1)));
  });

  it('should tokenize close event from X', () => {
    const tokenizer = new GrammarMarbleEventTokenizer('X');
    expect(tokenizer.next()).toEqual(new CloseMarbleEventToken('X', pos(0, 1)));
  });

  it('should tokenize paren event from (', () => {
    const tokenizer = new GrammarMarbleEventTokenizer('(');
    expect(tokenizer.next()).toEqual(
      new ParenMarbleEventToken(true, '(', pos(0, 1)),
    );
  });

  it('should tokenize paren event from )', () => {
    const tokenizer = new GrammarMarbleEventTokenizer(')');
    expect(tokenizer.next()).toEqual(
      new ParenMarbleEventToken(false, ')', pos(0, 1)),
    );
  });

  it('should tokenize group event from {', () => {
    const tokenizer = new GrammarMarbleEventTokenizer('{');
    expect(tokenizer.next()).toEqual(
      new GroupMarbleEventToken(true, '{', pos(0, 1)),
    );
  });

  it('should tokenize group event from }', () => {
    const tokenizer = new GrammarMarbleEventTokenizer('}');
    expect(tokenizer.next()).toEqual(
      new GroupMarbleEventToken(false, '}', pos(0, 1)),
    );
  });

  it('should tokenize string event from chars', () => {
    const tokenizer = new GrammarMarbleEventTokenizer('chars');
    expect(tokenizer.next()).toEqual(
      new StringMarbleEventToken('chars', 'chars', pos(0, 5)),
    );
  });

  it('should tokenize string event from chars case insensetive', () => {
    const tokenizer = new GrammarMarbleEventTokenizer('ChArS');
    expect(tokenizer.next()).toEqual(
      new StringMarbleEventToken('ChArS', 'ChArS', pos(0, 5)),
    );
  });

  it('should tokenize string event from numbers', () => {
    const tokenizer = new GrammarMarbleEventTokenizer('0123456789');
    expect(tokenizer.next()).toEqual(
      new StringMarbleEventToken('0123456789', '0123456789', pos(0, 10)),
    );
  });

  it('should tokenize string event from chars and numbers', () => {
    const tokenizer = new GrammarMarbleEventTokenizer('chars1234chars');
    expect(tokenizer.next()).toEqual(
      new StringMarbleEventToken(
        'chars1234chars',
        'chars1234chars',
        pos(0, 14),
      ),
    );
  });

  it('should return undefined when done', () => {
    const tokenizer = new GrammarMarbleEventTokenizer('-');
    expect(tokenizer.next()).toEqual(new FrameMarbleEventToken('-', pos(0, 1)));
    expect(tokenizer.next()).toBeUndefined();
  });

  it('should throw on unexpected token', () => {
    const tokenizer = new GrammarMarbleEventTokenizer('?');
    const error = new UnexpectedTokenEventTokenizerError({
      token: '?',
      index: '0',
    });

    expect(() => tokenizer.next()).toThrowError(
      new FriendlyEventTokenizerError({
        error,
        input: error.getInput('?'),
      }),
    );
  });

  it('should tokenize all event tokens', () => {
    const tokenizer = new GrammarMarbleEventTokenizer('^(a)-{(B)(cD)}-(4)-X');

    expect(tokenizer.next()).toEqual(new StartMarbleEventToken('^', pos(0, 1)));
    expect(tokenizer.next()).toEqual(
      new ParenMarbleEventToken(true, '(', pos(1, 2)),
    );
    expect(tokenizer.next()).toEqual(
      new StringMarbleEventToken('a', 'a', pos(2, 3)),
    );
    expect(tokenizer.next()).toEqual(
      new ParenMarbleEventToken(false, ')', pos(3, 4)),
    );
    expect(tokenizer.next()).toEqual(new FrameMarbleEventToken('-', pos(4, 5)));
    expect(tokenizer.next()).toEqual(
      new GroupMarbleEventToken(true, '{', pos(5, 6)),
    );
    expect(tokenizer.next()).toEqual(
      new ParenMarbleEventToken(true, '(', pos(6, 7)),
    );
    expect(tokenizer.next()).toEqual(
      new StringMarbleEventToken('B', 'B', pos(7, 8)),
    );
    expect(tokenizer.next()).toEqual(
      new ParenMarbleEventToken(false, ')', pos(8, 9)),
    );
    expect(tokenizer.next()).toEqual(
      new ParenMarbleEventToken(true, '(', pos(9, 10)),
    );
    expect(tokenizer.next()).toEqual(
      new StringMarbleEventToken('cD', 'cD', pos(10, 12)),
    );
    expect(tokenizer.next()).toEqual(
      new ParenMarbleEventToken(false, ')', pos(12, 13)),
    );
    expect(tokenizer.next()).toEqual(
      new GroupMarbleEventToken(false, '}', pos(13, 14)),
    );
    expect(tokenizer.next()).toEqual(
      new FrameMarbleEventToken('-', pos(14, 15)),
    );
    expect(tokenizer.next()).toEqual(
      new ParenMarbleEventToken(true, '(', pos(15, 16)),
    );
    expect(tokenizer.next()).toEqual(
      new StringMarbleEventToken('4', '4', pos(16, 17)),
    );
    expect(tokenizer.next()).toEqual(
      new ParenMarbleEventToken(false, ')', pos(17, 18)),
    );
    expect(tokenizer.next()).toEqual(
      new FrameMarbleEventToken('-', pos(18, 19)),
    );
    expect(tokenizer.next()).toEqual(
      new CloseMarbleEventToken('X', pos(19, 20)),
    );
    expect(tokenizer.next()).toEqual(undefined);
  });

  it('should tokenize events with custom token grammar', () => {
    const customGrammar: MarbleEventTokenGrammar[] = [
      new FrameMarbleEventTokenGrammar(matcher.char('F')),
      new StartMarbleEventTokenGrammar(matcher.char('S')),
      new CloseMarbleEventTokenGrammar(matcher.char('C')),
      new ParenOpenMarbleEventTokenGrammar(matcher.char('P')),
      new ParenCloseMarbleEventTokenGrammar(matcher.char('p')),
      new GroupOpenMarbleEventTokenGrammar(matcher.char('G')),
      new GroupCloseMarbleEventTokenGrammar(matcher.char('g')),
      new StringMarbleEventTokenGrammar(matcher.regex(/\{(.+?)\}/)),
    ];

    const tokenizer = new GrammarMarbleEventTokenizer(
      'SP{a}pFGP{B}pFP{cD}pgFP{4}pFC',
      customGrammar,
    );

    expect(tokenizer.next()).toEqual(new StartMarbleEventToken('S', pos(0, 1)));
    expect(tokenizer.next()).toEqual(
      new ParenMarbleEventToken(true, 'P', pos(1, 2)),
    );
    expect(tokenizer.next()).toEqual(
      new StringMarbleEventToken('a', '{a}', pos(2, 5)),
    );
    expect(tokenizer.next()).toEqual(
      new ParenMarbleEventToken(false, 'p', pos(5, 6)),
    );
    expect(tokenizer.next()).toEqual(new FrameMarbleEventToken('F', pos(6, 7)));
    expect(tokenizer.next()).toEqual(
      new GroupMarbleEventToken(true, 'G', pos(7, 8)),
    );
    expect(tokenizer.next()).toEqual(
      new ParenMarbleEventToken(true, 'P', pos(8, 9)),
    );
    expect(tokenizer.next()).toEqual(
      new StringMarbleEventToken('B', '{B}', pos(9, 12)),
    );
    expect(tokenizer.next()).toEqual(
      new ParenMarbleEventToken(false, 'p', pos(12, 13)),
    );
    expect(tokenizer.next()).toEqual(
      new FrameMarbleEventToken('F', pos(13, 14)),
    );
    expect(tokenizer.next()).toEqual(
      new ParenMarbleEventToken(true, 'P', pos(14, 15)),
    );
    expect(tokenizer.next()).toEqual(
      new StringMarbleEventToken('cD', '{cD}', pos(15, 19)),
    );
    expect(tokenizer.next()).toEqual(
      new ParenMarbleEventToken(false, 'p', pos(19, 20)),
    );
    expect(tokenizer.next()).toEqual(
      new GroupMarbleEventToken(false, 'g', pos(20, 21)),
    );
    expect(tokenizer.next()).toEqual(
      new FrameMarbleEventToken('F', pos(21, 22)),
    );
    expect(tokenizer.next()).toEqual(
      new ParenMarbleEventToken(true, 'P', pos(22, 23)),
    );
    expect(tokenizer.next()).toEqual(
      new StringMarbleEventToken('4', '{4}', pos(23, 26)),
    );
    expect(tokenizer.next()).toEqual(
      new ParenMarbleEventToken(false, 'p', pos(26, 27)),
    );
    expect(tokenizer.next()).toEqual(
      new FrameMarbleEventToken('F', pos(27, 28)),
    );
    expect(tokenizer.next()).toEqual(
      new CloseMarbleEventToken('C', pos(28, 29)),
    );
    expect(tokenizer.next()).toEqual(undefined);
  });

  it('should allow to iterate tokens as array', () => {
    const tokenizer = new GrammarMarbleEventTokenizer('^(a)-(B)-(cD)-(4)-X');
    const tokens = Array.from(tokenizer);

    expect(tokens).toEqual([
      new StartMarbleEventToken('^', pos(0, 1)),
      new ParenMarbleEventToken(true, '(', pos(1, 2)),
      new StringMarbleEventToken('a', 'a', pos(2, 3)),
      new ParenMarbleEventToken(false, ')', pos(3, 4)),
      new FrameMarbleEventToken('-', pos(4, 5)),
      new ParenMarbleEventToken(true, '(', pos(5, 6)),
      new StringMarbleEventToken('B', 'B', pos(6, 7)),
      new ParenMarbleEventToken(false, ')', pos(7, 8)),
      new FrameMarbleEventToken('-', pos(8, 9)),
      new ParenMarbleEventToken(true, '(', pos(9, 10)),
      new StringMarbleEventToken('cD', 'cD', pos(10, 12)),
      new ParenMarbleEventToken(false, ')', pos(12, 13)),
      new FrameMarbleEventToken('-', pos(13, 14)),
      new ParenMarbleEventToken(true, '(', pos(14, 15)),
      new StringMarbleEventToken('4', '4', pos(15, 16)),
      new ParenMarbleEventToken(false, ')', pos(16, 17)),
      new FrameMarbleEventToken('-', pos(17, 18)),
      new CloseMarbleEventToken('X', pos(18, 19)),
    ]);
  });

  it('should reset when iterated tokens as array', () => {
    const tokenizer = new GrammarMarbleEventTokenizer('^(a)-(B)-(cD)-(4)-X');
    const expectedTokens = [
      new StartMarbleEventToken('^', pos(0, 1)),
      new ParenMarbleEventToken(true, '(', pos(1, 2)),
      new StringMarbleEventToken('a', 'a', pos(2, 3)),
      new ParenMarbleEventToken(false, ')', pos(3, 4)),
      new FrameMarbleEventToken('-', pos(4, 5)),
      new ParenMarbleEventToken(true, '(', pos(5, 6)),
      new StringMarbleEventToken('B', 'B', pos(6, 7)),
      new ParenMarbleEventToken(false, ')', pos(7, 8)),
      new FrameMarbleEventToken('-', pos(8, 9)),
      new ParenMarbleEventToken(true, '(', pos(9, 10)),
      new StringMarbleEventToken('cD', 'cD', pos(10, 12)),
      new ParenMarbleEventToken(false, ')', pos(12, 13)),
      new FrameMarbleEventToken('-', pos(13, 14)),
      new ParenMarbleEventToken(true, '(', pos(14, 15)),
      new StringMarbleEventToken('4', '4', pos(15, 16)),
      new ParenMarbleEventToken(false, ')', pos(16, 17)),
      new FrameMarbleEventToken('-', pos(17, 18)),
      new CloseMarbleEventToken('X', pos(18, 19)),
    ];

    expect(Array.from(tokenizer)).toEqual(expectedTokens);
    expect(Array.from(tokenizer)).toEqual(expectedTokens);
  });
});
