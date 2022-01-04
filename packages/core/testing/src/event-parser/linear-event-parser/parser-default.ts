import { TokenMarbleEventParser } from './linear-event-parser';
import { CloseTokenMarbleEventParser } from './parser-close';
import { FrameTokenMarbleEventParser } from './parser-frame';
import { GroupTokenMarbleEventParser } from './parser-group';
import { ParenTokenMarbleEventParser } from './parser-paren';
import { StartTokenMarbleEventParser } from './parser-start';
import { StringTokenMarbleEventParser } from './parser-string';

export const defaultLinearParsers: TokenMarbleEventParser[] = [
  new FrameTokenMarbleEventParser(),
  new StartTokenMarbleEventParser(),
  new CloseTokenMarbleEventParser(),
  new StringTokenMarbleEventParser(),
  new ParenTokenMarbleEventParser(),
  new GroupTokenMarbleEventParser(),
];
