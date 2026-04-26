import { ID, Query } from "appwrite";

import {
  appwriteDatabaseId,
  appwriteDatabases,
  appwriteProductCollectionId,
} from "@/lib/appwrite";
import type { Product } from "@/types/product";

type CreateProductPayload = {
  ownerEmail: string;
  ownerName: string;
  productName: string;
  productImage?: string;
  price: number;
  quantity: number;
  discount: number;
};

type ResolveProductPayload = {
  appwriteDocumentId?: string;
  ownerEmail: string;
  productName: string;
};

type UpdateProductPayload = ResolveProductPayload & {
  updates: {
    productName: string;
    productImage?: string;
    price: number;
    quantity: number;
    discount: number;
  };
};

const ensureProductCollectionEnv = () => {
  if (!appwriteDatabaseId || !appwriteProductCollectionId) {
    throw new Error(
      "Missing Appwrite product config. Set VITE_APPWRITE_DATABASE_ID and VITE_APPWRITE_PRODUCT_COLLECTION_ID in .env",
    );
  }
};

const toStringValue = (value: unknown) => (typeof value === "string" ? value : "");

const toNumberValue = (value: unknown, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const toStableNumericId = (value: string) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash || Date.now();
};

const normalizeProductDocument = (document: Record<string, unknown>): Product => {
  const appwriteDocumentId = toStringValue(document.$id);

  return {
    id:
      typeof document.id === "number" && Number.isFinite(document.id)
        ? document.id
        : toStableNumericId(appwriteDocumentId),
    appwriteDocumentId: appwriteDocumentId || undefined,
    createdAt: toStringValue(document.createdAt) || toStringValue(document.$createdAt),
    ownerEmail: toStringValue(document.ownerEmail).toLowerCase().trim(),
    ownerName: toStringValue(document.ownerName).trim(),
    productName: toStringValue(document.productName).trim(),
    productImage: toStringValue(document.productImage) || undefined,
    price: Math.max(0, toNumberValue(document.price, 0)),
    quantity: Math.max(0, Math.trunc(toNumberValue(document.quantity, 0))),
    discount: Math.max(0, toNumberValue(document.discount, 0)),
  };
};

export async function fetchProductsFromAppwrite() {
  ensureProductCollectionEnv();

  const response = await appwriteDatabases.listDocuments(
    appwriteDatabaseId,
    appwriteProductCollectionId,
    [Query.orderDesc("$updatedAt"), Query.limit(500)],
  );

  return response.documents.map((document) =>
    normalizeProductDocument(document as Record<string, unknown>),
  );
}

async function resolveProductDocumentId(payload: ResolveProductPayload) {
  if (payload.appwriteDocumentId) {
    return payload.appwriteDocumentId;
  }

  const normalizedEmail = payload.ownerEmail.toLowerCase().trim();
  const productName = payload.productName.trim();

  const response = await appwriteDatabases.listDocuments(
    appwriteDatabaseId,
    appwriteProductCollectionId,
    [
      Query.equal("ownerEmail", normalizedEmail),
      Query.equal("productName", productName),
      Query.limit(1),
      Query.orderDesc("$updatedAt"),
    ],
  );

  return response.documents[0]?.$id;
}

export async function createProductInAppwrite(payload: CreateProductPayload) {
  ensureProductCollectionEnv();

  const created = await appwriteDatabases.createDocument(
    appwriteDatabaseId,
    appwriteProductCollectionId,
    ID.unique(),
    {
      ownerEmail: payload.ownerEmail.toLowerCase().trim(),
      ownerName: payload.ownerName.trim(),
      productName: payload.productName.trim(),
      productImage: payload.productImage ?? "",
      price: Math.max(0, payload.price),
      quantity: Math.max(0, Math.trunc(payload.quantity)),
      discount: Math.max(0, payload.discount),
    },
  );

  return normalizeProductDocument(created as Record<string, unknown>);
}

export async function updateProductInAppwrite(payload: UpdateProductPayload) {
  ensureProductCollectionEnv();

  const documentId = await resolveProductDocumentId(payload);

  if (!documentId) {
    throw new Error("Missing Appwrite document for this product.");
  }

  const updated = await appwriteDatabases.updateDocument(
    appwriteDatabaseId,
    appwriteProductCollectionId,
    documentId,
    {
      productName: payload.updates.productName.trim(),
      productImage: payload.updates.productImage ?? "",
      price: Math.max(0, payload.updates.price),
      quantity: Math.max(0, Math.trunc(payload.updates.quantity)),
      discount: Math.max(0, payload.updates.discount),
    },
  );

  return normalizeProductDocument(updated as Record<string, unknown>);
}

export async function deleteProductInAppwrite(payload: ResolveProductPayload) {
  ensureProductCollectionEnv();

  const documentId = await resolveProductDocumentId(payload);

  if (!documentId) {
    throw new Error("Missing Appwrite document for this product.");
  }

  await appwriteDatabases.deleteDocument(
    appwriteDatabaseId,
    appwriteProductCollectionId,
    documentId,
  );
}
