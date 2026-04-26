import { ID } from "appwrite";

import { appwriteBucketId, appwriteStorage } from "@/lib/appwrite";

const appwriteUrlPattern = /\/storage\/buckets\/[^/]+\/files\/([^/]+)\//;

const toErrorMessage = (error: unknown) => {
	if (error instanceof Error) {
		return error.message;
	}

	return "Unknown Appwrite storage error";
};

export function isAppwriteStorageUrl(url?: string) {
	if (!url) {
		return false;
	}

	return appwriteUrlPattern.test(url);
}

export function extractAppwriteFileId(url?: string) {
	if (!url) {
		return null;
	}

	const match = url.match(appwriteUrlPattern);
	return match?.[1] ?? null;
}

export async function uploadImageToAppwrite(file: File) {
	try {
		const uploadedFile = await appwriteStorage.createFile(
			appwriteBucketId,
			ID.unique(),
			file,
		);

		const fileUrl = appwriteStorage.getFileView(appwriteBucketId, uploadedFile.$id);

		return {
			fileId: uploadedFile.$id,
			fileUrl: String(fileUrl),
		};
	} catch (error) {
		throw new Error(`Failed to upload image to Appwrite: ${toErrorMessage(error)}`);
	}
}

export async function deleteImageFromAppwrite(imageUrl?: string) {
	const fileId = extractAppwriteFileId(imageUrl);

	if (!fileId) {
		return;
	}

	try {
		await appwriteStorage.deleteFile(appwriteBucketId, fileId);
	} catch (error) {
		// Ignore deletes for already-removed files, but surface permission/network issues.
		const message = toErrorMessage(error).toLowerCase();
		if (!message.includes("not found") && !message.includes("404")) {
			throw new Error(`Failed to delete image from Appwrite: ${toErrorMessage(error)}`);
		}
	}
}

export async function replaceImageInAppwrite(nextFile: File, previousImageUrl?: string) {
	const uploaded = await uploadImageToAppwrite(nextFile);
	await deleteImageFromAppwrite(previousImageUrl);
	return uploaded.fileUrl;
}

