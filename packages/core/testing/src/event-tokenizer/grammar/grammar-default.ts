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

export const defaultEventTokenGrammar: MarbleEventTokenGrammar[] = [
  new FrameMarbleEventTokenGrammar(),
  new StartMarbleEventTokenGrammar(),
  new CloseMarbleEventTokenGrammar(),
  new ParenOpenMarbleEventTokenGrammar(),
  new ParenCloseMarbleEventTokenGrammar(),
  new GroupOpenMarbleEventTokenGrammar(),
  new GroupCloseMarbleEventTokenGrammar(),
  new StringMarbleEventTokenGrammar(),
];
