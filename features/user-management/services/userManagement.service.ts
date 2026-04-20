import { suspendUserSchema, reinstateUserSchema } from "@/shared/schemas/user-management";
import type { SuspendUserInput, ReinstateUserInput } from "@/shared/schemas/user-management";
import type { User, UserRole } from "@/shared/schemas/user";
import type { UserRepository, UserFilters } from "@/shared/repositories/user";
import type { OrderRepository } from "@/shared/repositories/order";
import { TERMINAL_ORDER_STATUSES, ORDER_STATUS } from "@/shared/constants/order";
import { logger } from "@/shared/utils/logger";

export interface ListUsersInput {
  readonly role?: UserRole;
}

export interface UserManagementServiceDeps {
  readonly userRepository: UserRepository;
  readonly orderRepository: OrderRepository;
}

export interface UserManagementService {
  listUsers(input: ListUsersInput): Promise<readonly User[]>;
  suspendUser(input: SuspendUserInput): Promise<User>;
  reinstateUser(input: ReinstateUserInput): Promise<User>;
}

async function cancelActiveOrders(
  userId: string,
  field: "clientId" | "storeId",
  orderRepository: OrderRepository,
): Promise<void> {
  const filter = field === "clientId" ? { clientId: userId } : { storeId: userId };
  const orders = await orderRepository.findAll(filter);
  const nonTerminal = orders.filter((order) => !TERMINAL_ORDER_STATUSES.includes(order.status));

  await Promise.all(
    nonTerminal.map((order) =>
      orderRepository.update(order.id, { status: ORDER_STATUS.CANCELADO }),
    ),
  );
}

export function createUserManagementService({
  userRepository,
  orderRepository,
}: UserManagementServiceDeps): UserManagementService {
  async function listUsers(input: ListUsersInput): Promise<readonly User[]> {
    const filters: UserFilters = {};
    const builtFilters: UserFilters =
      input.role !== undefined ? { ...filters, role: input.role } : filters;
    return userRepository.findAll(builtFilters);
  }

  async function suspendUser(rawInput: SuspendUserInput): Promise<User> {
    const { userId } = suspendUserSchema.parse(rawInput);

    const user = await userRepository.findById(userId);
    if (user === null) {
      logger.error("userManagementService.suspendUser: user not found", { userId });
      throw new Error(`Usuario con ID "${userId}" no encontrado`);
    }

    // Cancel active orders: client orders by clientId, store owner orders by storeId
    if (user.role === "client") {
      await cancelActiveOrders(userId, "clientId", orderRepository);
    } else if (user.role === "store") {
      await cancelActiveOrders(userId, "storeId", orderRepository);
    }

    return userRepository.update(userId, { suspended: true });
  }

  async function reinstateUser(rawInput: ReinstateUserInput): Promise<User> {
    const { userId } = reinstateUserSchema.parse(rawInput);

    const user = await userRepository.findById(userId);
    if (user === null) {
      logger.error("userManagementService.reinstateUser: user not found", { userId });
      throw new Error(`Usuario con ID "${userId}" no encontrado`);
    }

    return userRepository.update(userId, { suspended: false });
  }

  return { listUsers, suspendUser, reinstateUser };
}
