import { Button } from "@/shared/components/ui/button";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/utils/cn";
import { INSTALL_PLATFORM, type InstallPromptProps } from "./InstallPrompt.types";

const IOS_STEPS = [
  {
    icon: "Share2" as const,
    label: "Tocá el botón Compartir",
    description: "El ícono de la flecha hacia arriba en la barra inferior de Safari",
  },
  {
    icon: "PlusSquare" as const,
    label: 'Elegí "Agregar a inicio"',
    description: "Desplazá hacia abajo en el menú y tocá esa opción",
  },
  {
    icon: "Smartphone" as const,
    label: "Confirmá la instalación",
    description: 'Tocá "Agregar" en la esquina superior derecha',
  },
] as const;

function IosSteps() {
  return (
    <ol data-testid="install-prompt-ios-steps" className="mt-4 space-y-3">
      {IOS_STEPS.map((step, index) => (
        <li key={step.icon} className="flex items-start gap-3">
          <span
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center",
              "rounded-full bg-brand-primary/10 text-xs font-semibold text-brand-primary",
            )}
          >
            {index + 1}
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">{step.label}</p>
            <p className="text-xs text-muted-foreground">{step.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function InstallPrompt({
  dialogRef,
  platform,
  isInstalled,
  canTriggerNativePrompt,
  onTriggerNativePrompt,
  onDismiss,
}: InstallPromptProps) {
  if (isInstalled || platform === INSTALL_PLATFORM.unknown) {
    return null;
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-label="Instalar la app"
      aria-modal="true"
      tabIndex={-1}
      className={cn(
        "fixed bottom-4 left-4 right-4 z-50 rounded-2xl border border-border",
        "bg-surface/95 p-4 shadow-sheet backdrop-blur-md",
        "sm:left-auto sm:right-4 sm:w-80",
        "outline-none",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon name="Smartphone" size="md" color="brand" aria-hidden />
          <p className="text-sm font-semibold text-foreground">Instalar la app</p>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Cerrar"
          className="rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <Icon name="X" size="sm" aria-hidden />
        </button>
      </div>

      {platform === INSTALL_PLATFORM.ios && (
        <>
          <p className="mt-2 text-xs text-muted-foreground">
            Para recibir notificaciones, instalá Ambulante desde Safari:
          </p>
          <IosSteps />
        </>
      )}

      {platform === INSTALL_PLATFORM.android && (
        <p className="mt-2 text-xs text-muted-foreground">
          Instalá Ambulante para una experiencia más rápida y recibir notificaciones de tus pedidos.
        </p>
      )}

      <div className="mt-4 flex gap-2">
        {platform === INSTALL_PLATFORM.android && canTriggerNativePrompt && (
          <Button
            size="sm"
            className="flex-1"
            onClick={onTriggerNativePrompt}
            aria-label="Instalar la aplicación"
          >
            Instalar
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            platform === INSTALL_PLATFORM.ios || !canTriggerNativePrompt ? "flex-1" : "",
          )}
          onClick={onDismiss}
          aria-label="Ahora no"
        >
          Ahora no
        </Button>
      </div>
    </div>
  );
}
