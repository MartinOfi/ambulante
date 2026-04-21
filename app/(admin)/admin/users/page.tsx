import { UserManagementPageContainer } from "@/features/user-management";

export const metadata = {
  title: "Gestión de usuarios — Ambulante Admin",
};

export default function AdminUsersPage() {
  return (
    <main className="p-6 md:p-8">
      <UserManagementPageContainer />
    </main>
  );
}
