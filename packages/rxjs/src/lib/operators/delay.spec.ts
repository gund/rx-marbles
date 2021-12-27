import {
  BasicMarbleRuntime,
  MarbleSourceClosedEvent,
  MarbleSourceValueEvent,
} from '@rx-marbles/core';
import { EmitableStubMarbleTimeline } from '@rx-marbles/core/testing';
import { TextMarbleRenderer } from '@rx-marbles/renderer.text';
import { StubTextHost } from '@rx-marbles/renderer.text/testing';
import { DelayMarbleOperator } from './delay';

describe('DelayMarbleOperator', () => {
  it('should add delay to time of input events', () => {
    const input1 = new EmitableStubMarbleTimeline<string>();
    input1.getName.mockReturnValue('Letters');
    input1.getBounds.mockReturnValue({ start: 0, end: 100 });
    const delayOperator = new DelayMarbleOperator(input1, 10);
    const delayRuntime = new BasicMarbleRuntime(delayOperator);
    const host = new StubTextHost();
    const renderer = new TextMarbleRenderer({ host });

    renderer.render(delayRuntime);

    input1.emit(new MarbleSourceValueEvent(0, 'a'));
    input1.emit(new MarbleSourceValueEvent(25, 'b'));
    input1.emit(new MarbleSourceValueEvent(50, 'c'));
    input1.emit(new MarbleSourceValueEvent(75, 'd'));
    input1.emit(new MarbleSourceClosedEvent(100));

    // Letters: (a)-(b)-(c)-(d)-X
    expect(host.getBuffer()).toMatch(/\(a\)-+\(b\)-+\(c\)-+\(d\)-+X/);
    // Delay: -(a)-(b)-(c)-(d)-X
    expect(host.getBuffer()).toMatch(/-+\(a\)-+\(b\)-+\(c\)-+\(d\)-+X/);

    renderer.dispose();
  });

  it('should clamp delayed time to top bound', () => {
    const callback = jest.fn();
    const input1 = new EmitableStubMarbleTimeline<string>();
    input1.getName.mockReturnValue('Letters');
    input1.getBounds.mockReturnValue({ start: 0, end: 100 });
    const delayOperator = new DelayMarbleOperator(input1, 10);
    const delayRuntime = new BasicMarbleRuntime(delayOperator);
    const host = new StubTextHost();
    const renderer = new TextMarbleRenderer({ host });

    renderer.render(delayRuntime);
    delayOperator.subscribe(callback);

    input1.emit(new MarbleSourceValueEvent(95, 'a'));
    input1.emit(new MarbleSourceClosedEvent(100));

    console.log(host.getBuffer());
    // Letters: (a)-(b)-(c)-(d)-X
    expect(host.getBuffer()).toMatch(/-+\(a\)-+X/);
    // Delay: -(a)-(b)-(c)-(d)-X
    expect(host.getBuffer()).toMatch(/-+\(a\)X/);
    expect(callback).toHaveBeenCalledWith(new MarbleSourceValueEvent(100, 'a'));

    renderer.dispose();
  });
});
