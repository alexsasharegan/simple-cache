import { BaseCache } from "./cache.interface"

export interface CacheItem<K, V> {
	hits: number
	key: K
	value: V
}

type Rebalancer<K> = (newKey: K) => void

export interface CacheInternals<K, V> {
	get_store(): Map<K, CacheItem<K, V>>
}

export type ItemFactory<K, V> = (key: K, value: V) => CacheItem<K, V>

export interface BaseCacheOptions<K, V> {
	itemFactory?: ItemFactory<K, V>
}

export function create_rebalancer<K, V>(
	c: Map<K, CacheItem<K, V>>,
	capacity: number
): Rebalancer<K> {
	return function rebalance_cache(newKey: K) {
		let items = Array.from(c.values()).sort((a, b) => a.hits - b.hits)

		while (c.size > capacity) {
			// Pull items off the least accessed side of the array.
			// Use `!` to assert our value is not void.
			// Cache overflow tests verify we can trust this.
			let { key } = items.shift()!
			// Guard against removing the item just written to the cache
			if (key == newKey) {
				continue
			}

			c.delete(key)
		}
	}
}

function baseItemFactory<K, V>(key: K, value: V): CacheItem<K, V> {
	return {
		key,
		value,
		hits: 0,
	}
}

/**
 * SimpleCache follows the Cache interface to store values by key (string).
 *
 * When deciding on a cache capacity, it's important to consider the size of
 * `T * capacity` in the cache and how much space it will hold in memory.
 * It performs a _"rebalance"_ on each write that pushes it over capacity.
 * A cache rebalance is as expensive as an array sort and an object key delete.
 */
export function CoreCache<K, V>(
	capacity: number,
	opts: BaseCacheOptions<K, V> = {}
): BaseCache<K, V> & CacheInternals<K, V> {
	if (capacity < 1 || !Number.isInteger(capacity)) {
		throw new RangeError(
			`Cache requires an integer value greater than or equal to 1`
		)
	}

	let c: Map<K, CacheItem<K, V>> = new Map()
	let rebalance = create_rebalancer(c, capacity)
	let { itemFactory = baseItemFactory } = opts

	const cache: BaseCache<K, V> & CacheInternals<K, V> = {
		get_store() {
			return c
		},

		read(k) {
			let item = c.get(k)
			if (!item) {
				return undefined
			}

			item.hits += 1

			return item.value
		},

		write(k, v) {
			let item = itemFactory(k, v)

			let existing = c.get(k)
			if (existing) {
				// Writes that are updates should increment the hit count
				// rather than initialize it.
				item.hits += existing.hits
			}

			c.set(k, item)

			if (c.size > capacity) {
				rebalance(k)
			}
		},

		remove(k) {
			c.delete(k)
		},

		invalidate() {
			cache.clear()
		},

		clear() {
			c.clear()
		},

		size() {
			return c.size
		},

		keys() {
			return Array.from(c.keys())
		},

		values() {
			return Array.from(c.values(), x => x.value)
		},

		entries() {
			return Array.from(c.entries(), ([k, v]) => {
				// Strip out the internals
				// (TS cast is to preserve the correct tuple shape)
				return [k, v.value] as [K, V]
			})
		},
	}

	return cache
}
