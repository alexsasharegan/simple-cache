import { TemporaryCache } from "../src/index"

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

describe("EphemeralCache", async () => {
	it("should clear cache items after duration has expired", async () => {
		let durationMs = 20
		let c = TemporaryCache<string, number>(10, durationMs, "number")
		sleep(durationMs * 2).then(() => c.stopInterval())

		let item = { key: "0", value: 1 }

		expect(c.read(item.key)).not.toBeDefined()
		c.write(item.key, item.value)
		expect(c.read(item.key)).toBe(item.value)
		await sleep(durationMs + 1)
		expect(c.read(item.key)).not.toBeDefined()

		c.stopInterval()
	})
})
