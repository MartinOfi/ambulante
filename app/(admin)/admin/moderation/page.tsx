import { ModerationQueueContainer } from "@/features/content-moderation";

export default function AdminModerationPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Moderación de contenido</h1>
      <ModerationQueueContainer />
    </main>
  );
}
