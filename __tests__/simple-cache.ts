import { SimpleCache } from "../src/index"

describe("SimpleCache", async () => {
	it("should not accept a capacity less than 1", async () => {
		expect(() => SimpleCache(0)).toThrowError(RangeError)
		expect(() => SimpleCache(0.9)).toThrowError(RangeError)
		expect(() => SimpleCache(-1)).toThrowError(RangeError)
	})

	it("should toString", async () => {
		let c = SimpleCache<string, string>(1, {
			key: "string",
			value: "Snapshot",
		})

		expect(String(c)).toMatchSnapshot("empty")
		c.write("test", "test")
		expect(String(c)).toMatchSnapshot("with size")
		expect(
			String(SimpleCache(100, { key: "any", value: "Anything" }))
		).toMatchSnapshot("custom")
		expect(String(SimpleCache(1))).toMatchSnapshot("no label")
	})

	it("should return keys with Cache.keys()", async () => {
		let cap = 10
		let c = SimpleCache<string, number>(cap, {
			key: "string",
			value: "number",
		})
		let keys = []

		for (let i = 1; i <= cap; i += 1) {
			let key = i.toString(10)
			c.write(key, i)
			keys.push(key)
		}

		expect(c.keys()).toEqual(keys)
	})

	it("should return values with Cache.values()", async () => {
		let cap = 10
		let c = SimpleCache<string, number>(cap, {
			key: "string",
			value: "number",
		})
		let values = []

		for (let i = 1; i <= cap; i += 1) {
			c.write(i.toString(10), i)
			values.push(i)
		}

		expect(c.values()).toEqual(values)
	})

	it("should toJSON", async () => {
		let c = SimpleCache<string, number>(10, {
			key: "string",
			value: "number",
		})

		for (let i = 1; i <= 10; i += 1) {
			c.write(i.toString(10), i)
		}

		expect(JSON.stringify(c, null, 2)).toMatchSnapshot()
	})

	it("should write and read from cache", async () => {
		let test = {
			key: "test",
			value: "pictalk",
		}
		let c = SimpleCache<string, string>(8)

		expect(c.read(test.key)).toBe(undefined)

		c.write(test.key, test.value)
		expect(c.read(test.key)).toBe(test.value)
	})

	it("should remove an item by key", async () => {
		let test = {
			key: "test",
			value: "pictalk",
		}
		let c = SimpleCache<string, string>(8)
		c.write(test.key, test.value)
		c.remove(test.key)
		expect(c.read(test.key)).toBe(undefined)
	})

	it("should return the size of the cache", async () => {
		let c = SimpleCache<string, number>(10)

		for (let i = 1; i <= 10; i += 1) {
			c.write(i.toString(10), i)
		}

		expect(c.size()).toBe(10)
	})

	it("should return the entries of the cache", async () => {
		let c = SimpleCache<string, number>(10)

		for (let i = 1; i <= 10; i += 1) {
			c.write(i.toString(10), i)
		}

		expect(c.entries()).toEqual([
			["1", 1],
			["2", 2],
			["3", 3],
			["4", 4],
			["5", 5],
			["6", 6],
			["7", 7],
			["8", 8],
			["9", 9],
			["10", 10],
		])
	})

	it("should invalidate cache", async () => {
		let c = SimpleCache<string, number>(10)

		for (let i = 1; i <= 10; i += 1) {
			c.write(i.toString(10), i)
		}

		c.invalidate()
		expect(c.size()).toBe(0)

		for (let i = 1; i <= 10; i += 1) {
			expect(c.read(i.toString(10))).toBe(undefined)
		}
	})

	it("should not overflow the cache size", async () => {
		let cap = 3
		let runs = cap * cap
		let overwrites = 3
		let c = SimpleCache<string, number>(cap)

		for (let i = 1; i <= runs; i += 1) {
			c.write(i.toString(10), i)
			// perform excess writes to test the overwrite logic maintaining size/cap
			for (let j = 1; j <= overwrites; j += 1) {
				c.write(i.toString(10), i)
			}
		}

		expect(c.size()).toBe(cap)
		expect(c.values().length).toBe(cap)
	})

	it("should update values without increasing the size on same key", async () => {
		let c = SimpleCache<string, string>(10, {
			key: "string",
			value: "string",
		})
		let k = "same key"
		let fn = (n: number) => `updated value: ${n}`

		for (let i = 1; i <= 10; i += 1) {
			c.write(k, fn(i))
		}

		expect(c.size()).toBe(1)
		expect(c.read(k)).toBe(fn(10))
	})

	it("should preserve the newest write even when it has the lowest read hits", async () => {
		let cap = 10
		let test_hits = 2
		let c = SimpleCache<string, number>(cap, {
			key: "string",
			value: "number",
		})

		// Fill the cache up with values that all have a few read hits
		// so the new overflow value is the prime candidate for removal
		// in the cache rebalance (rebalance priority is based on read hits).
		for (let i = 1; i <= cap; i += 1) {
			c.write(i.toString(10), i)
			for (let j = 1; j <= test_hits; j += 1) {
				c.read(i.toString(10))
			}
		}

		let test = {
			key: (cap + 1).toString(10),
			val: cap + 1,
		}

		c.write(test.key, test.val)
		expect(c.read(test.key)).toBe(test.val)
	})
})
