// Re-export from shared so callers that import from the feature barrel
// get the server-safe (Route Handler) version.
export { useCurrentStoreQuery } from "@/shared/hooks/useCurrentStoreQuery";
