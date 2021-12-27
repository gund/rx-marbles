import {
  CustomMarbleOperatorFactory,
  CustomMarbleOperatorOptions,
} from './custom-operator';

export class IdentityMarbleOperatorFactory<
  INPUTS extends unknown[],
  OUTPUT,
> extends CustomMarbleOperatorFactory<INPUTS, OUTPUT> {
  constructor(options?: CustomMarbleOperatorOptions) {
    super({
      ...options,
      operatorFn: (_, event) => event,
      operatorName: 'Identity',
    });
  }
}
