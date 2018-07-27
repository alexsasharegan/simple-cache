/**
 * Cache is an interface for caching a single value type, `T`.
 * It's primary functionality includes:
 * - `Cache.write`: write a value at a key
 * - `Cache.read`: read a value from a key
 * - `Cache.remove`: remove a value by key
 * - `Cache.invalidate`: empty the cache
 */
export interface Cache<T> {
  /**
   * Read a value from the cache by key. May not return a value if cache miss.
   */
  read(key: string): T | void;
  /**
   * Write a value to the cache at a given key.
   */
  write(key: string, value: T): void;
  /**
   * Delete a keyed value from the cache.
   */
  remove(key: string): void;
  /**
   * Wipe the cache clean.
   */
  invalidate(): void;
  /**
   * Returns the current size of the cache.
   */
  size(): number;
  /**
   * Returns an array of all the keys in the cache.
   */
  keys(): string[];
  /**
   * Returns an array of all the values in the cache.
   */
  values(): T[];
  /**
   * Returns an array of [key, value] array tuples
   */
  entries(): Array<[string, T]>;
  /**
   * Returns a string representation of the cache with its label, size, and
   * capacity.
   */
  toString(): string;
  /**
   * Serializeable for JSON.stringify.
   */
  toJSON(): { [key: string]: T };
}

type CacheItem<T> = {
  hits: number;
  key: string;
  value: T;
};

/**
 * SimpleCache follows the Cache interface to store values by key (string).
 *
 * When deciding on a cache capacity, it's important to consider the size of
 * `T * maxCapacity` in the cache and how much space it will hold in memory.
 * It performs a _"rebalance"_ on each write that pushes it over capacity.
 * A cache rebalance is as expensive as an array sort and an object key delete.
 */
export function SimpleCache<T>(
  maxCapacity: number,
  typeLabel: string = "any"
): Cache<T> {
  let size = 0;
  let c: { [key: string]: CacheItem<T> } = {};

  const cache: Cache<T> = {
    read(k) {
      let item = c[k];
      if (!item) {
        return undefined;
      }

      if (item.hits < Number.MAX_SAFE_INTEGER) {
        item.hits += 1;
      }

      return item.value;
    },

    write(k, v) {
      // If we're doing a cache overwrite,
      // update the value without incrementing the size.
      if (c[k]) {
        c[k].value = v;
        return;
      }

      c[k] = { key: k, value: v, hits: 0 };
      size += 1;

      if (size > maxCapacity) {
        rebalance(k);
      }
    },

    remove(key: string) {
      delete c[key];
      size -= 1;
    },

    invalidate() {
      c = {};
      size = 0;
    },

    size() {
      return size;
    },

    keys() {
      return Object.keys(c);
    },

    values() {
      return Object.values(c).map(x => x.value);
    },

    entries() {
      return Object.entries(c).map(([k, v]) => {
        let ret: [string, T] = [k, v.value];
        return ret;
      });
    },

    toString() {
      return `SimpleCache<${typeLabel}> { size: ${size}, capacity: ${maxCapacity} }`;
    },

    toJSON() {
      let json: { [key: string]: T } = {};

      return Object.values(c).reduce((j, item) => {
        j[item.key] = item.value;
        return j;
      }, json);
    },
  };

  function rebalance(newestKey: string) {
    let values = Object.values(c).sort((a, b) => a.hits - b.hits);
    let item: CacheItem<T>;

    while (size > maxCapacity) {
      // Pull items off the least accessed side of the array.
      // Use `!` to assert our value is not void. Tests verify we can trust this.
      item = values.shift()!;

      if (item.key == newestKey) {
        continue;
      }

      cache.remove(item.key);
    }
  }

  return cache;
}
