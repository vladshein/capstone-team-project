import { jest } from "@jest/globals";

const IORedis = jest.fn(function IORedisMock(options) {
  this.options = options;
});

jest.unstable_mockModule("ioredis", () => ({ __esModule: true, default: IORedis }));

const originalPort = process.env.REDIS_PORT;
const originalHost = process.env.REDIS_HOST;

afterEach(() => {
  process.env.REDIS_PORT = originalPort;
  process.env.REDIS_HOST = originalHost;
  jest.clearAllMocks();
  jest.resetModules();
});

describe("queues/bullMqConnection", () => {
  it("builds a BullMQ-compatible IORedis connection (maxRetriesPerRequest: null)", async () => {
    process.env.REDIS_PORT = "6380";
    process.env.REDIS_HOST = "valkey-host";
    const { createBullMqConnection } = await import("../queues/bullMqConnection.js");

    createBullMqConnection();

    expect(IORedis).toHaveBeenCalledWith({
      host: "valkey-host",
      port: 6380,
      maxRetriesPerRequest: null,
    });
  });

  it("falls back to the default host when REDIS_HOST is unset", async () => {
    delete process.env.REDIS_HOST;
    process.env.REDIS_PORT = "6379";
    const { createBullMqConnection } = await import("../queues/bullMqConnection.js");

    createBullMqConnection();

    expect(IORedis.mock.calls[0][0]).toMatchObject({ host: "valkey", port: 6379 });
  });

  it("rejects a non-positive REDIS_PORT at module load", async () => {
    process.env.REDIS_PORT = "0";

    await expect(import("../queues/bullMqConnection.js")).rejects.toThrow(
      "REDIS_PORT must be a positive integer",
    );
  });
});
