import { Stream, StreamSource, StringStreamBufferFactory } from './stream';

describe('Stream', () => {
  it('should stream data', async () => {
    const stringSource: StreamSource<string> = (controller) => {
      controller.append('chunk1');
      setTimeout(() => controller.append('chunk2').append('chunk3'), 1000);
      setTimeout(() => controller.append('chunk4'), 1500);
      setTimeout(() => controller.complete(), 2000);
    };
    stringSource.bufferFactorty = new StringStreamBufferFactory();
    const stream = new Stream(stringSource);
    const callback = jest.fn();

    for await (const chunk of stream.getData()) {
      callback(chunk);
    }

    expect(callback).toHaveBeenNthCalledWith(1, 'chunk1');
    expect(callback).toHaveBeenNthCalledWith(2, 'chunk2chunk3');
    expect(callback).toHaveBeenNthCalledWith(3, 'chunk4');
  });
});
