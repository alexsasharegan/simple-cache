import { SimpleCache } from "../src/simple-cache";

describe("SimpleCache", async () => {
  it("should toString", async () => {
    let c = SimpleCache<string>(1, "Snapshot");

    expect(String(c)).toMatchSnapshot("SimpleCache.toString");
  });

  it("should be iterable", async () => {
    let c = SimpleCache<number>(10, "number");

    for (let i = 1; i <= 10; i += 1) {
      c.write(i.toString(10), i);
    }

    for (let entry of c.entries()) {
      expect(Array.isArray(entry)).toBe(true);
      let [key, value] = entry;
      expect(typeof key).toBe("string");
      expect(typeof value).toBe("number");
    }
  });

  it("should toJSON", async () => {
    let c = SimpleCache<number>(10, "number");

    for (let i = 1; i <= 10; i += 1) {
      c.write(i.toString(10), i);
    }

    expect(JSON.stringify(c, null, 2)).toMatchSnapshot();
  });

  it("should write and read from cache", async () => {
    let test = {
      key: "test",
      value: "pictalk",
    };
    let c = SimpleCache<string>(8);

    expect(c.read(test.key)).toBe(undefined);

    c.write(test.key, test.value);
    expect(c.read(test.key)).toBe(test.value);
  });

  it("should remove an item by key", async () => {
    let test = {
      key: "test",
      value: "pictalk",
    };
    let c = SimpleCache<string>(8);
    c.write(test.key, test.value);
    c.remove(test.key);
    expect(c.read(test.key)).toBe(undefined);
  });

  it("should return the size of the cache", async () => {
    let c = SimpleCache<number>(10);

    for (let i = 1; i <= 10; i += 1) {
      c.write(i.toString(10), i);
    }

    expect(c.size()).toBe(10);
  });

  it("should return the values of the cache", async () => {
    let c = SimpleCache<number>(10);

    for (let i = 1; i <= 10; i += 1) {
      c.write(i.toString(10), i);
    }

    expect(c.values()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("should return the keys of the cache", async () => {
    let c = SimpleCache<number>(10);

    for (let i = 1; i <= 10; i += 1) {
      c.write(i.toString(10), i);
    }

    expect(c.keys()).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
    ]);
  });

  it("should return the entries of the cache", async () => {
    let c = SimpleCache<number>(10);

    for (let i = 1; i <= 10; i += 1) {
      c.write(i.toString(10), i);
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
    ]);
  });

  it("should invalidate cache", async () => {
    let c = SimpleCache<number>(10);

    for (let i = 1; i <= 10; i += 1) {
      c.write(i.toString(10), i);
    }

    c.invalidate();
    expect(c.size()).toBe(0);

    for (let i = 1; i <= 10; i += 1) {
      expect(c.read(i.toString(10))).toBe(undefined);
    }
  });

  it("should not overflow the cache size", async () => {
    let cap = 3;
    let runs = cap * cap;
    let overwrites = 3;
    let c = SimpleCache<number>(cap);

    for (let i = 1; i <= runs; i += 1) {
      c.write(i.toString(10), i);
      // perform excess writes to test the overwrite logic maintaining size/cap
      for (let j = 1; j <= overwrites; j += 1) {
        c.write(i.toString(10), i);
      }
    }

    expect(c.size()).toBe(cap);
    expect(c.values().length).toBe(cap);
  });

  it("should update values without increasing the size on same key", async () => {
    let c = SimpleCache<string>(10, "string");
    let k = "same key";
    let fn = (n: number) => `updated value: ${n}`;

    for (let i = 1; i <= 10; i += 1) {
      c.write(k, fn(i));
    }

    expect(c.size()).toBe(1);
    expect(c.read(k)).toBe(fn(10));
  });

  it("should preserve the newest write even when it has the lowest read hits", async () => {
    let cap = 10;
    let test_hits = 2;
    let c = SimpleCache<number>(cap, "number");

    // Fill the cache up with values that all have a few read hits
    // so the new overflow value is the prime candidate for removal
    // in the cache rebalance (rebalance priority is based on read hits).
    for (let i = 1; i <= cap; i += 1) {
      c.write(i.toString(10), i);
      for (let j = 1; j <= test_hits; j += 1) {
        c.read(i.toString(10));
      }
    }

    let test = {
      key: (cap + 1).toString(10),
      val: cap + 1,
    };

    c.write(test.key, test.val);
    expect(c.read(test.key)).toBe(test.val);
  });
});
