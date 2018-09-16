import { Cache } from "./cache.interface"
import { CoreCache } from "./core"

/**
 * SimpleCache follows the Cache interface to store values by key (string).
 *
 * When deciding on a cache capacity, it's important to consider the size of
 * `T * capacity` in the cache and how much space it will hold in memory.
 * It performs a _"rebalance"_ on each write that pushes it over capacity.
 * A cache rebalance is as expensive as an array sort and an object key delete.
 */
export function SimpleCache<K, V>(
	capacity: number,
	typeLabel: string = "any"
): Cache<K, V> {
	const {
		clear,
		entries,
		invalidate,
		keys,
		read,
		remove,
		size,
		values,
		write,
	} = CoreCache<K, V>(capacity)

	const cache: Cache<K, V> = {
		clear,
		entries,
		invalidate,
		keys,
		read,
		remove,
		size,
		values,
		write,
		toString() {
			return `${
				SimpleCache.name /* makes name refactoring simpler */
			}<${typeLabel}> { size: ${size()}, capacity: ${capacity} }`
		},

		toJSON() {
			return entries()
		},
	}

	return cache
}
