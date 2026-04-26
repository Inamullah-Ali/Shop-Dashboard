import { ID, Query } from "appwrite";

import {
	appwriteDatabaseId,
	appwriteDatabases,
	appwritePlanCollectionId,
} from "@/lib/appwrite";
import { formatPlanDurationLabel } from "@/lib/plan-utils";
import type { PlanRow } from "@/types/plant";

type CreatePlanPayload = {
	planName: string;
	durationMonths: number;
	price: number;
};

type UpdatePlanPayload = {
	appwriteDocumentId?: string;
	planName: string;
	durationMonths: number;
	price: number;
};

const ensurePlanCollectionEnv = () => {
	if (!appwriteDatabaseId || !appwritePlanCollectionId) {
		throw new Error(
			"Missing Appwrite plan config. Set VITE_APPWRITE_DATABASE_ID and VITE_APPWRITE_PLAN_COLLECTION_ID in .env",
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

const normalizePlanDocument = (document: Record<string, unknown>): PlanRow => {
	const appwriteDocumentId = toStringValue(document.$id);
	const planName = toStringValue(document.planName);
	const durationMonths = Math.max(1, Math.trunc(toNumberValue(document.durationMonths, 1)));

	return {
		id:
			typeof document.id === "number" && Number.isFinite(document.id)
				? document.id
				: toStableNumericId(appwriteDocumentId),
		appwriteDocumentId: appwriteDocumentId || undefined,
		planName,
		durationMonths,
		durationLabel:
			toStringValue(document.durationLabel) ||
			formatPlanDurationLabel(planName, durationMonths),
		price: toNumberValue(document.price, 0),
		updatedAt: toStringValue(document.updatedAt) || toStringValue(document.$updatedAt),
	};
};

export async function fetchPlansFromAppwrite() {
	ensurePlanCollectionEnv();

	const response = await appwriteDatabases.listDocuments(
		appwriteDatabaseId,
		appwritePlanCollectionId,
		[Query.orderDesc("$updatedAt")],
	);

	return response.documents.map((document) =>
		normalizePlanDocument(document as Record<string, unknown>),
	);
}

export async function createPlanInAppwrite(payload: CreatePlanPayload) {
	ensurePlanCollectionEnv();

	const planName = payload.planName.trim();
	const durationMonths = Math.max(1, Math.trunc(payload.durationMonths));
	const price = Math.max(0, payload.price);
	const durationLabel = formatPlanDurationLabel(planName, durationMonths);
	const updatedAt = new Date().toISOString();

	const created = await appwriteDatabases.createDocument(
		appwriteDatabaseId,
		appwritePlanCollectionId,
		ID.unique(),
		{
			planName,
			durationMonths,
			durationLabel,
			price,
			updatedAt,
		},
	);

	return normalizePlanDocument(created as Record<string, unknown>);
}

export async function updatePlanInAppwrite(payload: UpdatePlanPayload) {
	ensurePlanCollectionEnv();

	if (!payload.appwriteDocumentId) {
		throw new Error("Missing Appwrite document ID for the selected plan.");
	}

	const planName = payload.planName.trim();
	const durationMonths = Math.max(1, Math.trunc(payload.durationMonths));
	const price = Math.max(0, payload.price);
	const durationLabel = formatPlanDurationLabel(planName, durationMonths);
	const updatedAt = new Date().toISOString();

	const updated = await appwriteDatabases.updateDocument(
		appwriteDatabaseId,
		appwritePlanCollectionId,
		payload.appwriteDocumentId,
		{
			planName,
			durationMonths,
			durationLabel,
			price,
			updatedAt,
		},
	);

	return normalizePlanDocument(updated as Record<string, unknown>);
}

export async function deletePlanInAppwrite(appwriteDocumentId?: string) {
	ensurePlanCollectionEnv();

	if (!appwriteDocumentId) {
		throw new Error("Missing Appwrite document ID for the selected plan.");
	}

	await appwriteDatabases.deleteDocument(
		appwriteDatabaseId,
		appwritePlanCollectionId,
		appwriteDocumentId,
	);
}
