export function groupByKey<T>(
  items: readonly T[],
  keySelector: (item: T) => string,
): Map<string, T[]> {
  const map = new Map<string, T[]>();

  for (const item of items) {
    const key = keySelector(item);
    const bucket = map.get(key);
    if (bucket) {
      bucket.push(item);
    } else {
      map.set(key, [item]);
    }
  }

  return map;
}
