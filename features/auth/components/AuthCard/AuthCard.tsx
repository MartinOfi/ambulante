import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { AuthBackground } from "./AuthBackground";

interface AuthCardProps {
  readonly title: string;
  readonly children: React.ReactNode;
}

export function AuthCard({ title, children }: AuthCardProps) {
  return (
    <>
      <AuthBackground />
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm bg-orange-50/85 backdrop-blur-xl border-orange-200/50 shadow-2xl shadow-orange-900/30">
          <CardHeader className="space-y-1 text-center">
            <p className="font-display text-2xl font-bold text-brand">Ambulante</p>
            <CardTitle className="text-lg">{title}</CardTitle>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </>
  );
}
