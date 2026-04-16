import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

interface AuthCardProps {
  readonly title: string;
  readonly children: React.ReactNode;
}

export function AuthCard({ title, children }: AuthCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <p className="font-display text-2xl font-bold text-brand">Ambulante</p>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
