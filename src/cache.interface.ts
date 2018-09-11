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
	read(key: string): T | void
	/**
	 * Write a value to the cache at a given key.
	 */
	write(key: string, value: T): void
	/**
	 * Delete a keyed value from the cache.
	 */
	remove(key: string): void
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
	keys(): string[]
	/**
	 * Returns an array of all the values in the cache.
	 */
	values(): T[]
	/**
	 * Returns an array of [key, value] array tuples
	 */
	entries(): Array<[string, T]>
	/**
	 * Returns a string representation of the cache with its label, size, and
	 * capacity.
	 */
	toString(): string
	/**
	 * Serializable for JSON.stringify.
	 */
	toJSON(): { [key: string]: T }
}

export interface EphemeralCache<T> extends Cache<T> {
	startInterval(): void
	stopInterval(): void
}
