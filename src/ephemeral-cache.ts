import { Option } from "safe-types"
import { Cache, TypeLabel } from "./cache.interface"
import { CoreCache, CacheItem } from "./core"

interface EphemeralCacheItem<K, V> extends CacheItem<K, V> {
	/**
	 * Unix milliseconds timestamp representing the time at which a value expires.
	 */
	expiration: number
}

/**
 * EphemeralCache extends the Cache interface to store values temporarily.
 * The implementation does not use timers, so expired values are purged on
 * write/read. To avoid blocking read/write with an `O(n)` purge, the purge is
 * deferred to the next tick using a Promise. This means that the `Cache.size`
 * method is non-deterministic--you can write a value that defers a purge, call
 * size and receive `n`, then try to read `n` values, but because they are
 * expired, you read `n - x(expired)` items. This tradeoff maintains expiration
 * accuracy and prevents read/write call stacks from blocking for a cache
 * expiration purge.
 */
export function EphemeralCache<K, V>(
	capacity: number,
	durationMs: number,
	typeLabel: TypeLabel = { key: "any", value: "any" }
): Cache<K, V> {
	if (durationMs < 1 || !Number.isInteger(durationMs)) {
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

	let lastPurged = 0
	/**
	 * `defer_purge` compares timestamps on `lastPurged`, and if the `durationMs`
	 * has passed, enqueues a purge on the next tick to prevent callers from
	 * blocking the `O(n)` cost (`n` is the current cache size).
	 */
	function defer_purge() {
		if (Date.now() > lastPurged + durationMs) {
			// Promise.resolve will run on the next tick
			Promise.resolve().then(() => {
				let c = get_store() as Map<K, EphemeralCacheItem<K, V>>
				let now = Date.now()

				for (let { expiration, key } of c.values()) {
					if (now > expiration) {
						remove(key)
					}
				}

				lastPurged = now
			})
		}
	}

	const cache: Cache<K, V> = {
		clear,
		entries,
		invalidate,
		keys,
		remove,
		size,
		values,
		get(k) {
			return Option.of(cache.read(k))
		},

		/**
		 * Implements a custom `read` method so time-to-live expiration is honored.
		 */
		read(k) {
			let c = get_store() as Map<K, EphemeralCacheItem<K, V>>
			defer_purge()

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

		write(k, v) {
			write(k, v)
			defer_purge()
		},

		toString() {
			return `${EphemeralCache.name /* makes name refactoring simpler */}<${
				typeLabel.key
			}, ${
				typeLabel.value
			}> { size: ${size()}, capacity: ${capacity}, durationMs: ${durationMs} }`
		},

		toJSON() {
			return entries()
		},
	}

	return cache
}
