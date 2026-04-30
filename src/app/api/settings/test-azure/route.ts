import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";
import { auth } from "../../../../../auth";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";

export async function GET() {
  try {
    const session = await auth();
    if (!session) throw new ApiError("UNAUTHORIZED", "Unauthorized", 401);
    if (session.user?.role !== "admin") {
      throw new ApiError("FORBIDDEN", "Only admins can test integrations", 403);
    }

    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    const containerName = process.env.AZURE_STORAGE_CONTAINER || "cvs";

    if (!accountName || !accountKey) {
      return apiResponse({ configured: false, ok: false, error: "Azure Storage credentials are not configured" });
    }

    const credential = new StorageSharedKeyCredential(accountName, accountKey);
    const client = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      credential
    );
    await client.getContainerClient(containerName).exists();

    return apiResponse({ configured: true, ok: true, container: containerName });
  } catch (error) {
    return handleApiError(error);
  }
}

