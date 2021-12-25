export function moveItemInArray(
  array: unknown[],
  fromIdx: number,
  toIdx: number,
): void {
  const direction = fromIdx - toIdx > 0 ? -1 : 1;
  const startI = direction > 0 ? fromIdx : fromIdx;
  const endI = direction > 0 ? toIdx : toIdx - 1;

  const movedItem = array[fromIdx];

  for (let i = startI; i !== endI; i += direction) {
    array[i] = array[i + direction];
  }

  array[toIdx] = movedItem;
}
