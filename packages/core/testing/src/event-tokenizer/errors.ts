// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { MarbleError } from '@rx-marbles/core';

export class EventTokenizerError extends MarbleError {
  static override text = 'EventTokenizerError';
  getInput(input: string) {
    return input;
  }
}

export class FriendlyEventTokenizerError extends EventTokenizerError {
  static override text = '${error} in ${input}';
}

function getIndexedInput(this: EventTokenizerError, input: string) {
  const idx = Number(this.messageData?.['index']);
  return `${input.slice(0, idx)}>>>${input.slice(idx)}`;
}

export class UnexpectedTokenEventTokenizerError extends EventTokenizerError {
  static override text = 'Unexpected token "${token}" at index ${index}';
  override getInput = getIndexedInput;
}
