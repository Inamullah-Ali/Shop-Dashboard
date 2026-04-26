import { Client, Storage } from "appwrite";

declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_APPWRITE_ENDPOINT: string;
      readonly VITE_APPWRITE_PROJECT_ID: string;
    };
  }
}

const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const storage = new Storage(client);
