// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { StubMarbleTimeline, StubMarbleSource } from '@rx-marbles/core/testing';
import { MarbleInputs } from '../../operator';
import { MarbleTimelineBounds } from './bounds';
import { WidestMarbleTimelineBoundsStrategy } from './widest-bounds-strategy';

describe('WidestMarbleTimelineBoundsStrategy', () => {
  const defaultBound: MarbleTimelineBounds = { start: 1, end: 2 };

  it('should return widest bounds from input timelines', () => {
    const strategy = new WidestMarbleTimelineBoundsStrategy(defaultBound);
    const input1 = new StubMarbleTimeline();
    const input2 = new StubMarbleTimeline();
    const input3 = new StubMarbleTimeline();
    input1.getBounds.mockReturnValue({ start: 4, end: 10 });
    input2.getBounds.mockReturnValue({ start: 1, end: 12 });
    input3.getBounds.mockReturnValue({ start: 3, end: 6 });
    const inputs = [input1, input2, input3];

    const bounds = strategy.getBounds(inputs);

    expect(bounds).toEqual({ start: 1, end: 12 });
  });

  it('should return default bounds when empty inputs', () => {
    const strategy = new WidestMarbleTimelineBoundsStrategy(defaultBound);
    const inputs: MarbleInputs = [];

    const bounds = strategy.getBounds(inputs);

    expect(bounds).toEqual(defaultBound);
  });

  it('should skip non-timeline inputs', () => {
    const strategy = new WidestMarbleTimelineBoundsStrategy(defaultBound);
    const input1 = new StubMarbleSource();
    const input2 = new StubMarbleSource();
    const input3 = new StubMarbleSource();
    const inputs = [input1, input2, input3];

    const bounds = strategy.getBounds(inputs);

    expect(bounds).toEqual(defaultBound);
  });
});
