import {
  BasicMarbleRuntime,
  MarbleSourceClosedEvent,
  MarbleSourceStartEvent,
  MarbleSourceValueEvent,
} from '@rx-marbles/core';
import { EmitableStubMarbleTimeline } from '@rx-marbles/core/testing';
import { TextMarbleRenderer } from '@rx-marbles/renderer.text';
import { StubTextHost } from '@rx-marbles/renderer.text/testing';
import { MapMarbleOperator } from './map';

describe('MapMarbleOperator', () => {
  it('should apply map function to input events', () => {
    const input1 = new EmitableStubMarbleTimeline<string>();
    input1.getName.mockReturnValue('Letters');
    input1.getBounds.mockReturnValue({ start: 0, end: 10 });
    const mapCharCodeOperator = new MapMarbleOperator([input1], ([input1]) =>
      input1.charCodeAt(0),
    );
    const mapRuntime = new BasicMarbleRuntime(mapCharCodeOperator);
    const host = new StubTextHost();
    const renderer = new TextMarbleRenderer({ host });

    renderer.render(mapRuntime);

    input1.emit(new MarbleSourceStartEvent(0));

    input1.emit(new MarbleSourceValueEvent(0, 'a'));
    input1.emit(new MarbleSourceValueEvent(5, 'b'));
    input1.emit(new MarbleSourceValueEvent(7, 'c'));

    input1.emit(new MarbleSourceClosedEvent(10));

    // Letters: (a)-(b)-(c)-X
    expect(host.getBuffer()).toMatch(/\(a\)-+\(b\)-+\(c\)-+X/);
    // Char Codes: (97)-(98)-(99)-X
    expect(host.getBuffer()).toMatch(/\(97\)-+\(98\)-+\(99\)-+X/);

    renderer.dispose();
  });
});
