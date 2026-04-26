import { ID, Query } from "appwrite";

import {
  appwriteAccount,
  appwriteCustomerCollectionId,
  appwriteDatabaseId,
  appwriteDatabases,
} from "@/lib/appwrite";

type SyncCustomerPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  avatar?: string;
  password: string;
};

const toErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown Appwrite error";
};

const isAlreadyExistsError = (error: unknown) => {
  const message = toErrorMessage(error).toLowerCase();
  return (
    message.includes("already exists") ||
    message.includes("already registered") ||
    message.includes("409")
  );
};

const ensureCustomerCollectionEnv = () => {
  if (!appwriteDatabaseId || !appwriteCustomerCollectionId) {
    throw new Error(
      "Missing Appwrite customer config. Set VITE_APPWRITE_DATABASE_ID and VITE_APPWRITE_CUSTOMER_COLLECTION_ID in .env",
    );
  }
};

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const normalizeString = (value?: string) => value?.trim() || "";

const createOrLoginCustomerSession = async (payload: SyncCustomerPayload) => {
  const normalizedEmail = normalizeEmail(payload.email);
  const normalizedPassword = payload.password.trim();
  const fullName = `${payload.firstName} ${payload.lastName}`.trim() || "customer";

  if (!normalizedPassword) {
    throw new Error("Missing customer password for Appwrite login account creation.");
  }

  try {
    await appwriteAccount.deleteSession("current");
  } catch {
    // Ignore when there is no active session.
  }

  try {
    await appwriteAccount.createEmailPasswordSession(normalizedEmail, normalizedPassword);
    return;
  } catch {
    // Continue and create account if session login fails.
  }

  try {
    await appwriteAccount.create(
      ID.unique(),
      normalizedEmail,
      normalizedPassword,
      fullName,
    );
  } catch (error) {
    if (!isAlreadyExistsError(error)) {
      throw new Error(`Failed to create customer Appwrite account: ${toErrorMessage(error)}`);
    }
  }

  try {
    await appwriteAccount.createEmailPasswordSession(normalizedEmail, normalizedPassword);
  } catch (error) {
    throw new Error(
      `Customer Appwrite account exists but login failed. Ensure the password matches Appwrite credentials. ${toErrorMessage(error)}`,
    );
  }
};

const upsertCustomerDocument = async (payload: SyncCustomerPayload) => {
  const normalizedEmail = normalizeEmail(payload.email);
  const now = new Date().toISOString();

  const existing = await appwriteDatabases.listDocuments(
    appwriteDatabaseId,
    appwriteCustomerCollectionId,
    [Query.equal("email", normalizedEmail), Query.limit(1)],
  );

  const data = {
    firstName: normalizeString(payload.firstName),
    lastName: normalizeString(payload.lastName),
    email: normalizedEmail,
    phone: normalizeString(payload.phone),
    address: normalizeString(payload.address),
    city: normalizeString(payload.city),
    avatar: normalizeString(payload.avatar),
    role: "customer",
    status: "customer",
    updatedAt: now,
  };

  const existingId = existing.documents[0]?.$id;

  if (existingId) {
    await appwriteDatabases.updateDocument(
      appwriteDatabaseId,
      appwriteCustomerCollectionId,
      existingId,
      data,
    );
    return;
  }

  await appwriteDatabases.createDocument(
    appwriteDatabaseId,
    appwriteCustomerCollectionId,
    ID.unique(),
    {
      ...data,
      createdAt: now,
    },
  );
};

export async function syncCustomerInAppwrite(payload: SyncCustomerPayload) {
  ensureCustomerCollectionEnv();
  await createOrLoginCustomerSession(payload);
  await upsertCustomerDocument(payload);
}

export async function updateCustomerPasswordInAppwrite(params: {
  email: string;
  currentPassword: string;
  nextPassword: string;
}) {
  const normalizedEmail = normalizeEmail(params.email);
  const currentPassword = params.currentPassword.trim();
  const nextPassword = params.nextPassword.trim();

  if (!normalizedEmail) {
    throw new Error("Customer email is required to update password in Appwrite.");
  }

  if (!currentPassword) {
    throw new Error("Current password is required to verify the Appwrite account.");
  }

  if (nextPassword.length < 6) {
    throw new Error("New password must be at least 6 characters.");
  }

  try {
    await appwriteAccount.deleteSession("current");
  } catch {
    // Ignore when there is no active session.
  }

  try {
    await appwriteAccount.createEmailPasswordSession(normalizedEmail, currentPassword);
  } catch (error) {
    throw new Error(
      `Unable to verify your existing Appwrite password before reset. ${toErrorMessage(error)}`,
    );
  }

  try {
    await appwriteAccount.updatePassword(nextPassword, currentPassword);
  } catch (error) {
    throw new Error(`Failed to update customer password in Appwrite: ${toErrorMessage(error)}`);
  }
}
