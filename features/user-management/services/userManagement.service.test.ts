import { describe, it, expect, beforeEach } from "vitest";
import { createUserManagementService } from "./userManagement.service";
import { MockUserRepository } from "@/shared/repositories/mock/user.mock";
import { MockOrderRepository } from "@/shared/repositories/mock/order.mock";
import { createUser, createOrder } from "@/shared/test-utils/factories";
import { ORDER_STATUS } from "@/shared/constants/order";
import { USER_ROLES } from "@/shared/constants/user";

describe("userManagementService", () => {
  let userRepo: MockUserRepository;
  let orderRepo: MockOrderRepository;

  function makeService() {
    return createUserManagementService({ userRepository: userRepo, orderRepository: orderRepo });
  }

  beforeEach(() => {
    userRepo = new MockUserRepository();
    orderRepo = new MockOrderRepository();
  });

  describe("listUsers", () => {
    it("returns all users when no filter provided", async () => {
      const client = createUser({ role: USER_ROLES.client });
      const store = createUser({ role: USER_ROLES.store });
      await userRepo.create(client);
      await userRepo.create(store);

      const result = await makeService().listUsers({});
      expect(result).toHaveLength(2);
    });

    it("filters by role", async () => {
      const client = createUser({ role: USER_ROLES.client });
      const store = createUser({ role: USER_ROLES.store });
      await userRepo.create(client);
      await userRepo.create(store);

      const result = await makeService().listUsers({ role: USER_ROLES.client });
      expect(result).toHaveLength(1);
      expect(result[0].role).toBe(USER_ROLES.client);
    });

    it("returns empty array when no users exist", async () => {
      const result = await makeService().listUsers({});
      expect(result).toHaveLength(0);
    });
  });

  describe("suspendUser", () => {
    it("marks a user as suspended", async () => {
      const user = createUser({ role: USER_ROLES.client });
      await userRepo.create(user);

      await makeService().suspendUser({ userId: user.id });

      const updated = await userRepo.findById(user.id);
      expect(updated?.suspended).toBe(true);
    });

    it("cancels non-terminal active orders when suspending a client", async () => {
      const user = createUser({ role: USER_ROLES.client });
      await userRepo.create(user);

      const activeOrder = createOrder({ clientId: user.id, status: ORDER_STATUS.RECIBIDO });
      const terminalOrder = createOrder({ clientId: user.id, status: ORDER_STATUS.FINALIZADO });
      const createdActive = await orderRepo.create(activeOrder);
      const createdTerminal = await orderRepo.create(terminalOrder);

      await makeService().suspendUser({ userId: user.id });

      const allOrders = await orderRepo.findAll({ clientId: user.id });
      const activeUpdated = allOrders.find((o) => o.id === createdActive.id);
      const terminalUpdated = allOrders.find((o) => o.id === createdTerminal.id);

      expect(activeUpdated?.status).toBe(ORDER_STATUS.CANCELADO);
      expect(terminalUpdated?.status).toBe(ORDER_STATUS.FINALIZADO);
    });

    it("cancels active orders for a store user (by storeId field)", async () => {
      const storeUser = createUser({ role: USER_ROLES.store });
      await userRepo.create(storeUser);

      const activeOrder = createOrder({ storeId: storeUser.id, status: ORDER_STATUS.ACEPTADO });
      await orderRepo.create(activeOrder);

      await makeService().suspendUser({ userId: storeUser.id });

      const storeOrders = await orderRepo.findAll({ storeId: storeUser.id });
      expect(storeOrders[0].status).toBe(ORDER_STATUS.CANCELADO);
    });

    it("throws when user not found", async () => {
      await expect(makeService().suspendUser({ userId: "nonexistent" })).rejects.toThrow();
    });

    it("does not cancel already terminal orders", async () => {
      const user = createUser({ role: USER_ROLES.client });
      await userRepo.create(user);

      const terminalOrder = createOrder({ clientId: user.id, status: ORDER_STATUS.RECHAZADO });
      await orderRepo.create(terminalOrder);

      await makeService().suspendUser({ userId: user.id });

      const allOrders = await orderRepo.findAll({ clientId: user.id });
      expect(allOrders[0].status).toBe(ORDER_STATUS.RECHAZADO);
    });
  });

  describe("reinstateUser", () => {
    it("removes suspension from a user", async () => {
      const user = createUser({ role: USER_ROLES.client, suspended: true });
      await userRepo.create(user);

      await makeService().reinstateUser({ userId: user.id });

      const updated = await userRepo.findById(user.id);
      expect(updated?.suspended).toBe(false);
    });

    it("throws when user not found", async () => {
      await expect(makeService().reinstateUser({ userId: "nonexistent" })).rejects.toThrow();
    });
  });
});
