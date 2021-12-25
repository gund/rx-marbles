import {
  MarbleSourceClosedEvent,
  MarbleSourceMoveEvent,
  MarbleSourceStartEvent,
  MarbleSourceValueEvent,
} from '@rx-marbles/core';
import {
  EmitableStubMarbleOperator,
  EmitableStubMarbleSource,
  EmitableStubMarbleTimeline,
  StubMarbleRuntime,
} from '@rx-marbles/core/testing';
import { StubTextHost } from './text-host.stub';
import { TextMarbleRenderer } from './text-renderer';

describe('TextMarbleRenderer', () => {
  function setup() {
    const runtime = new StubMarbleRuntime();
    const operator = new EmitableStubMarbleOperator();
    const input1 = new EmitableStubMarbleSource();
    const input2 = new EmitableStubMarbleTimeline();
    runtime.getOperator.mockReturnValue(operator);
    runtime.getInputs.mockReturnValue([input1, input2]);
    runtime.getOutput.mockReturnValue(operator);
    input1.getName.mockReturnValue('Input 1');
    input2.getName.mockReturnValue('Input 2');
    operator.getName.mockReturnValue('Operator');
    operator.getInputs.mockReturnValue([input1, input2]);

    return { runtime, operator, input1, input2 };
  }

  it('should render runtime after output closed event', () => {
    const host = new StubTextHost();
    const renderer = new TextMarbleRenderer({ host });
    const { runtime, input1, input2, operator } = setup();

    renderer.render(runtime);

    input1.emit(new MarbleSourceStartEvent(1));
    input2.emit(new MarbleSourceStartEvent(1));
    operator.emit(new MarbleSourceStartEvent(1));

    input1.emit(new MarbleSourceValueEvent(2, 'V11'));
    input2.emit(new MarbleSourceValueEvent(2, 'V21'));
    operator.emit(new MarbleSourceValueEvent(2, 'V31'));

    input1.emit(new MarbleSourceClosedEvent(3));
    input2.emit(new MarbleSourceClosedEvent(3));

    expect(host.print).not.toHaveBeenCalled();

    operator.emit(new MarbleSourceClosedEvent(3));

    expect(host.print).toHaveBeenCalled();
    expect(host.getBuffer()).not.toBe('');

    renderer.dispose();
  });

  it('should render inputs names', () => {
    const host = new StubTextHost();
    const renderer = new TextMarbleRenderer({ host });
    const { runtime, operator } = setup();

    renderer.render(runtime);

    operator.emit(new MarbleSourceClosedEvent(1));

    expect(host.getBuffer()).toContain('Input 1');
    expect(host.getBuffer()).toContain('Input 2');

    renderer.dispose();
  });

  it('should render output/operator name', () => {
    const host = new StubTextHost();
    const renderer = new TextMarbleRenderer({ host });
    const { runtime, operator } = setup();

    renderer.render(runtime);

    operator.emit(new MarbleSourceClosedEvent(1));

    expect(host.getBuffer()).toContain('Operator');

    renderer.dispose();
  });

  it('should render value events in parenthesis (V)', () => {
    const host = new StubTextHost();
    const renderer = new TextMarbleRenderer({ host });
    const { runtime, input1, input2, operator } = setup();

    renderer.render(runtime);

    input1.emit(new MarbleSourceValueEvent(1, 'V11'));
    input2.emit(new MarbleSourceValueEvent(1, 'V21'));
    operator.emit(new MarbleSourceValueEvent(1, 'V31'));

    input1.emit(new MarbleSourceValueEvent(2, 'V12'));
    input2.emit(new MarbleSourceValueEvent(2, 'V22'));
    operator.emit(new MarbleSourceValueEvent(2, 'V32'));

    operator.emit(new MarbleSourceClosedEvent(3));

    expect(host.getBuffer()).toContain('(V11)');
    expect(host.getBuffer()).toContain('(V12)');
    expect(host.getBuffer()).toContain('(V21)');
    expect(host.getBuffer()).toContain('(V22)');
    expect(host.getBuffer()).toContain('(V31)');
    expect(host.getBuffer()).toContain('(V32)');

    renderer.dispose();
  });

  it('should render closed events as X', () => {
    const host = new StubTextHost();
    const renderer = new TextMarbleRenderer({ host });
    const { runtime, input1, input2, operator } = setup();

    renderer.render(runtime);

    input1.emit(new MarbleSourceClosedEvent(1));
    input2.emit(new MarbleSourceClosedEvent(1));
    operator.emit(new MarbleSourceClosedEvent(1));

    expect(host.getBuffer()).toContain('X');

    renderer.dispose();
  });

  it('should render events in order', () => {
    const host = new StubTextHost();
    const renderer = new TextMarbleRenderer({ host });
    const { runtime, input1, input2, operator } = setup();

    renderer.render(runtime);

    input1.emit(new MarbleSourceValueEvent(1, 'V11'));
    input2.emit(new MarbleSourceValueEvent(1, 'V21'));
    operator.emit(new MarbleSourceValueEvent(1, 'V31'));

    input1.emit(new MarbleSourceValueEvent(2, 'V12'));
    input2.emit(new MarbleSourceValueEvent(2, 'V22'));
    operator.emit(new MarbleSourceValueEvent(2, 'V32'));

    input1.emit(new MarbleSourceClosedEvent(3));
    input2.emit(new MarbleSourceClosedEvent(3));
    operator.emit(new MarbleSourceClosedEvent(3));

    // Input 1: (V11)-(V12)-X
    expect(host.getBuffer()).toMatch(/\(V11\)-+\(V12\)-+X/);
    // Input 2: (V21)-(V22)-X
    expect(host.getBuffer()).toMatch(/\(V21\)-+\(V22\)-+X/);
    // Output: (V31)-(V32)-X
    expect(host.getBuffer()).toMatch(/\(V31\)-+\(V32\)-+X/);

    renderer.dispose();
  });

  it('should reorder events on move event and render', () => {
    const host = new StubTextHost();
    const renderer = new TextMarbleRenderer({ host });
    const { runtime, input1, input2, operator } = setup();

    renderer.render(runtime);

    input1.emit(new MarbleSourceValueEvent(1, 'V11'));
    input2.emit(new MarbleSourceValueEvent(1, 'V21'));
    operator.emit(new MarbleSourceValueEvent(1, 'V31'));

    const evt12 = new MarbleSourceValueEvent(2, 'V12');

    input1.emit(evt12);
    input2.emit(new MarbleSourceValueEvent(2, 'V22'));
    operator.emit(new MarbleSourceValueEvent(2, 'V32'));

    operator.emit(new MarbleSourceClosedEvent(3));

    // Input 1: (V11)-(V12)
    expect(host.getBuffer()).toMatch(/\(V11\)-+\(V12\)/);
    // Input 2: (V21)-(V22)
    expect(host.getBuffer()).toMatch(/\(V21\)-+\(V22\)/);
    // Output: (V31)-(V32)-X
    expect(host.getBuffer()).toMatch(/\(V31\)-+\(V32\)-+X/);

    evt12.time = 1;
    input1.emit(new MarbleSourceMoveEvent(evt12, 2));

    // Input 1: (V12)-(V11)
    expect(host.getBuffer()).toMatch(/\(V12\)-+\(V11\)/);
    // Input 2: (V21)-(V22)
    expect(host.getBuffer()).toMatch(/\(V21\)-+\(V22\)/);
    // Output: (V31)-(V32)-X
    expect(host.getBuffer()).toMatch(/\(V31\)-+\(V32\)-+X/);

    renderer.dispose();
  });

  it('should clear events on start event and render', () => {
    const host = new StubTextHost();
    const renderer = new TextMarbleRenderer({ host });
    const { runtime, input1, input2, operator } = setup();

    renderer.render(runtime);

    input1.emit(new MarbleSourceValueEvent(1, 'V11'));
    input2.emit(new MarbleSourceValueEvent(1, 'V21'));
    operator.emit(new MarbleSourceValueEvent(1, 'V31'));

    input2.emit(new MarbleSourceStartEvent(2));

    input1.emit(new MarbleSourceValueEvent(3, 'V12'));
    input2.emit(new MarbleSourceValueEvent(3, 'V22'));
    operator.emit(new MarbleSourceValueEvent(3, 'V32'));

    operator.emit(new MarbleSourceClosedEvent(4));

    // Input 1: (V11)-(V12)
    expect(host.getBuffer()).toMatch(/\(V11\)-+\(V12\)/);
    // Input 2: (V22)
    expect(host.getBuffer()).toMatch(/\(V22\)/);
    // Output: (V31)-(V32)-X
    expect(host.getBuffer()).toMatch(/\(V31\)-+\(V32\)-+X/);

    renderer.dispose();
  });

  it('should render events proportionally', () => {
    const host = new StubTextHost();
    const renderer = new TextMarbleRenderer({ host });
    const { runtime, input1, input2, operator } = setup();

    input2.getBounds.mockReturnValue({ start: 0, end: 20 });
    operator.getBounds.mockReturnValue({ start: 0, end: 20 });

    renderer.render(runtime);

    input1.emit(new MarbleSourceValueEvent(2, 'V11'));
    input2.emit(new MarbleSourceValueEvent(0, 'V21'));
    operator.emit(new MarbleSourceValueEvent(2, 'V31'));

    input1.emit(new MarbleSourceValueEvent(5, 'V12'));
    input2.emit(new MarbleSourceValueEvent(5, 'V22'));
    operator.emit(new MarbleSourceValueEvent(6, 'V32'));

    input1.emit(new MarbleSourceValueEvent(15, 'V13'));
    input2.emit(new MarbleSourceValueEvent(15, 'V23'));
    operator.emit(new MarbleSourceValueEvent(15, 'V33'));

    input1.emit(new MarbleSourceClosedEvent(20));
    operator.emit(new MarbleSourceClosedEvent(20));

    // Input 2 has bounds
    expect(host.getBuffer()).toContain(
      '|(V21)-------------------(V22)--------------------------------------------(V23)--------------------|',
    );
    // Output has bounds
    expect(host.getBuffer()).toContain(
      '|----(V31)---------------(V32)---------------------------------------(V33)------------------------X|',
    );

    renderer.dispose();
  });
});
