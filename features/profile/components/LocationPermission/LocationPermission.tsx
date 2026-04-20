"use client";

import { useTranslations } from "next-intl";
import { Stack, Row } from "@/shared/components/layout";
import { Text } from "@/shared/components/typography";
import { Button } from "@/shared/components/ui/button";
import {
  LOCATION_PERMISSION_STATUS,
  type LocationPermissionStatus,
} from "@/features/profile/constants";

interface LocationPermissionProps {
  status: LocationPermissionStatus;
  onRequest: () => void;
}

export function LocationPermission({ status, onRequest }: LocationPermissionProps) {
  const t = useTranslations("Profile.LocationPermission");

  return (
    <Stack gap={2}>
      <Text variant="body-sm" className="text-muted-foreground">
        {t(`status${status.charAt(0).toUpperCase()}${status.slice(1)}`)}
      </Text>
      {status === LOCATION_PERMISSION_STATUS.PROMPT && (
        <Row>
          <Button size="sm" onClick={onRequest}>
            {t("enableButton")}
          </Button>
        </Row>
      )}
    </Stack>
  );
}
