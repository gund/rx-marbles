import {
  ClosedMarbleEventToken,
  ExpectedTokenEventTokenizerError,
  FrameMarbleEventToken,
  GroupEndMarbleEventToken,
  GroupStartMarbleEventToken,
  InputEventTokenizerError,
  MarbleEventTokenizer,
  pos,
  StartMarbleEventToken,
  UnexpectedCharEventTokenizerError,
  ValueMarbleEventToken,
} from './event-tokenizer';

describe('MarbleEventTokenizer', () => {
  it('should produce frame event token from -', () => {
    const tokenizer = new MarbleEventTokenizer('-');

    expect(tokenizer.next()).toEqual(new FrameMarbleEventToken(pos(0, 1)));
  });

  it('should produce start event token from ^', () => {
    const tokenizer = new MarbleEventTokenizer('^');

    expect(tokenizer.next()).toEqual(new StartMarbleEventToken(pos(0, 1)));
  });

  it('should produce closed event token from X', () => {
    const tokenizer = new MarbleEventTokenizer('X');

    expect(tokenizer.next()).toEqual(new ClosedMarbleEventToken(pos(0, 1)));
  });

  it('should produce value event token from (...)', () => {
    const tokenizer = new MarbleEventTokenizer('(value)');

    expect(tokenizer.next()).toEqual(
      new ValueMarbleEventToken('value', pos(0, 7)),
    );
  });

  it('should produce group start event token from {', () => {
    const tokenizer = new MarbleEventTokenizer('{');

    expect(tokenizer.next()).toEqual(new GroupStartMarbleEventToken(pos(0, 1)));
  });

  it('should produce group end event token from }', () => {
    const tokenizer = new MarbleEventTokenizer('}');

    expect(tokenizer.next()).toEqual(new GroupEndMarbleEventToken(pos(0, 1)));
  });

  it('should throw when value token not closed by )', () => {
    const tokenizer = new MarbleEventTokenizer('(valueX');
    const error = new ExpectedTokenEventTokenizerError({
      token: ')',
      index: '1',
    });

    expect(() => tokenizer.next()).toThrowError(
      new InputEventTokenizerError({
        error,
        input: error.getErroredInput('(valueX'),
      }),
    );
  });

  it('should throw on unexpected event', () => {
    const tokenizer = new MarbleEventTokenizer('?');
    const error = new UnexpectedCharEventTokenizerError({
      char: '?',
      index: '0',
    });

    expect(() => tokenizer.next()).toThrowError(
      new InputEventTokenizerError({
        error,
        input: error.getErroredInput('?'),
      }),
    );
  });

  it('should tokenize all events', () => {
    const tokenizer = new MarbleEventTokenizer('^-(a)-(b)-X');

    const tokens = Array.from(tokenizer);

    expect(tokens).toEqual([
      new StartMarbleEventToken(pos(0, 1)),
      new FrameMarbleEventToken(pos(1, 2)),
      new ValueMarbleEventToken('a', pos(2, 5)),
      new FrameMarbleEventToken(pos(5, 6)),
      new ValueMarbleEventToken('b', pos(6, 9)),
      new FrameMarbleEventToken(pos(9, 10)),
      new ClosedMarbleEventToken(pos(10, 11)),
    ]);
  });

  it('should allow to override token chars', () => {
    enum MarbleEventTokenChar {
      Frame = 'F',
      Start = 'S',
      Closed = 'C',
      ValueStart = 'V',
      ValueEnd = 'v',
      GroupStart = 'G',
      GroupEnd = 'g',
    }

    const tokenizer = new MarbleEventTokenizer(
      'SFVavFVbvFGVcvVdvgFC',
      MarbleEventTokenChar,
    );

    const tokens = Array.from(tokenizer);

    expect(tokens).toEqual([
      new StartMarbleEventToken(pos(0, 1)),
      new FrameMarbleEventToken(pos(1, 2)),
      new ValueMarbleEventToken('a', pos(2, 5)),
      new FrameMarbleEventToken(pos(5, 6)),
      new ValueMarbleEventToken('b', pos(6, 9)),
      new FrameMarbleEventToken(pos(9, 10)),
      new GroupStartMarbleEventToken(pos(10, 11)),
      new ValueMarbleEventToken('c', pos(11, 14)),
      new ValueMarbleEventToken('d', pos(14, 17)),
      new GroupEndMarbleEventToken(pos(17, 18)),
      new FrameMarbleEventToken(pos(18, 19)),
      new ClosedMarbleEventToken(pos(19, 20)),
    ]);
  });
});
