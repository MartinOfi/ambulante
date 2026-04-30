"use client";

import { usePushSubscribe } from "@/features/profile/hooks/usePushSubscribe";
import { PushOptInToggle } from "./PushOptInToggle";

export function PushOptInToggleContainer() {
  const { isSubscribed, permission, isPending, isSupported, subscribe, unsubscribe } =
    usePushSubscribe();

  const handleToggle = () => {
    if (isSubscribed) {
      void unsubscribe();
    } else {
      void subscribe();
    }
  };

  return (
    <PushOptInToggle
      isSubscribed={isSubscribed}
      permission={permission}
      isPending={isPending}
      isSupported={isSupported}
      onToggle={handleToggle}
    />
  );
}
