import { renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useFocusTrap } from "./useFocusTrap";

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function createFocusableContainer(): HTMLDivElement {
  const container = document.createElement("div");

  const button1 = document.createElement("button");
  button1.textContent = "First";
  button1.setAttribute("tabindex", "0");

  const button2 = document.createElement("button");
  button2.textContent = "Second";
  button2.setAttribute("tabindex", "0");

  const button3 = document.createElement("button");
  button3.textContent = "Third";
  button3.setAttribute("tabindex", "0");

  container.appendChild(button1);
  container.appendChild(button2);
  container.appendChild(button3);

  document.body.appendChild(container);
  return container;
}

describe("useFocusTrap", () => {
  beforeEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("does not throw when ref is null", () => {
    const ref = { current: null };
    expect(() => {
      renderHook(() => useFocusTrap({ ref, active: true }));
    }).not.toThrow();
  });

  it("focuses the first focusable element when activated", () => {
    const container = createFocusableContainer();
    const ref = { current: container };
    const firstButton = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)[0];

    renderHook(() => useFocusTrap({ ref, active: true }));

    expect(document.activeElement).toBe(firstButton);
  });

  it("does not focus when active is false", () => {
    const container = createFocusableContainer();
    const ref = { current: container };
    const outsideButton = document.createElement("button");
    document.body.appendChild(outsideButton);
    outsideButton.focus();

    renderHook(() => useFocusTrap({ ref, active: false }));

    expect(document.activeElement).toBe(outsideButton);
  });

  it("traps Tab forward: wraps from last to first focusable element", () => {
    const container = createFocusableContainer();
    const ref = { current: container };
    const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    const lastButton = focusable[focusable.length - 1];

    renderHook(() => useFocusTrap({ ref, active: true }));

    lastButton.focus();

    const tabEvent = new KeyboardEvent("keydown", {
      key: "Tab",
      shiftKey: false,
      bubbles: true,
    });
    const preventSpy = vi.spyOn(tabEvent, "preventDefault");
    container.dispatchEvent(tabEvent);

    expect(preventSpy).toHaveBeenCalled();
    expect(document.activeElement).toBe(focusable[0]);
  });

  it("traps Shift+Tab backward: wraps from first to last focusable element", () => {
    const container = createFocusableContainer();
    const ref = { current: container };
    const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    const firstButton = focusable[0];

    renderHook(() => useFocusTrap({ ref, active: true }));

    firstButton.focus();

    const shiftTabEvent = new KeyboardEvent("keydown", {
      key: "Tab",
      shiftKey: true,
      bubbles: true,
    });
    const preventSpy = vi.spyOn(shiftTabEvent, "preventDefault");
    container.dispatchEvent(shiftTabEvent);

    expect(preventSpy).toHaveBeenCalled();
    expect(document.activeElement).toBe(focusable[focusable.length - 1]);
  });

  it("calls onEscape when Escape key is pressed", () => {
    const container = createFocusableContainer();
    const ref = { current: container };
    const onEscape = vi.fn();

    renderHook(() => useFocusTrap({ ref, active: true, onEscape }));

    const escapeEvent = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
    });
    container.dispatchEvent(escapeEvent);

    expect(onEscape).toHaveBeenCalledOnce();
  });

  it("does not call onEscape when active is false", () => {
    const container = createFocusableContainer();
    const ref = { current: container };
    const onEscape = vi.fn();

    renderHook(() => useFocusTrap({ ref, active: false, onEscape }));

    const escapeEvent = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
    });
    container.dispatchEvent(escapeEvent);

    expect(onEscape).not.toHaveBeenCalled();
  });

  it("removes event listeners on cleanup", () => {
    const container = createFocusableContainer();
    const ref = { current: container };
    const onEscape = vi.fn();
    const removeEventListenerSpy = vi.spyOn(container, "removeEventListener");

    const { unmount } = renderHook(() => useFocusTrap({ ref, active: true, onEscape }));
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
  });
});
