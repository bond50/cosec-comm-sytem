import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

function getGeneratedSchemaVersion() {
  try {
    const clientDir = path.dirname(
      require.resolve("@prisma/client/package.json"),
    );
    const schemaPath = path.join(
      clientDir,
      "..",
      "..",
      ".prisma",
      "client",
      "schema.prisma",
    );

    return fs.statSync(schemaPath).mtimeMs;
  } catch {
    return 0;
  }
}

const prismaClientSingleton = () => {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
};

function hasRequiredDelegates(
  client: ReturnType<typeof prismaClientSingleton> | undefined,
) {
  if (!client) return false;

  const runtimeModels = (
    client as PrismaClient & {
      _runtimeDataModel?: {
        models?: Record<string, { fields?: { name?: string }[] }>;
      };
    }
  )._runtimeDataModel?.models;
  const documentFields = runtimeModels?.Document?.fields ?? [];
  const meetingFields = runtimeModels?.Meeting?.fields ?? [];
  const notificationFields = runtimeModels?.Notification?.fields ?? [];

  const hasDocumentMedium = documentFields.some(
    (field) => field.name === "medium",
  );
  const hasMeetingCorrespondence = meetingFields.some(
    (field) => field.name === "correspondence",
  );
  const hasMeetingDecisions = meetingFields.some(
    (field) => field.name === "decisions",
  );
  const hasNotificationKind = notificationFields.some(
    (field) => field.name === "kind",
  );
  const hasNotificationAuditLogId = notificationFields.some(
    (field) => field.name === "auditLogId",
  );

  return Boolean(
    typeof (client as PrismaClient & { correspondenceSenderOffice?: unknown })
      .correspondenceSenderOffice !== "undefined" &&
    typeof (client as PrismaClient & { notification?: unknown })
      .notification !== "undefined" &&
    typeof (client as PrismaClient & { notificationPreference?: unknown })
      .notificationPreference !== "undefined" &&
    hasDocumentMedium &&
    hasMeetingCorrespondence &&
    hasMeetingDecisions &&
    hasNotificationKind &&
    hasNotificationAuditLogId,
  );
}

function getRuntimeModelFields(
  client: ReturnType<typeof prismaClientSingleton> | undefined,
  modelName: string,
) {
  if (!client) return [];

  return (
    (
      client as PrismaClient & {
        _runtimeDataModel?: {
          models?: Record<string, { fields?: { name?: string }[] }>;
        };
      }
    )._runtimeDataModel?.models?.[modelName]?.fields ?? []
  );
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
  prismaGlobalSchemaVersion?: number;
} & typeof global;

const generatedSchemaVersion = getGeneratedSchemaVersion();

const shouldCreateNewClient =
  !hasRequiredDelegates(globalThis.prismaGlobal) ||
  globalThis.prismaGlobalSchemaVersion !== generatedSchemaVersion;

export const db = shouldCreateNewClient
  ? prismaClientSingleton()
  : globalThis.prismaGlobal;

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = db;
  globalThis.prismaGlobalSchemaVersion = generatedSchemaVersion;
}

export function getRuntimeFieldNames(modelName: string) {
  return new Set(
    getRuntimeModelFields(db, modelName)
      .map((field) => field.name)
      .filter((value): value is string => Boolean(value)),
  );
}

export function hasRuntimeField(modelName: string, fieldName: string) {
  return getRuntimeFieldNames(modelName).has(fieldName);
}

export function getNotificationDelegate() {
  return (
    db as typeof db & {
      notification?: typeof db.notification;
    }
  ).notification;
}

export function getNotificationPreferenceDelegate() {
  return (
    db as typeof db & {
      notificationPreference?: typeof db.notificationPreference;
    }
  ).notificationPreference;
}

export function getNotificationRuntimeSupport() {
  return {
    hasKind: hasRuntimeField("Notification", "kind"),
    hasAuditLogId: hasRuntimeField("Notification", "auditLogId"),
    hasEmailedAt: hasRuntimeField("Notification", "emailedAt"),
    hasNotificationPreferences:
      typeof getNotificationPreferenceDelegate() !== "undefined",
  } satisfies {
    hasKind: boolean;
    hasAuditLogId: boolean;
    hasEmailedAt: boolean;
    hasNotificationPreferences: boolean;
  };
}
