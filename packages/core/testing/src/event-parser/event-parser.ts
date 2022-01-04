// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { MarbleSourceEvent } from '@rx-marbles/core';

export interface MarbleEventParser {
  getEvents(): IterableIterator<MarbleSourceEvent>;
}
