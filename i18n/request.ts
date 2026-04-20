import { getRequestConfig } from "next-intl/server";
import { LOCALE } from "@/shared/constants/i18n";
import { logger } from "@/shared/utils/logger";

export default getRequestConfig(async () => {
  try {
    const messages = (await import(`../messages/${LOCALE}.json`)).default;
    return { locale: LOCALE, messages };
  } catch (error) {
    logger.error("Failed to load i18n messages", { locale: LOCALE, error });
    return { locale: LOCALE, messages: {} };
  }
});
