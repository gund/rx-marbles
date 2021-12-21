import { Cancellable } from '../cancellable';
import { MarbleInput, MarbleOperator, MarbleOutput } from '../operator';
import { MarbleRuntime } from '../runtime';
import { MarbleSourceEvent } from '../source';
import { MarbleRenderer } from './renderer';

export abstract class AbstractMarbleRenderer implements MarbleRenderer {
  protected allDisposables = new Set<Cancellable>([
    {
      cancel: () => {
        this.render = () => {
          throw new AbstractMarbleRendererDisposedError();
        };
      },
    },
  ]);
  protected runtimeDisposables = new Map<MarbleRuntime, Set<Cancellable>>();

  protected abstract renderInput(
    operator: MarbleOperator,
    input: MarbleInput,
    event: MarbleSourceEvent,
  ): void;
  protected abstract renderOutput(
    operator: MarbleOperator,
    output: MarbleOutput,
    event: MarbleSourceEvent,
  ): void;

  render(runtime: MarbleRuntime): Cancellable {
    const disposables = this.prepareRuntime(runtime);

    this.runtimeDisposables.set(runtime, disposables);
    disposables.forEach((d) => this.allDisposables.add(d));

    return { cancel: () => this.disposeRuntime(runtime) };
  }

  dispose(disposables = this.allDisposables) {
    const isGlobal = disposables === this.allDisposables;

    const disposeFn: (disposable: Cancellable) => void = isGlobal
      ? (disposable) => disposable.cancel()
      : (disposable) => {
          disposable.cancel();
          this.allDisposables.delete(disposable);
        };

    disposables.forEach(disposeFn);
    disposables.clear();

    if (isGlobal) {
      this.runtimeDisposables.clear();
    }
  }

  protected prepareRuntime(runtime: MarbleRuntime): Set<Cancellable> {
    const operator = runtime.getOperator();
    const inputs = runtime.getInputs();
    const output = runtime.getOutput();
    const disposables = new Set<Cancellable>();

    inputs.forEach((input) =>
      disposables.add(this.prepareInput(operator, input)),
    );

    disposables.add(this.prepareOutput(operator, output));

    return disposables;
  }

  protected disposeRuntime(runtime: MarbleRuntime) {
    if (!this.runtimeDisposables.has(runtime)) {
      return;
    }

    this.dispose(this.runtimeDisposables.get(runtime));
    this.runtimeDisposables.delete(runtime);
  }

  protected prepareInput(
    operator: MarbleOperator,
    input: MarbleInput,
  ): Cancellable {
    return input.subscribe((event) => this.renderInput(operator, input, event));
  }

  protected prepareOutput(
    operator: MarbleOperator,
    output: MarbleOutput,
  ): Cancellable {
    return output.subscribe((event) =>
      this.renderOutput(operator, output, event),
    );
  }
}

export class AbstractMarbleRendererDisposedError extends Error {
  static text = 'Unable to use disposed renderer!';

  constructor() {
    super(AbstractMarbleRendererDisposedError.text);
  }
}
