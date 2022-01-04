// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import {
  MarbleSourceClosedEvent,
  MarbleSourceStartEvent,
  MarbleSourceValueEvent,
} from '@rx-marbles/core';
import { GrammarMarbleEventTokenizer } from '../../event-tokenizer';
import {
  FriendlyMarbleEventParserError,
  UnexpectedTokenMarbleEventParserError,
} from '../errors';
import { LinearMarbleEventParser } from './linear-event-parser';

describe('LinearMarbleEventParser', () => {
  it('should not produce any events from empty tokens', () => {
    const input = '';
    const tokenizer = new GrammarMarbleEventTokenizer(input);
    const parser = new LinearMarbleEventParser(tokenizer);

    const events = parser.getEvents();

    expect(events.next()).toEqual({ done: true, value: undefined });
  });

  describe('Frame tokens', () => {
    it('should not produce any events', () => {
      const input = '---';
      const tokenizer = new GrammarMarbleEventTokenizer(input);
      const parser = new LinearMarbleEventParser(tokenizer);

      const events = parser.getEvents();

      expect(events.next()).toEqual({ done: true, value: undefined });
    });

    it('should increment time of other events by frame time', () => {
      const input = '^-X';
      const tokenizer = new GrammarMarbleEventTokenizer(input);
      const parser = new LinearMarbleEventParser(tokenizer, { frameTime: 50 });

      const events = parser.getEvents();

      expect(events.next().value).toEqual(new MarbleSourceStartEvent(0));
      expect(events.next().value).toEqual(new MarbleSourceClosedEvent(100));
      expect(events.next()).toEqual({ done: true, value: undefined });
    });

    it('should throw inside values', () => {
      const input = '^(a-)';
      const tokenizer = new GrammarMarbleEventTokenizer(input);
      const parser = new LinearMarbleEventParser(tokenizer);
      const tokens = Array.from(tokenizer);
      const error = new UnexpectedTokenMarbleEventParserError(tokens[3]);

      const events = parser.getEvents();

      expect(events.next().value).toEqual(new MarbleSourceStartEvent(0));
      expect(() => events.next().value).toThrow(
        new FriendlyMarbleEventParserError({ error, input }),
      );
    });

    it('should throw inside groups', () => {
      const input = '^{-}';
      const tokenizer = new GrammarMarbleEventTokenizer(input);
      const parser = new LinearMarbleEventParser(tokenizer);
      const tokens = Array.from(tokenizer);
      const error = new UnexpectedTokenMarbleEventParserError(tokens[2]);

      const events = parser.getEvents();

      expect(events.next().value).toEqual(new MarbleSourceStartEvent(0));
      expect(() => events.next().value).toThrow(
        new FriendlyMarbleEventParserError({ error, input }),
      );
    });
  });

  describe('Start tokens', () => {
    it('should produce start events', () => {
      const input = '^';
      const tokenizer = new GrammarMarbleEventTokenizer(input);
      const parser = new LinearMarbleEventParser(tokenizer);

      const events = parser.getEvents();

      expect(events.next().value).toEqual(new MarbleSourceStartEvent(0));
      expect(events.next()).toEqual({ done: true, value: undefined });
    });

    it('should produce start events after closed', () => {
      const input = '^-X-^';
      const tokenizer = new GrammarMarbleEventTokenizer(input);
      const parser = new LinearMarbleEventParser(tokenizer);

      const events = parser.getEvents();

      expect(events.next().value).toEqual(new MarbleSourceStartEvent(0));
      expect(events.next().value).toEqual(new MarbleSourceClosedEvent(20));
      expect(events.next().value).toEqual(new MarbleSourceStartEvent(40));
      expect(events.next()).toEqual({ done: true, value: undefined });
    });

    it('should throw when already started', () => {
      const input = '^-^';
      const tokenizer = new GrammarMarbleEventTokenizer(input);
      const parser = new LinearMarbleEventParser(tokenizer);
      const tokens = Array.from(tokenizer);
      const error = new UnexpectedTokenMarbleEventParserError(tokens[2]);

      const events = parser.getEvents();

      expect(events.next().value).toEqual(new MarbleSourceStartEvent(0));
      expect(() => events.next().value).toThrow(
        new FriendlyMarbleEventParserError({ error, input }),
      );
    });

    it('should throw inside values', () => {
      const input = '^(a^)';
      const tokenizer = new GrammarMarbleEventTokenizer(input);
      const parser = new LinearMarbleEventParser(tokenizer);
      const tokens = Array.from(tokenizer);
      const error = new UnexpectedTokenMarbleEventParserError(tokens[3]);

      const events = parser.getEvents();

      expect(events.next().value).toEqual(new MarbleSourceStartEvent(0));
      expect(() => events.next().value).toThrow(
        new FriendlyMarbleEventParserError({ error, input }),
      );
    });

    it('should NOT throw inside groups', () => {
      const input = '{^(a)}';
      const tokenizer = new GrammarMarbleEventTokenizer(input);
      const parser = new LinearMarbleEventParser(tokenizer);

      const events = parser.getEvents();

      expect(events.next().value).toEqual(new MarbleSourceStartEvent(0));
      expect(events.next().value).toEqual(new MarbleSourceValueEvent(0, 'a'));
    });
  });

  describe('Close tokens', () => {
    it('should produce closed events', () => {
      const input = '^X';
      const tokenizer = new GrammarMarbleEventTokenizer(input);
      const parser = new LinearMarbleEventParser(tokenizer);

      const events = parser.getEvents();

      expect(events.next().value).toEqual(new MarbleSourceStartEvent(0));
      expect(events.next().value).toEqual(new MarbleSourceClosedEvent(10));
      expect(events.next()).toEqual({ done: true, value: undefined });
    });

    it('should throw when not started', () => {
      const input = '-X';
      const tokenizer = new GrammarMarbleEventTokenizer(input);
      const parser = new LinearMarbleEventParser(tokenizer);
      const tokens = Array.from(tokenizer);
      const error = new UnexpectedTokenMarbleEventParserError(tokens[1]);

      const events = parser.getEvents();

      expect(() => events.next().value).toThrow(
        new FriendlyMarbleEventParserError({ error, input }),
      );
    });

    it('should NOT throw when RE-started', () => {
      const input = '^-X-^-X';
      const tokenizer = new GrammarMarbleEventTokenizer(input);
      const parser = new LinearMarbleEventParser(tokenizer);

      const events = parser.getEvents();

      expect(events.next().value).toEqual(new MarbleSourceStartEvent(0));
      expect(events.next().value).toEqual(new MarbleSourceClosedEvent(20));
      expect(events.next().value).toEqual(new MarbleSourceStartEvent(40));
      expect(events.next().value).toEqual(new MarbleSourceClosedEvent(60));
      expect(events.next()).toEqual({ done: true, value: undefined });
    });

    it('should NOT throw inside groups', () => {
      const input = '{^X}';
      const tokenizer = new GrammarMarbleEventTokenizer(input);
      const parser = new LinearMarbleEventParser(tokenizer);

      const events = parser.getEvents();

      expect(events.next().value).toEqual(new MarbleSourceStartEvent(0));
      expect(events.next().value).toEqual(new MarbleSourceClosedEvent(0));
    });
  });

  describe('Paren tokens', () => {
    it('should produce value events', () => {
      const input = '^(a)(b)';
      const tokenizer = new GrammarMarbleEventTokenizer(input);
      const parser = new LinearMarbleEventParser(tokenizer);

      const events = parser.getEvents();

      expect(events.next().value).toEqual(new MarbleSourceStartEvent(0));
      expect(events.next().value).toEqual(new MarbleSourceValueEvent(10, 'a'));
      expect(events.next().value).toEqual(new MarbleSourceValueEvent(20, 'b'));
      expect(events.next()).toEqual({ done: true, value: undefined });
    });

    it('should produce value events in groups', () => {
      const input = '^{(a)(b)}';
      const tokenizer = new GrammarMarbleEventTokenizer(input);
      const parser = new LinearMarbleEventParser(tokenizer);

      const events = parser.getEvents();

      expect(events.next().value).toEqual(new MarbleSourceStartEvent(0));
      expect(events.next().value).toEqual(new MarbleSourceValueEvent(10, 'a'));
      expect(events.next().value).toEqual(new MarbleSourceValueEvent(10, 'b'));
      expect(events.next()).toEqual({ done: true, value: undefined });
    });

    it('should produce value events with frames', () => {
      const input = '^(a)-(b)';
      const tokenizer = new GrammarMarbleEventTokenizer(input);
      const parser = new LinearMarbleEventParser(tokenizer);

      const events = parser.getEvents();

      expect(events.next().value).toEqual(new MarbleSourceStartEvent(0));
      expect(events.next().value).toEqual(new MarbleSourceValueEvent(10, 'a'));
      expect(events.next().value).toEqual(new MarbleSourceValueEvent(30, 'b'));
      expect(events.next()).toEqual({ done: true, value: undefined });
    });

    it('should throw when not started', () => {
      const input = '(a)';
      const tokenizer = new GrammarMarbleEventTokenizer(input);
      const parser = new LinearMarbleEventParser(tokenizer);
      const tokens = Array.from(tokenizer);
      const error = new UnexpectedTokenMarbleEventParserError(tokens[0]);

      const events = parser.getEvents();

      expect(() => events.next().value).toThrow(
        new FriendlyMarbleEventParserError({ error, input }),
      );
    });

    it('should throw when inside parens', () => {
      const input = '^(a(b))';
      const tokenizer = new GrammarMarbleEventTokenizer(input);
      const parser = new LinearMarbleEventParser(tokenizer);
      const tokens = Array.from(tokenizer);
      const error = new UnexpectedTokenMarbleEventParserError(tokens[3]);

      const events = parser.getEvents();

      expect(events.next().value).toEqual(new MarbleSourceStartEvent(0));
      expect(() => events.next().value).toThrow(
        new FriendlyMarbleEventParserError({ error, input }),
      );
    });

    it('should throw when closed', () => {
      const input = '^X(a)';
      const tokenizer = new GrammarMarbleEventTokenizer(input);
      const parser = new LinearMarbleEventParser(tokenizer);
      const tokens = Array.from(tokenizer);
      const error = new UnexpectedTokenMarbleEventParserError(tokens[2]);

      const events = parser.getEvents();

      expect(events.next().value).toEqual(new MarbleSourceStartEvent(0));
      expect(events.next().value).toEqual(new MarbleSourceClosedEvent(10));
      expect(() => events.next().value).toThrow(
        new FriendlyMarbleEventParserError({ error, input }),
      );
    });
  });

  it('should parse events from tokenizer with time 10', () => {
    const input = '^(a)-{(b)(c)}-(d)-X';
    const tokenizer = new GrammarMarbleEventTokenizer(input);
    const parser = new LinearMarbleEventParser(tokenizer);

    const events = parser.getEvents();

    expect(events.next().value).toEqual(new MarbleSourceStartEvent(0));
    expect(events.next().value).toEqual(new MarbleSourceValueEvent(10, 'a'));
    expect(events.next().value).toEqual(new MarbleSourceValueEvent(30, 'b'));
    expect(events.next().value).toEqual(new MarbleSourceValueEvent(30, 'c'));
    expect(events.next().value).toEqual(new MarbleSourceValueEvent(50, 'd'));
    expect(events.next().value).toEqual(new MarbleSourceClosedEvent(70));
    expect(events.next()).toEqual({ done: true, value: undefined });
  });

  it('should parse events from tokenizer with custom time', () => {
    const input = '^(a)-{(b)(c)}-(d)-X';
    const tokenizer = new GrammarMarbleEventTokenizer(input);
    const parser = new LinearMarbleEventParser(tokenizer, { frameTime: 20 });

    const events = parser.getEvents();

    expect(events.next().value).toEqual(new MarbleSourceStartEvent(0));
    expect(events.next().value).toEqual(new MarbleSourceValueEvent(20, 'a'));
    expect(events.next().value).toEqual(new MarbleSourceValueEvent(60, 'b'));
    expect(events.next().value).toEqual(new MarbleSourceValueEvent(60, 'c'));
    expect(events.next().value).toEqual(new MarbleSourceValueEvent(100, 'd'));
    expect(events.next().value).toEqual(new MarbleSourceClosedEvent(140));
    expect(events.next()).toEqual({ done: true, value: undefined });
  });

  it('should parse events from tokenizer as array', () => {
    const input = '^(a)-{(b)(c)}-(d)-X';
    const tokenizer = new GrammarMarbleEventTokenizer(input);
    const parser = new LinearMarbleEventParser(tokenizer);

    const events = Array.from(parser.getEvents());

    expect(events).toEqual([
      new MarbleSourceStartEvent(0),
      new MarbleSourceValueEvent(10, 'a'),
      new MarbleSourceValueEvent(30, 'b'),
      new MarbleSourceValueEvent(30, 'c'),
      new MarbleSourceValueEvent(50, 'd'),
      new MarbleSourceClosedEvent(70),
    ]);
  });

  it('should parse events multiple times', () => {
    const input = '^(a)-{(b)(c)}-(d)-X';
    const tokenizer = new GrammarMarbleEventTokenizer(input);
    const parser = new LinearMarbleEventParser(tokenizer);

    const events1 = Array.from(parser.getEvents());
    const events2 = Array.from(parser.getEvents());

    expect(events1).toEqual([
      new MarbleSourceStartEvent(0),
      new MarbleSourceValueEvent(10, 'a'),
      new MarbleSourceValueEvent(30, 'b'),
      new MarbleSourceValueEvent(30, 'c'),
      new MarbleSourceValueEvent(50, 'd'),
      new MarbleSourceClosedEvent(70),
    ]);
    expect(events2).toEqual([
      new MarbleSourceStartEvent(0),
      new MarbleSourceValueEvent(10, 'a'),
      new MarbleSourceValueEvent(30, 'b'),
      new MarbleSourceValueEvent(30, 'c'),
      new MarbleSourceValueEvent(50, 'd'),
      new MarbleSourceClosedEvent(70),
    ]);
  });
});
