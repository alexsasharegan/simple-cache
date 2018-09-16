import { Cache } from "./cache.interface"
import { CoreCache, CacheItem } from "./core"

interface EphemeralCacheItem<K, V> extends CacheItem<K, V> {
	/**
	 * unix milliseconds
	 */
	expiration: number
}

/**
 * EphemeralCache extends the Cache interface to store values temporarily.
 */
export function EphemeralCache<K, V>(
	capacity: number,
	durationMs: number,
	typeLabel: string = "any"
): Cache<K, V> {
	if (durationMs < 1) {
		throw new RangeError(
			`${
				EphemeralCache.name
			} requires an integer value greater than or equal to 1 for capacity and durationMs`
		)
	}

	const {
		clear,
		entries,
		get_store,
		invalidate,
		keys,
		remove,
		size,
		values,
		write,
	} = CoreCache<K, V>(capacity, { itemFactory })

	function itemFactory<K, V>(key: K, value: V): EphemeralCacheItem<K, V> {
		return {
			key,
			value,
			hits: 0,
			expiration: Date.now() + durationMs,
		}
	}

	const cache: Cache<K, V> = {
		write,
		clear,
		entries,
		invalidate,
		keys,
		remove,
		size,
		values,
		/**
		 * Implements a custom `read` method so time-to-live expiration is honored.
		 */
		read(k) {
			let c = get_store() as Map<K, EphemeralCacheItem<K, V>>

			let item = c.get(k)
			if (!item) {
				return undefined
			}

			if (Date.now() > item.expiration) {
				remove(k)
				return undefined
			}

			item.hits += 1

			return item.value
		},

		toString() {
			return `${
				EphemeralCache.name /* makes name refactoring simpler */
			}<${typeLabel}> { size: ${size()}, capacity: ${capacity}, durationMs: ${durationMs} }`
		},

		toJSON() {
			return entries()
		},
	}

	return cache
}
