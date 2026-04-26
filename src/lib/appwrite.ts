import { Account, Client, Databases, Storage } from "appwrite";

const normalizeEnvValue = (value?: string) =>
  value?.trim().replace(/^['\"]|['\"]$/g, "") || "";

const endpoint = normalizeEnvValue(import.meta.env.VITE_APPWRITE_ENDPOINT);
const projectId = normalizeEnvValue(import.meta.env.VITE_APPWRITE_PROJECT_ID);
const bucketId = normalizeEnvValue(import.meta.env.VITE_APPWRITE_BUCKET_ID);
const databaseId = normalizeEnvValue(import.meta.env.VITE_APPWRITE_DATABASE_ID);
const shopCollectionId = normalizeEnvValue(import.meta.env.VITE_APPWRITE_SHOP_COLLECTION_ID);
const planCollectionId = normalizeEnvValue(import.meta.env.VITE_APPWRITE_PLAN_COLLECTION_ID);
const productCollectionId = normalizeEnvValue(import.meta.env.VITE_APPWRITE_PRODUCT_COLLECTION_ID);
const customerCollectionId = normalizeEnvValue(import.meta.env.VITE_APPWRITE_CUSTOMER_COLLECTION_ID);

if (!endpoint || !projectId || !bucketId) {
  throw new Error("Appwrite env vars are missing. Check VITE_APPWRITE_ENDPOINT, VITE_APPWRITE_PROJECT_ID, and VITE_APPWRITE_BUCKET_ID.");
}

const client = new Client();

client.setEndpoint(endpoint).setProject(projectId);

export const appwriteClient = client;
export const appwriteStorage = new Storage(client);
export const appwriteAccount = new Account(client);
export const appwriteDatabases = new Databases(client);
export const appwriteBucketId = bucketId;
export const appwriteDatabaseId = databaseId;
export const appwriteShopCollectionId = shopCollectionId;
export const appwritePlanCollectionId = planCollectionId;
export const appwriteProductCollectionId = productCollectionId;
export const appwriteCustomerCollectionId = customerCollectionId;

