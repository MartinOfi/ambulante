"use client";

import dynamic from "next/dynamic";

const ServiceWorkerUpdateBannerContainer = dynamic(
  () =>
    import("./ServiceWorkerUpdateBanner.container").then(
      (m) => m.ServiceWorkerUpdateBannerContainer,
    ),
  { ssr: false },
);

export function ServiceWorkerUpdateBannerLoader() {
  return <ServiceWorkerUpdateBannerContainer />;
}
