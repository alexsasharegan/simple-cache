import { Option } from "safe-types"

export interface BaseCache<K, V> {
	/**
	 * Read a value from the cache by key as an `Option<V>`.
	 */
	get(key: K): Option<V>
	/**
	 * Read a value from the cache by key. May not return a value if cache miss.
	 */
	read(key: K): V | undefined
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
	clear(): void
	/**
	 * Wipe the cache clean. (Alias for clear)
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
}

/**
 * Cache is an interface for caching key/value pairs of types `K` and `V`.
 * It's primary functionality includes:
 * - `Cache.write`: write a value at a key
 * - `Cache.read`: read a value from a key
 * - `Cache.get`: read a value as an `Option<V>` (maybe type)
 * - `Cache.remove`: remove a value by key
 * - `Cache.clear`: empty the cache
 */
export interface Cache<K, V> extends BaseCache<K, V> {
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

export interface TypeLabel {
	key: string
	value: string
}
