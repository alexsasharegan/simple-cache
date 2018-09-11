import { Cache } from "./cache.interface"

type CacheItem<T> = {
	hits: number
	key: string
	value: T
}

/**
 * SimpleCache follows the Cache interface to store values by key (string).
 *
 * When deciding on a cache capacity, it's important to consider the size of
 * `T * capacity` in the cache and how much space it will hold in memory.
 * It performs a _"rebalance"_ on each write that pushes it over capacity.
 * A cache rebalance is as expensive as an array sort and an object key delete.
 */
export function SimpleCache<T>(
	capacity: number,
	typeLabel: string = "any"
): Cache<T> {
	if (capacity < 1) {
		throw new RangeError(
			`SimpleCache requires an integer value of 1 or greater`
		)
	}

	capacity = Math.trunc(capacity)
	let size = 0
	let c: { [key: string]: CacheItem<T> } = {}

	const cache: Cache<T> = {
		read(k) {
			let item = c[k]
			if (!item) {
				return undefined
			}

			item.hits += 1

			return item.value
		},

		write(k, v) {
			// If we're doing a cache overwrite,
			// update the value without incrementing the size.
			if (c[k]) {
				c[k].value = v
				return
			}

			c[k] = { key: k, value: v, hits: 0 }
			size += 1

			if (size > capacity) {
				rebalance(k)
			}
		},

		remove(k: string) {
			delete c[k]
			size -= 1
		},

		invalidate() {
			c = {}
			size = 0
		},

		size() {
			return size
		},

		keys() {
			return Object.keys(c)
		},

		values() {
			return Object.values(c).map(x => x.value)
		},

		entries() {
			return Object.entries(c).map(([k, v]) => {
				let ret: [string, T] = [k, v.value]
				return ret
			})
		},

		toString() {
			return `SimpleCache<${typeLabel}> { size: ${size}, capacity: ${capacity} }`
		},

		toJSON() {
			let json: { [k: string]: T } = {}

			return Object.values(c).reduce((j, item) => {
				j[item.key] = item.value
				return j
			}, json)
		},
	}

	function rebalance(newestKey: string) {
		let values = Object.values(c).sort((a, b) => a.hits - b.hits)
		let item: CacheItem<T>

		while (size > capacity) {
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
