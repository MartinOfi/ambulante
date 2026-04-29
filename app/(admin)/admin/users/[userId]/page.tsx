import { UserDetailPageContainer } from "@/features/user-management";

export const metadata = {
  title: "Detalle de usuario — Ambulante Admin",
};

interface PageProps {
  readonly params: Promise<{ readonly userId: string }>;
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { userId } = await params;
  return (
    <main className="p-6 md:p-8">
      <UserDetailPageContainer userId={userId} />
    </main>
  );
}
