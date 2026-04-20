import {
  UserManagementPageContainer,
  createUserManagementService,
} from "@/features/user-management";
import { MockUserRepository } from "@/shared/repositories/mock/user.mock";
import { MockOrderRepository } from "@/shared/repositories/mock/order.mock";

export const metadata = {
  title: "Gestión de usuarios — Ambulante Admin",
};

export default function AdminUsersPage() {
  const userRepository = new MockUserRepository();
  const orderRepository = new MockOrderRepository();
  const service = createUserManagementService({ userRepository, orderRepository });

  return (
    <main className="p-6 md:p-8">
      <UserManagementPageContainer service={service} />
    </main>
  );
}
