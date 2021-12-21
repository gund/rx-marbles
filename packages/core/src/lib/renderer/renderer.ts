import { Cancellable } from '../cancellable';
import { MarbleRuntime } from '../runtime';

export interface MarbleRenderer {
  render(runtime: MarbleRuntime): Cancellable;
  dispose(): void;
}
