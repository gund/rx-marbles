import { MarbleRuntime } from './runtime';
import {
  MarbleOperator,
  MarbleInputs,
  InferMarbleOperatorInputs,
  MarbleOutput,
  InferMarbleOperatorOutputs,
} from '../operator';

export class BasicMarbleRuntime<OPERATOR extends MarbleOperator>
  implements MarbleRuntime<OPERATOR>
{
  constructor(private operator: OPERATOR) {}

  getOperator(): OPERATOR {
    return this.operator;
  }

  getInputs(): MarbleInputs<InferMarbleOperatorInputs<OPERATOR>> {
    return this.operator.getInputs() as never;
  }

  getOutput(): MarbleOutput<InferMarbleOperatorOutputs<OPERATOR>> {
    return this.operator as never;
  }
}
