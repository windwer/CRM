import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";
import logger from "../logger";
import { ApiError } from "../errors";

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "";
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || "";
const containerName = process.env.AZURE_STORAGE_CONTAINER || "cvs";

const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  sharedKeyCredential
);

/**
 * Uploads a file buffer to Azure Blob Storage.
 */
export async function uploadBlob(file: Buffer, filename: string): Promise<string> {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Ensure container exists (this might be slow to do every time, but safe for MVP)
    // In production, we'd ensure this once at startup or via infrastructure as code.
    await containerClient.createIfNotExists();

    const blobName = `${Date.now()}-${filename}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(file);
    
    logger.info("File uploaded to Azure Blob Storage", { blobName });
    return blobName;
  } catch (error) {
    logger.error("Error uploading to Azure Blob Storage", { error });
    throw new ApiError("STORAGE_ERROR", "Failed to upload file to storage", 500);
  }
}

/**
 * Downloads a blob from Azure Blob Storage as a Buffer.
 */
export async function getBlob(blobId: string): Promise<Buffer> {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobId);

    const downloadResponse = await blockBlobClient.download();
    const body = await streamToBuffer(downloadResponse.readableStreamBody!);
    
    return body;
  } catch (error) {
    logger.error("Error downloading from Azure Blob Storage", { error });
    throw new ApiError("STORAGE_ERROR", "Failed to download file from storage", 500);
  }
}

/**
 * Deletes a blob from Azure Blob Storage.
 */
export async function deleteBlob(blobId: string): Promise<void> {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobId);

    await blockBlobClient.delete();
    logger.info("File deleted from Azure Blob Storage", { blobId });
  } catch (error) {
    logger.error("Error deleting from Azure Blob Storage", { error });
    // Don't throw here to avoid breaking workflows if delete fails
  }
}

/**
 * Helper to convert a stream to a buffer.
 */
async function streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on("data", (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on("error", reject);
  });
}
