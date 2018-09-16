import { EphemeralCache } from "./cache.interface"

type EphemeralCacheItem<K, V> = {
	hits: number
	/**
	 * unix milliseconds
	 */
	expiration: number
	key: K
	value: V
}

/**
 * EphemeralCache extends the Cache interface to store values temporarily.
 */
export function TemporaryCache<K, V>(
	capacity: number,
	durationMs: number,
	typeLabel: string = "any"
): EphemeralCache<K, V> {
	if (capacity < 1 || durationMs < 1) {
		throw new RangeError(
			`EphemeralCache requires an integer value of 1 or greater for capacity and durationMs`
		)
	}

	capacity = Math.trunc(capacity)
	let c: Map<K, EphemeralCacheItem<K, V>> = new Map()

	function purge() {
		let now = Date.now()
		for (let { expiration, key } of c.values()) {
			if (now > expiration) {
				cache.remove(key)
			}
		}
	}

	let interval_id: void | NodeJS.Timer = setInterval(purge, durationMs)

	const cache: EphemeralCache<K, V> = {
		stopInterval() {
			if (interval_id) {
				interval_id = clearInterval(interval_id)
			}
		},

		startInterval() {
			interval_id = setInterval(purge, durationMs)
		},

		read(k) {
			let item = c.get(k)
			if (!item) {
				return undefined
			}

			// Our interval might be between ticks.
			if (Date.now() > item.expiration) {
				cache.remove(k)
				return undefined
			}

			item.hits += 1

			return item.value
		},

		write(k, v) {
			// If we're doing a cache overwrite,
			// update the value without incrementing the size.
			let item = c.get(k)
			if (item) {
				item.value = v
				item.expiration = Date.now() + durationMs
				return
			}

			c.set(k, {
				key: k,
				value: v,
				hits: 0,
				expiration: Date.now() + durationMs,
			})
			if (c.size > capacity) {
				rebalance(k)
			}
		},

		remove(k) {
			c.delete(k)
		},

		invalidate() {
			c.clear()
		},

		size() {
			return c.size
		},

		keys() {
			return [...c.keys()]
		},

		values() {
			return [...c.values()].map(x => x.value)
		},

		entries() {
			return [...c.entries()].map(([k, v]) => {
				let e: [K, V] = [k, v.value]
				return e
			})
		},

		toString() {
			return `EphemeralCache<${typeLabel}> { size: ${
				c.size
			}, capacity: ${capacity}, durationMs: ${durationMs} }`
		},

		toJSON() {
			return cache.entries()
		},
	}

	function rebalance(newestKey: K) {
		let values = Object.values(c).sort((a, b) => a.hits - b.hits)
		let item: EphemeralCacheItem<K, V>

		while (c.size > capacity) {
			// Pull items off the least accessed side of the array.
			// Use `!` to assert our value is not void.
			// Cache overflow tests verify we can trust this.
			item = values.shift()!

			if (item.key == newestKey) {
				continue
			}

			cache.remove(item.key)
		}
	}

	return cache
}
