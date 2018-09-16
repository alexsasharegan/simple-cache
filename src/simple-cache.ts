import { Cache } from "./cache.interface"

type CacheItem<K, V> = {
	hits: number
	key: K
	value: V
}

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
	if (capacity < 1) {
		throw new RangeError(
			`SimpleCache requires an integer value of 1 or greater`
		)
	}

	capacity = Math.trunc(capacity)
	let c: Map<K, CacheItem<K, V>> = new Map()

	const cache: Cache<K, V> = {
		read(k) {
			let item = c.get(k)
			if (!item) {
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
				return
			}

			c.set(k, { key: k, value: v, hits: 0 })

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
			return `SimpleCache<${typeLabel}> { size: ${
				c.size
			}, capacity: ${capacity} }`
		},

		toJSON() {
			return cache.entries()
		},
	}

	function rebalance(newestKey: K) {
		let values = [...c.values()].sort((a, b) => a.hits - b.hits)
		let item: CacheItem<K, V>

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
