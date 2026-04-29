import { afterEach, describe, expect, it } from "vitest";

import {
  E2E_TEST_MODE_ENV,
  E2E_TEST_MODE_FLAG,
  clearCaptureStore,
  createTestCapturePushSender,
  isE2ETestMode,
  listCapturedPushes,
  subscribeUser,
  unsubscribeUser,
} from "./push.test-capture";
import type { PushNotificationPayload } from "./push.types";

const SAMPLE_PAYLOAD: PushNotificationPayload = {
  title: "¡Pedido aceptado!",
  body: "Tu pedido fue aceptado. ¡Ve a buscarlo!",
};

const USER_A = "user-a";
const USER_B = "user-b";

afterEach(() => {
  clearCaptureStore();
});

describe("isE2ETestMode", () => {
  const original = process.env[E2E_TEST_MODE_ENV];

  afterEach(() => {
    if (original === undefined) delete process.env[E2E_TEST_MODE_ENV];
    else process.env[E2E_TEST_MODE_ENV] = original;
  });

  it("returns true when the env flag matches", () => {
    process.env[E2E_TEST_MODE_ENV] = E2E_TEST_MODE_FLAG;
    expect(isE2ETestMode()).toBe(true);
  });

  it("returns false when the env flag is absent or different", () => {
    delete process.env[E2E_TEST_MODE_ENV];
    expect(isE2ETestMode()).toBe(false);

    process.env[E2E_TEST_MODE_ENV] = "0";
    expect(isE2ETestMode()).toBe(false);
  });
});

describe("createTestCapturePushSender", () => {
  it("captures pushes only for subscribed users", async () => {
    const sender = createTestCapturePushSender();
    subscribeUser(USER_A);

    await sender.sendToUser(USER_A, SAMPLE_PAYLOAD);
    await sender.sendToUser(USER_B, SAMPLE_PAYLOAD);

    expect(listCapturedPushes(USER_A)).toHaveLength(1);
    expect(listCapturedPushes(USER_A)[0]?.payload).toEqual(SAMPLE_PAYLOAD);
    expect(listCapturedPushes(USER_B)).toHaveLength(0);
  });

  it("preserves capture order across multiple sends to the same user", async () => {
    const sender = createTestCapturePushSender();
    subscribeUser(USER_A);

    const second: PushNotificationPayload = { title: "Pedido en camino", body: "..." };
    await sender.sendToUser(USER_A, SAMPLE_PAYLOAD);
    await sender.sendToUser(USER_A, second);

    const captures = listCapturedPushes(USER_A);
    expect(captures).toHaveLength(2);
    expect(captures[0]?.payload.title).toBe(SAMPLE_PAYLOAD.title);
    expect(captures[1]?.payload.title).toBe(second.title);
  });

  it("stops capturing after unsubscribe", async () => {
    const sender = createTestCapturePushSender();
    subscribeUser(USER_A);
    await sender.sendToUser(USER_A, SAMPLE_PAYLOAD);
    expect(listCapturedPushes(USER_A)).toHaveLength(1);

    unsubscribeUser(USER_A);
    await sender.sendToUser(USER_A, SAMPLE_PAYLOAD);
    expect(listCapturedPushes(USER_A)).toHaveLength(1);
  });
});

describe("clearCaptureStore", () => {
  it("clears subscriptions and captures", async () => {
    const sender = createTestCapturePushSender();
    subscribeUser(USER_A);
    await sender.sendToUser(USER_A, SAMPLE_PAYLOAD);
    expect(listCapturedPushes(USER_A)).toHaveLength(1);

    clearCaptureStore();

    expect(listCapturedPushes(USER_A)).toHaveLength(0);
    await sender.sendToUser(USER_A, SAMPLE_PAYLOAD);
    expect(listCapturedPushes(USER_A)).toHaveLength(0);
  });
});
