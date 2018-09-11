import { EphemeralCache } from "./cache.interface"

type EphemeralCacheItem<T> = {
	hits: number
	/**
	 * milliseconds
	 */
	timestamp: number
	key: string
	value: T
}

/**
 * EphemeralCache extends the Cache interface to store values temporarily.
 */
export function TemporaryCache<T>(
	capacity: number,
	durationMs: number,
	typeLabel: string = "any"
): EphemeralCache<T> {
	if (capacity < 1 || durationMs < 1) {
		throw new RangeError(
			`EphemeralCache requires an integer value of 1 or greater for capacity and durationMs`
		)
	}

	capacity = Math.trunc(capacity)
	let size = 0
	let c: { [key: string]: EphemeralCacheItem<T> } = {}

	function purge() {
		let now = Date.now()
		for (let { timestamp, key } of Object.values(c)) {
			if (timestamp + durationMs > now) {
				cache.remove(key)
			}
		}
	}

	let interval_id: void | NodeJS.Timer = setInterval(purge, durationMs)

	const cache: EphemeralCache<T> = {
		stopInterval() {
			if (interval_id) {
				interval_id = clearInterval(interval_id)
			}
		},

		startInterval() {
			interval_id = setInterval(purge, durationMs)
		},

		read(k) {
			let item = c[k]
			if (!item) {
				return undefined
			}

			// Our interval might be between ticks.
			if (Date.now() > item.timestamp + durationMs) {
				cache.remove(k)
				return undefined
			}

			item.hits += 1

			return item.value
		},

		write(k, v) {
			// If we're doing a cache overwrite,
			// update the value without incrementing the size.
			if (c[k]) {
				let i = c[k]
				i.value = v
				i.timestamp = Date.now()
				return
			}

			c[k] = { key: k, value: v, hits: 0, timestamp: Date.now() }
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
			return `EphemeralCache<${typeLabel}> { size: ${size}, capacity: ${capacity}, durationMs: ${durationMs} }`
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
		let item: EphemeralCacheItem<T>

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
