"use client";

import { usePushSubscribe } from "@/shared/hooks/usePushSubscribe";
import { NotificationOptIn } from "./NotificationOptIn";

export function NotificationOptInContainer() {
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
    <NotificationOptIn
      isSubscribed={isSubscribed}
      permission={permission}
      isPending={isPending}
      isSupported={isSupported}
      onToggle={handleToggle}
    />
  );
}
