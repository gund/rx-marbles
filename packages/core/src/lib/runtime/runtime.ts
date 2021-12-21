import {
  InferMarbleOperatorInputs,
  InferMarbleOperatorOutputs,
  MarbleInputs,
  MarbleOperator,
  MarbleOutput,
} from '../operator';

export interface MarbleRuntime<
  OPERATOR extends MarbleOperator = MarbleOperator,
> {
  getOperator(): OPERATOR;
  getInputs(): MarbleInputs<InferMarbleOperatorInputs<OPERATOR>>;
  getOutput(): MarbleOutput<InferMarbleOperatorOutputs<OPERATOR>>;
}
