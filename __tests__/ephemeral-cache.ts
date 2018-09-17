import { EphemeralCache } from "../src/index"

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

describe("EphemeralCache", async () => {
	it("should throw with ", async () => {
		expect(() => EphemeralCache(1, 0)).toThrowError(RangeError)
		expect(() => EphemeralCache(1, 0.9)).toThrowError(RangeError)
		expect(() => EphemeralCache(1, 10.9)).toThrowError(RangeError)
		expect(() => EphemeralCache(1, -1)).toThrowError(RangeError)
	})

	it("should toString", async () => {
		let c = EphemeralCache<string, string>(1, 100, {
			key: "string",
			value: "Snapshot",
		})

		expect(String(c)).toMatchSnapshot("empty")
		c.write("test", "test")
		expect(String(c)).toMatchSnapshot("with size")
		expect(
			String(EphemeralCache(100, 100, { key: "any", value: "Anything" }))
		).toMatchSnapshot("custom")
		expect(String(EphemeralCache(1, 100))).toMatchSnapshot("no label")
	})

	it("should clear cache items after duration has expired", async () => {
		let durationMs = 20
		let c = EphemeralCache<string, number>(10, durationMs, {
			key: "string",
			value: "number",
		})

		let item = { key: "0", value: 1 }

		expect(c.read(item.key)).not.toBeDefined()
		c.write(item.key, item.value)
		expect(c.read(item.key)).toBe(item.value)
		await sleep(durationMs + 1)
		expect(c.read(item.key)).not.toBeDefined()
	})

	it("should not return item after duration has expired", async () => {
		let durationMs = 20
		let c = EphemeralCache<number, number>(10, durationMs, {
			key: "string",
			value: "number",
		})

		let item = { key: 1, value: 1 }
		// Write our value to the cache in between the interval
		c.write(item.key, item.value)
		await sleep(durationMs * 2)

		expect(c.read(item.key)).not.toBeDefined()
	})

	it("should toJSON", async () => {
		let durationMs = 20
		let c = EphemeralCache<string, number>(10, durationMs, {
			key: "string",
			value: "number",
		})

		for (let i = 1; i <= 10; i += 1) {
			c.write(i.toString(10), i)
		}

		expect(JSON.stringify(c, null, 2)).toMatchSnapshot()
	})
})
