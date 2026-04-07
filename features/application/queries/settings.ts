import "server-only";
import {
  DEFAULT_ORGANIZATION_LOGO_PATH,
  DEFAULT_ORGANIZATION_NAME,
  DEFAULT_ORGANIZATION_TAGLINE,
  DEFAULT_ORGANIZATION_UNIT,
} from "@/features/application/lib/portal-branding";

export async function getPortalBranding() {
  return {
    organizationName: DEFAULT_ORGANIZATION_NAME,
    organizationUnit: DEFAULT_ORGANIZATION_UNIT,
    organizationTagline: DEFAULT_ORGANIZATION_TAGLINE,
    logoPath: DEFAULT_ORGANIZATION_LOGO_PATH,
  };
}
