import {
  ClosedMarbleEventToken,
  ExpectedTokenEventTokenizerError,
  FrameMarbleEventToken,
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

  it('should throw when value token not closed by )', () => {
    const tokenizer = new MarbleEventTokenizer('(valueX');

    expect(() => tokenizer.next()).toThrowError(
      new ExpectedTokenEventTokenizerError({
        token: ')',
        index: '1',
      }),
    );
  });

  it('should throw on unexpected event', () => {
    const tokenizer = new MarbleEventTokenizer('?');

    expect(() => tokenizer.next()).toThrowError(
      new UnexpectedCharEventTokenizerError({ char: '?', index: '0' }),
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
      ValueEnd = 'E',
    }

    const tokenizer = new MarbleEventTokenizer(
      'SFVaEFVbEFC',
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
      new ClosedMarbleEventToken(pos(10, 11)),
    ]);
  });
});
