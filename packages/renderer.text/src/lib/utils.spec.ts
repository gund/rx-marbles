import { moveItemInArray } from './utils';

describe('Utils', () => {
  describe('moveItemInArray()', () => {
    it('should move up item in array', () => {
      let array = [1, 2, 3, 4, 5];

      moveItemInArray(array, 1, 3);
      expect(array).toEqual([1, 3, 4, 2, 5]);

      array = [1, 2, 3, 4, 5];

      moveItemInArray(array, 3, 4);
      expect(array).toEqual([1, 2, 3, 5, 4]);
    });

    it('should move down item in array', () => {
      let array = [1, 2, 3, 4, 5];

      moveItemInArray(array, 2, 0);
      expect(array).toEqual([3, 1, 2, 4, 5]);

      array = [1, 2, 3, 4, 5];

      moveItemInArray(array, 3, 2);
      expect(array).toEqual([1, 2, 4, 3, 5]);
    });
  });
});
