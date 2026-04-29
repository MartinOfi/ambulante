import {
  suspendUserSchema,
  reactivateUserSchema,
  userDetailQuerySchema,
} from "@/shared/schemas/user-management";
import type {
  SuspendUserInput,
  ReactivateUserInput,
  UserDetailQueryInput,
} from "@/shared/schemas/user-management";
import type { User, UserRole } from "@/shared/schemas/user";
import type { Order } from "@/shared/schemas/order";
import type { UserRepository, UserFilters } from "@/shared/repositories/user";
import type { OrderRepository } from "@/shared/repositories/order";
import { TERMINAL_ORDER_STATUSES, ORDER_STATUS } from "@/shared/constants/order";
import { USER_ROLES } from "@/shared/constants/user";
import {
  SUSPENSION_STATUS,
  UserManagementDomainError,
  assertCanSuspend,
  assertCanReactivate,
  type SuspensionStatus,
} from "@/shared/domain/user-suspension";
import { logger } from "@/shared/utils/logger";

export interface ListUsersInput {
  readonly role?: UserRole;
  readonly status?: SuspensionStatus;
}

export interface UserDetail {
  readonly user: User;
  readonly orders: readonly Order[];
}

export interface UserManagementServiceDeps {
  readonly userRepository: UserRepository;
  readonly orderRepository: OrderRepository;
}

export interface UserManagementService {
  listUsers(input: ListUsersInput): Promise<readonly User[]>;
  getUserDetail(input: UserDetailQueryInput): Promise<UserDetail>;
  suspendUser(input: SuspendUserInput): Promise<User>;
  reactivateUser(input: ReactivateUserInput): Promise<User>;
}

async function findUserOrders(
  userId: string,
  role: UserRole,
  repo: OrderRepository,
): Promise<readonly Order[]> {
  if (role === USER_ROLES.client) return repo.findAll({ clientId: userId });
  if (role === USER_ROLES.store) return repo.findAll({ storeId: userId });
  return [];
}

async function cancelActiveOrders(
  userId: string,
  role: UserRole,
  repo: OrderRepository,
): Promise<void> {
  const orders = await findUserOrders(userId, role, repo);
  const nonTerminal = orders.filter((order) => !TERMINAL_ORDER_STATUSES.includes(order.status));
  await Promise.all(
    nonTerminal.map((order) => repo.update(order.id, { status: ORDER_STATUS.CANCELADO })),
  );
}

function buildUserFilters(input: ListUsersInput): UserFilters {
  const filters: UserFilters = {};
  const withRole: UserFilters =
    input.role !== undefined ? { ...filters, role: input.role } : filters;
  if (input.status === undefined) return withRole;
  return { ...withRole, suspended: input.status === SUSPENSION_STATUS.SUSPENDED };
}

export function createUserManagementService({
  userRepository,
  orderRepository,
}: UserManagementServiceDeps): UserManagementService {
  async function listUsers(input: ListUsersInput): Promise<readonly User[]> {
    return userRepository.findAll(buildUserFilters(input));
  }

  async function getUserDetail(rawInput: UserDetailQueryInput): Promise<UserDetail> {
    const { userId } = userDetailQuerySchema.parse(rawInput);
    const user = await userRepository.findById(userId);
    if (user === null) {
      logger.error("userManagementService.getUserDetail: user not found", { userId });
      throw new UserManagementDomainError(`Usuario con ID "${userId}" no encontrado`);
    }
    const orders = await findUserOrders(userId, user.role, orderRepository);
    return { user, orders };
  }

  async function suspendUser(rawInput: SuspendUserInput): Promise<User> {
    const { userId, reason } = suspendUserSchema.parse(rawInput);

    const user = await userRepository.findById(userId);
    if (user === null) {
      logger.error("userManagementService.suspendUser: user not found", { userId });
      throw new UserManagementDomainError(`Usuario con ID "${userId}" no encontrado`);
    }

    assertCanSuspend(user);

    if (user.role === USER_ROLES.client || user.role === USER_ROLES.store) {
      await cancelActiveOrders(userId, user.role, orderRepository);
    }

    logger.info("userManagementService.suspendUser: suspending user", {
      userId,
      role: user.role,
      reasonLength: reason.length,
    });

    return userRepository.update(userId, { suspended: true });
  }

  async function reactivateUser(rawInput: ReactivateUserInput): Promise<User> {
    const { userId } = reactivateUserSchema.parse(rawInput);

    const user = await userRepository.findById(userId);
    if (user === null) {
      logger.error("userManagementService.reactivateUser: user not found", { userId });
      throw new UserManagementDomainError(`Usuario con ID "${userId}" no encontrado`);
    }

    assertCanReactivate(user);

    logger.info("userManagementService.reactivateUser: reactivating user", {
      userId,
      role: user.role,
    });

    return userRepository.update(userId, { suspended: false });
  }

  return { listUsers, getUserDetail, suspendUser, reactivateUser };
}
