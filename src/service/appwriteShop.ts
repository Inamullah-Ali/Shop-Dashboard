import { ID, Query } from "appwrite";

import {
  appwriteAccount,
  appwriteDatabaseId,
  appwriteDatabases,
  appwriteShopCollectionId,
} from "@/lib/appwrite";
import type { IShop } from "@/types/tabledata";

type CreateShopInAppwritePayload = {
  shopName: string;
  ownerName: string;
  phoneNumber?: string;
  shopAddress?: string;
  city?: string;
  shopType?: string;
  email: string;
  password: string;
  selectedPlanId?: number;
  selectedPlanName?: string;
  selectedPlanPrice?: number;
  packageDuration?: string;
  status: string;
  image?: string;
};

type UpdateShopInAppwritePayload = {
  appwriteDocumentId?: string;
  appwriteUserId?: string;
  email: string;
  updates: {
    shopName: string;
    ownerName: string;
    phoneNumber: string;
    shopAddress: string;
    city: string;
    shopType: string;
    selectedPlanId: number;
    selectedPlanName: string;
    selectedPlanPrice: number;
    packageDuration: string;
    status: string;
    image?: string;
  };
};

type DeleteShopInAppwritePayload = {
  appwriteDocumentId?: string;
  appwriteUserId?: string;
  email: string;
};

const normalizeEnvValue = (value?: string) =>
  value?.trim().replace(/^['\"]|['\"]$/g, "") || "";

const toErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown Appwrite error";
};

const isIdentityAlreadyExistsError = (error: unknown) => {
  const appwriteError = error as {
    code?: number;
    type?: string;
    message?: string;
  };
  const message = toErrorMessage(error).toLowerCase();
  const type = appwriteError.type?.toLowerCase() || "";
  return (
    appwriteError.code === 409 ||
    type.includes("already_exists") ||
    message.includes("already exists") ||
    message.includes("already registered") ||
    message.includes("same id") ||
    message.includes("id, email, or phone already exists") ||
    message.includes("409")
  );
};

const shopAdminDeleteEndpoint = normalizeEnvValue(
  import.meta.env.VITE_APPWRITE_SHOP_ADMIN_DELETE_ENDPOINT,
);
const shopAdminDeleteToken = normalizeEnvValue(
  import.meta.env.VITE_APPWRITE_SHOP_ADMIN_DELETE_TOKEN,
);

const toNumericId = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(-12);
  const parsed = Number(digits);

  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return Date.now();
};

const ensureShopCollectionEnv = () => {
  if (!appwriteDatabaseId || !appwriteShopCollectionId) {
    throw new Error(
      "Missing Appwrite database config. Set VITE_APPWRITE_DATABASE_ID and VITE_APPWRITE_SHOP_COLLECTION_ID in .env",
    );
  }
};

const toStringValue = (value: unknown) => (typeof value === "string" ? value : "");

const toOptionalNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const toStableNumericId = (value: string) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash || Date.now();
};

const normalizeAppwriteShopDocument = (document: Record<string, unknown>): IShop => {
  const appwriteDocumentId = toStringValue(document.$id);
  const idValue = typeof document.id === "number" ? document.id : toStableNumericId(appwriteDocumentId);
  const email = toStringValue(document.email).toLowerCase().trim();
  const role = toStringValue(document.role);

  return {
    id: idValue,
    createdAt: toStringValue(document.createdAt) || toStringValue(document.$createdAt),
    appwriteDocumentId: appwriteDocumentId || undefined,
    appwriteUserId: toStringValue(document.appwriteUserId) || undefined,
    paymentStatus: document.paymentStatus === "Received" ? "Received" : "Not Received",
    paymentDate: toStringValue(document.paymentDate) || undefined,
    selectedPlanId: toOptionalNumber(document.selectedPlanId),
    selectedPlanName: toStringValue(document.selectedPlanName) || undefined,
    selectedPlanPrice: toOptionalNumber(document.selectedPlanPrice),
    shopName: toStringValue(document.shopName),
    ownerName: toStringValue(document.ownerName),
    phoneNumber: toStringValue(document.phoneNumber),
    shopAddress: toStringValue(document.shopAddress),
    city: toStringValue(document.city),
    shopType: toStringValue(document.shopType),
    email,
    password: toStringValue(document.password) || undefined,
    role: role === "admin" ? "admin" : "shopAdmin",
    status: toStringValue(document.status) === "Active" ? "Active" : "Inactive",
    packageDuration: toStringValue(document.packageDuration) || undefined,
    image: toStringValue(document.image) || undefined,
  };
};

export async function fetchShopsFromAppwrite() {
  ensureShopCollectionEnv();

  const response = await appwriteDatabases.listDocuments(
    appwriteDatabaseId,
    appwriteShopCollectionId,
    [Query.orderDesc("$createdAt")],
  );

  return response.documents.map((document) => normalizeAppwriteShopDocument(document as Record<string, unknown>));
}

export async function createShopInAppwrite(payload: CreateShopInAppwritePayload) {
  ensureShopCollectionEnv();

  const normalizedEmail = normalizeEnvValue(payload.email).toLowerCase();
  const normalizedPassword = payload.password.trim();
  const normalizedPhone = payload.phoneNumber?.trim() || "";

  if (!normalizedEmail) {
    throw new Error("Shop email is required.");
  }

  if (normalizedPassword.length < 8) {
    throw new Error("Shop password must be at least 8 characters.");
  }

  if (normalizedEmail) {
    const existingByEmail = await appwriteDatabases.listDocuments(
      appwriteDatabaseId,
      appwriteShopCollectionId,
      [Query.equal("email", normalizedEmail), Query.limit(1)],
    );

    if (existingByEmail.documents.length > 0) {
      throw new Error("A shop with this email already exists in the shop collection.");
    }
  }

  if (normalizedPhone) {
    const existingByPhone = await appwriteDatabases.listDocuments(
      appwriteDatabaseId,
      appwriteShopCollectionId,
      [Query.equal("phoneNumber", normalizedPhone), Query.limit(1)],
    );

    if (existingByPhone.documents.length > 0) {
      throw new Error("A shop with this phone number already exists in the shop collection.");
    }
  }

  let appwriteUserId: string;

  try {
    const createdUser = await appwriteAccount.create(
      ID.unique(),
      normalizedEmail,
      normalizedPassword,
      payload.ownerName.trim(),
    );
    appwriteUserId = createdUser.$id;
  } catch (error) {
    if (isIdentityAlreadyExistsError(error)) {
      // If the identity already exists, allow linking when the same password works.
      // This covers previous partial setups where Auth user exists but shop document does not.
      try {
        try {
          await appwriteAccount.deleteSession("current");
        } catch {
          // Ignore when there is no current Appwrite session.
        }

        await appwriteAccount.createEmailPasswordSession(normalizedEmail, normalizedPassword);
        const existingAccount = await appwriteAccount.get();
        appwriteUserId = existingAccount.$id;

        try {
          await appwriteAccount.deleteSession("current");
        } catch {
          // Ignore cleanup errors.
        }
      } catch {
        throw new Error(
          `Shop Admin auth account already exists, but the password does not match this existing account. Use Forgot Password for ${normalizedEmail}, then try adding the shop again.`,
        );
      }
    } else {
      throw new Error(`Failed to create Shop Admin auth account: ${toErrorMessage(error)}`);
    }
  }

  const createPayload: Record<string, unknown> = {
    shopName: payload.shopName.trim(),
    ownerName: payload.ownerName.trim(),
    phoneNumber: payload.phoneNumber?.trim() || "",
    shopAddress: payload.shopAddress?.trim() || "",
    city: payload.city?.trim() || "",
    shopType: payload.shopType?.trim() || "",
    email: normalizedEmail,
    role: "shopAdmin",
    status: payload.status,
    image: payload.image || "",
    createdAt: new Date().toISOString(),
  };

  if (typeof payload.selectedPlanId === "number" && Number.isFinite(payload.selectedPlanId)) {
    createPayload.selectedPlanId = Math.trunc(payload.selectedPlanId);
  }

  if (typeof payload.selectedPlanName === "string" && payload.selectedPlanName.trim()) {
    createPayload.selectedPlanName = payload.selectedPlanName.trim();
  }

  if (typeof payload.selectedPlanPrice === "number" && Number.isFinite(payload.selectedPlanPrice)) {
    createPayload.selectedPlanPrice = payload.selectedPlanPrice;
  }

  if (typeof payload.packageDuration === "string" && payload.packageDuration.trim()) {
    createPayload.packageDuration = payload.packageDuration.trim();
  }

  createPayload.appwriteUserId = appwriteUserId;

  const shopDocument = await appwriteDatabases.createDocument(
    appwriteDatabaseId,
    appwriteShopCollectionId,
    ID.unique(),
    createPayload,
  );

  return {
    id: toNumericId(shopDocument.$id),
    createdAt: shopDocument.$createdAt,
    appwriteDocumentId: shopDocument.$id,
    appwriteUserId,
    shopName: payload.shopName.trim(),
    ownerName: payload.ownerName.trim(),
    phoneNumber: payload.phoneNumber?.trim() || "",
    shopAddress: payload.shopAddress?.trim() || "",
    city: payload.city?.trim() || "",
    shopType: payload.shopType?.trim() || "",
    email: normalizedEmail,
    role: "shopAdmin" as const,
    status: payload.status,
    selectedPlanId: payload.selectedPlanId,
    selectedPlanName: payload.selectedPlanName,
    selectedPlanPrice: payload.selectedPlanPrice,
    packageDuration: payload.packageDuration,
    image: payload.image,
  };
}

export async function loginShopAdminWithAppwrite(email: string, password: string) {
  ensureShopCollectionEnv();

  const normalizedEmail = normalizeEnvValue(email).toLowerCase();
  const normalizedPassword = password.trim();

  try {
    await appwriteAccount.deleteSession("current");
  } catch {
    // Ignore when there is no current session.
  }

  await appwriteAccount.createEmailPasswordSession(normalizedEmail, normalizedPassword);

  try {
    const response = await appwriteDatabases.listDocuments(
      appwriteDatabaseId,
      appwriteShopCollectionId,
      [Query.equal("email", normalizedEmail), Query.equal("role", "shopAdmin"), Query.limit(1)],
    );

    const shop = response.documents[0];

    if (!shop) {
      throw new Error("This account is not assigned as Shop Admin.");
    }

    return {
      email: normalizedEmail,
      name: String(shop.ownerName ?? "Shop Admin").trim() || "Shop Admin",
      avatar: typeof shop.image === "string" ? shop.image : undefined,
    };
  } catch (error) {
    try {
      await appwriteAccount.deleteSession("current");
    } catch {
      // Ignore nested sign-out errors.
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Shop Admin login failed.");
  }
}

const resolveShopDocumentId = async (payload: {
  appwriteDocumentId?: string;
  email: string;
}) => {
  if (payload.appwriteDocumentId) {
    return payload.appwriteDocumentId;
  }

  const normalizedEmail = normalizeEnvValue(payload.email).toLowerCase();
  const response = await appwriteDatabases.listDocuments(
    appwriteDatabaseId,
    appwriteShopCollectionId,
    [Query.equal("email", normalizedEmail), Query.limit(1)],
  );

  return response.documents[0]?.$id;
};

const tryDeleteShopAdminAccount = async (userId?: string) => {
  if (!userId || !shopAdminDeleteEndpoint) {
    return false;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (shopAdminDeleteToken) {
    headers.Authorization = `Bearer ${shopAdminDeleteToken}`;
  }

  const response = await fetch(shopAdminDeleteEndpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    throw new Error("Shop account delete endpoint failed.");
  }

  return true;
};

export async function updateShopInAppwrite(payload: UpdateShopInAppwritePayload) {
  ensureShopCollectionEnv();

  const documentId = await resolveShopDocumentId({
    appwriteDocumentId: payload.appwriteDocumentId,
    email: payload.email,
  });

  if (!documentId) {
    return null;
  }

  const updated = await appwriteDatabases.updateDocument(
    appwriteDatabaseId,
    appwriteShopCollectionId,
    documentId,
    {
      shopName: payload.updates.shopName.trim(),
      ownerName: payload.updates.ownerName.trim(),
      phoneNumber: payload.updates.phoneNumber.trim(),
      shopAddress: payload.updates.shopAddress.trim(),
      city: payload.updates.city.trim(),
      shopType: payload.updates.shopType.trim(),
      selectedPlanId: payload.updates.selectedPlanId,
      selectedPlanName: payload.updates.selectedPlanName,
      selectedPlanPrice: payload.updates.selectedPlanPrice,
      packageDuration: payload.updates.packageDuration,
      status: payload.updates.status,
      image: payload.updates.image || "",
    },
  );

  return {
    appwriteDocumentId: updated.$id,
    appwriteUserId: payload.appwriteUserId,
  };
}

export async function deleteShopInAppwrite(payload: DeleteShopInAppwritePayload) {
  ensureShopCollectionEnv();

  const documentId = await resolveShopDocumentId({
    appwriteDocumentId: payload.appwriteDocumentId,
    email: payload.email,
  });

  if (documentId) {
    await appwriteDatabases.deleteDocument(
      appwriteDatabaseId,
      appwriteShopCollectionId,
      documentId,
    );
  }

  const accountDeleted = await tryDeleteShopAdminAccount(payload.appwriteUserId);
  return { accountDeleted };
}