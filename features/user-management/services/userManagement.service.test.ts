import { describe, it, expect, beforeEach } from "vitest";
import { createUserManagementService } from "./userManagement.service";
import { MockUserRepository } from "@/shared/repositories/mock/user.mock";
import { MockOrderRepository } from "@/shared/repositories/mock/order.mock";
import { createUser, createOrder } from "@/shared/test-utils/factories";
import { ORDER_STATUS } from "@/shared/constants/order";
import { USER_ROLES } from "@/shared/constants/user";
import { SUSPENSION_STATUS } from "@/shared/domain/user-suspension";

const VALID_REASON = "Comportamiento abusivo confirmado";

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
      await userRepo.create(createUser({ role: USER_ROLES.client }));
      await userRepo.create(createUser({ role: USER_ROLES.store }));

      const result = await makeService().listUsers({});
      expect(result).toHaveLength(2);
    });

    it("filters by role", async () => {
      await userRepo.create(createUser({ role: USER_ROLES.client }));
      await userRepo.create(createUser({ role: USER_ROLES.store }));

      const result = await makeService().listUsers({ role: USER_ROLES.client });
      expect(result).toHaveLength(1);
      expect(result[0].role).toBe(USER_ROLES.client);
    });

    it("filters by suspension status", async () => {
      await userRepo.create(createUser({ role: USER_ROLES.client, suspended: false }));
      await userRepo.create(createUser({ role: USER_ROLES.client, suspended: true }));

      const onlySuspended = await makeService().listUsers({ status: SUSPENSION_STATUS.SUSPENDED });
      expect(onlySuspended).toHaveLength(1);
      expect(onlySuspended[0].suspended).toBe(true);

      const onlyActive = await makeService().listUsers({ status: SUSPENSION_STATUS.ACTIVE });
      expect(onlyActive).toHaveLength(1);
      expect(onlyActive[0].suspended).toBe(false);
    });

    it("returns empty array when no users exist", async () => {
      const result = await makeService().listUsers({});
      expect(result).toHaveLength(0);
    });
  });

  describe("getUserDetail", () => {
    it("returns user and their orders (client → clientId)", async () => {
      const user = createUser({ role: USER_ROLES.client });
      await userRepo.create(user);
      await orderRepo.create(createOrder({ clientId: user.id, status: ORDER_STATUS.RECIBIDO }));

      const detail = await makeService().getUserDetail({ userId: user.id });
      expect(detail.user.id).toBe(user.id);
      expect(detail.orders).toHaveLength(1);
    });

    it("returns user and their orders (store → storeId)", async () => {
      const user = createUser({ role: USER_ROLES.store });
      await userRepo.create(user);
      await orderRepo.create(createOrder({ storeId: user.id, status: ORDER_STATUS.ACEPTADO }));

      const detail = await makeService().getUserDetail({ userId: user.id });
      expect(detail.orders).toHaveLength(1);
    });

    it("returns empty orders for admin", async () => {
      const user = createUser({ role: USER_ROLES.admin });
      await userRepo.create(user);

      const detail = await makeService().getUserDetail({ userId: user.id });
      expect(detail.orders).toHaveLength(0);
    });

    it("throws when user not found", async () => {
      await expect(makeService().getUserDetail({ userId: "missing" })).rejects.toThrow(
        /no encontrado/,
      );
    });
  });

  describe("suspendUser", () => {
    it("marks an active user as suspended", async () => {
      const user = createUser({ role: USER_ROLES.client, suspended: false });
      await userRepo.create(user);

      await makeService().suspendUser({ userId: user.id, reason: VALID_REASON });

      const updated = await userRepo.findById(user.id);
      expect(updated?.suspended).toBe(true);
    });

    it("requires a reason of at least 3 characters", async () => {
      const user = createUser({ role: USER_ROLES.client });
      await userRepo.create(user);

      await expect(
        makeService().suspendUser({ userId: user.id, reason: "ab" }),
      ).rejects.toThrow();
    });

    it("cancels non-terminal orders when suspending a client", async () => {
      const user = createUser({ role: USER_ROLES.client });
      await userRepo.create(user);

      const active = await orderRepo.create(
        createOrder({ clientId: user.id, status: ORDER_STATUS.RECIBIDO }),
      );
      const terminal = await orderRepo.create(
        createOrder({ clientId: user.id, status: ORDER_STATUS.FINALIZADO }),
      );

      await makeService().suspendUser({ userId: user.id, reason: VALID_REASON });

      const all = await orderRepo.findAll({ clientId: user.id });
      expect(all.find((o) => o.id === active.id)?.status).toBe(ORDER_STATUS.CANCELADO);
      expect(all.find((o) => o.id === terminal.id)?.status).toBe(ORDER_STATUS.FINALIZADO);
    });

    it("cancels active orders for a store user (storeId field)", async () => {
      const storeUser = createUser({ role: USER_ROLES.store });
      await userRepo.create(storeUser);

      await orderRepo.create(createOrder({ storeId: storeUser.id, status: ORDER_STATUS.ACEPTADO }));

      await makeService().suspendUser({ userId: storeUser.id, reason: VALID_REASON });

      const orders = await orderRepo.findAll({ storeId: storeUser.id });
      expect(orders[0].status).toBe(ORDER_STATUS.CANCELADO);
    });

    it("throws when user not found", async () => {
      await expect(
        makeService().suspendUser({ userId: "missing", reason: VALID_REASON }),
      ).rejects.toThrow();
    });

    it("throws when user already suspended (state machine)", async () => {
      const user = createUser({ role: USER_ROLES.client, suspended: true });
      await userRepo.create(user);

      await expect(
        makeService().suspendUser({ userId: user.id, reason: VALID_REASON }),
      ).rejects.toThrow(/ya está suspendido/i);
    });

    it("throws when target user is admin (protected role)", async () => {
      const admin = createUser({ role: USER_ROLES.admin });
      await userRepo.create(admin);

      await expect(
        makeService().suspendUser({ userId: admin.id, reason: VALID_REASON }),
      ).rejects.toThrow(/administrador/i);
    });
  });

  describe("reactivateUser", () => {
    it("removes suspension from a suspended user", async () => {
      const user = createUser({ role: USER_ROLES.client, suspended: true });
      await userRepo.create(user);

      await makeService().reactivateUser({ userId: user.id });

      const updated = await userRepo.findById(user.id);
      expect(updated?.suspended).toBe(false);
    });

    it("throws when user not found", async () => {
      await expect(makeService().reactivateUser({ userId: "missing" })).rejects.toThrow();
    });

    it("throws when user is not suspended (state machine)", async () => {
      const user = createUser({ role: USER_ROLES.client, suspended: false });
      await userRepo.create(user);

      await expect(makeService().reactivateUser({ userId: user.id })).rejects.toThrow(
        /no está suspendido/i,
      );
    });
  });
});
