import { MarbleInputs } from './input';
import { MarbleOutput } from './output';
import { MarbleSourceEventType } from '../source';

export interface MarbleOperator<
  INPUTS extends unknown[] = MarbleSourceEventType[],
  OUTPUT = MarbleSourceEventType,
> extends MarbleOutput<OUTPUT> {
  getInputs(): MarbleInputs<INPUTS>;
}

export type InferMarbleOperatorInputs<OPERATOR extends MarbleOperator> =
  OPERATOR extends MarbleOperator<infer INPUTS, unknown> ? INPUTS : never;

export type InferMarbleOperatorOutputs<OPERATOR extends MarbleOperator> =
  OPERATOR extends MarbleOperator<unknown[], infer OUTPUT> ? OUTPUT : never;
