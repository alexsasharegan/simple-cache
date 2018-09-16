/**
 * Cache is an interface for caching a single value type, `T`.
 * It's primary functionality includes:
 * - `Cache.write`: write a value at a key
 * - `Cache.read`: read a value from a key
 * - `Cache.remove`: remove a value by key
 * - `Cache.invalidate`: empty the cache
 */
export interface Cache<K, V> {
	/**
	 * Read a value from the cache by key. May not return a value if cache miss.
	 */
	read(key: K): V | void
	/**
	 * Write a value to the cache at a given key.
	 */
	write(key: K, value: V): void
	/**
	 * Delete a keyed value from the cache.
	 */
	remove(key: K): void
	/**
	 * Wipe the cache clean.
	 */
	invalidate(): void
	/**
	 * Returns the current size of the cache.
	 */
	size(): number
	/**
	 * Returns an array of all the keys in the cache.
	 */
	keys(): K[]
	/**
	 * Returns an array of all the values in the cache.
	 */
	values(): V[]
	/**
	 * Returns an array of [key, value] array tuples
	 */
	entries(): Array<[K, V]>
	/**
	 * Returns a string representation of the cache with its label, size, and
	 * capacity.
	 */
	toString(): string
	/**
	 * Serializable for JSON.stringify.
	 */
	toJSON(): Array<[K, V]>
}

export interface EphemeralCache<K, V> extends Cache<K, V> {
	startInterval(): void
	stopInterval(): void
}
