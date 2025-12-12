import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export interface StorageAdapter {
  upload(key: string, data: Buffer, metadata?: StorageMetadata): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}

export interface StorageMetadata {
  contentType?: string;
  fileName?: string;
}

class LocalStorageAdapter implements StorageAdapter {
  private basePath: string;

  constructor(basePath = "./uploads") {
    this.basePath = basePath;
    this.ensureBasePath();
  }

  private async ensureBasePath() {
    if (!existsSync(this.basePath)) {
      await mkdir(this.basePath, { recursive: true });
    }
  }

  async upload(key: string, data: Buffer, _metadata?: StorageMetadata): Promise<string> {
    const filePath = join(this.basePath, key);
    const dir = join(this.basePath, key.split("/").slice(0, -1).join("/"));

    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    await writeFile(filePath, data);
    return key;
  }

  async download(key: string): Promise<Buffer> {
    const filePath = join(this.basePath, key);
    return await readFile(filePath);
  }

  async delete(key: string): Promise<void> {
    const filePath = join(this.basePath, key);
    if (existsSync(filePath)) {
      await unlink(filePath);
    }
  }

  getUrl(key: string): string {
    return `/api/files/${key}`;
  }
}

class S3StorageAdapter implements StorageAdapter {
  private bucket: string;
  private endpoint: string;
  private accessKey: string;
  private secretKey: string;
  private region: string;

  constructor(config: {
    bucket: string;
    endpoint: string;
    accessKey: string;
    secretKey: string;
    region: string;
  }) {
    this.bucket = config.bucket;
    this.endpoint = config.endpoint;
    this.accessKey = config.accessKey;
    this.secretKey = config.secretKey;
    this.region = config.region;
  }

  async upload(_key: string, _data: Buffer, _metadata?: StorageMetadata): Promise<string> {
    // TODO: Implement S3-compatible upload using AWS SDK or similar
    throw new Error("S3 storage not yet implemented");
  }

  async download(_key: string): Promise<Buffer> {
    // TODO: Implement S3-compatible download
    throw new Error("S3 storage not yet implemented");
  }

  async delete(_key: string): Promise<void> {
    // TODO: Implement S3-compatible delete
    throw new Error("S3 storage not yet implemented");
  }

  getUrl(key: string): string {
    return `${this.endpoint}/${this.bucket}/${key}`;
  }
}

function createStorageAdapter(): StorageAdapter {
  const useS3 =
    process.env.FILE_STORAGE_BUCKET &&
    process.env.FILE_STORAGE_ENDPOINT &&
    process.env.FILE_STORAGE_ACCESS_KEY &&
    process.env.FILE_STORAGE_SECRET_KEY;

  if (useS3) {
    return new S3StorageAdapter({
      bucket: process.env.FILE_STORAGE_BUCKET!,
      endpoint: process.env.FILE_STORAGE_ENDPOINT!,
      accessKey: process.env.FILE_STORAGE_ACCESS_KEY!,
      secretKey: process.env.FILE_STORAGE_SECRET_KEY!,
      region: process.env.FILE_STORAGE_REGION ?? "eu-central-1",
    });
  }

  const localPath = process.env.LOCAL_STORAGE_PATH ?? "./uploads";
  return new LocalStorageAdapter(localPath);
}

export const storage = createStorageAdapter();

export async function uploadFile(spaceId: string, file: File, category?: string): Promise<string> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = category
    ? `${spaceId}/${category}/${timestamp}-${safeName}`
    : `${spaceId}/${timestamp}-${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  await storage.upload(key, buffer, {
    contentType: file.type,
    fileName: file.name,
  });

  return key;
}

export async function deleteFile(key: string): Promise<void> {
  await storage.delete(key);
}

export async function getFileUrl(key: string): Promise<string> {
  return storage.getUrl(key);
}
