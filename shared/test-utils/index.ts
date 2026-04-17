export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
export {
  createTestQueryClient,
  renderWithProviders,
  type RenderWithProvidersOptions,
} from "./render";
// Shadow RTL's `render` so the providers-wrapped version is the default
export { renderWithProviders as render } from "./render";
