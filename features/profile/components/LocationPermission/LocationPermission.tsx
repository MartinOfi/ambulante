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

const STATUS_LABELS: Record<LocationPermissionStatus, string> = {
  [LOCATION_PERMISSION_STATUS.GRANTED]: "Ubicación activa",
  [LOCATION_PERMISSION_STATUS.DENIED]: "Ubicación denegada — cambiá el permiso en tu navegador",
  [LOCATION_PERMISSION_STATUS.PROMPT]: "Permiso de ubicación no solicitado",
  [LOCATION_PERMISSION_STATUS.UNSUPPORTED]: "Geolocalización no disponible en este dispositivo",
};

export function LocationPermission({ status, onRequest }: LocationPermissionProps) {
  return (
    <Stack gap={2}>
      <Text variant="body-sm" className="text-muted-foreground">
        {STATUS_LABELS[status]}
      </Text>
      {status === LOCATION_PERMISSION_STATUS.PROMPT && (
        <Row>
          <Button size="sm" onClick={onRequest}>
            Activar ubicación
          </Button>
        </Row>
      )}
    </Stack>
  );
}
