export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");

    const { isE2ETestMode } = await import("./shared/services/push.test-capture");
    if (isE2ETestMode()) {
      const { registerE2EPushListener } = await import("./shared/domain/events/wiring.e2e");
      registerE2EPushListener();
    }
    // Production wiring (registerDomainEventListeners) is not invoked yet — pending
    // Supabase env in dev/prod (B9-C/B10-D). Add the else branch when those land.
  }
}
