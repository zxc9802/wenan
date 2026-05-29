import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type R2Config = {
  bucket: string;
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  tempPrefix: string;
  presignedTtlSeconds: number;
};

const DEFAULT_TEMP_PREFIX = "temp/video/";
const DEFAULT_PRESIGNED_TTL_SECONDS = 900;

function cleanEnv(value: string | undefined) {
  return value?.trim() || "";
}

function normalizePrefix(value: string) {
  const clean = value.trim().replace(/^\/+/, "");
  return clean.endsWith("/") ? clean : `${clean}/`;
}

function readPositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function requireR2Config(): R2Config {
  const accountId = cleanEnv(process.env.R2_ACCOUNT_ID);
  const bucket = cleanEnv(process.env.R2_BUCKET);
  const endpoint = cleanEnv(process.env.R2_ENDPOINT) || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
  const accessKeyId = cleanEnv(process.env.R2_ACCESS_KEY_ID);
  const secretAccessKey = cleanEnv(process.env.R2_SECRET_ACCESS_KEY);

  const missing = [
    ["R2_BUCKET", bucket],
    ["R2_ENDPOINT 或 R2_ACCOUNT_ID", endpoint],
    ["R2_ACCESS_KEY_ID", accessKeyId],
    ["R2_SECRET_ACCESS_KEY", secretAccessKey],
  ].filter(([, value]) => !value);

  if (missing.length > 0) {
    throw new Error(`R2 临时视频存储未配置完整：${missing.map(([key]) => key).join("、")}`);
  }

  return {
    bucket,
    endpoint,
    accessKeyId,
    secretAccessKey,
    region: cleanEnv(process.env.R2_REGION) || "auto",
    tempPrefix: normalizePrefix(cleanEnv(process.env.R2_TEMP_PREFIX) || DEFAULT_TEMP_PREFIX),
    presignedTtlSeconds: readPositiveInt(process.env.R2_PRESIGNED_TTL_SECONDS, DEFAULT_PRESIGNED_TTL_SECONDS),
  };
}

function createR2Client(config: R2Config) {
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

function sanitizeFileName(fileName: string) {
  const clean = fileName.trim().split(/[\\/]/).pop() || "video.mp4";
  return clean.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "video.mp4";
}

function createTempVideoObjectKey(fileName: string, config: R2Config) {
  return `${config.tempPrefix}${Date.now()}-${randomUUID()}-${sanitizeFileName(fileName)}`;
}

function assertTempObjectKey(objectKey: string, config: R2Config) {
  if (!objectKey || objectKey.includes("..") || objectKey.startsWith("/") || !objectKey.startsWith(config.tempPrefix)) {
    throw new Error("R2 临时视频 objectKey 非法");
  }
}

export async function createPresignedR2Upload(input: {
  fileName: string;
  contentType: string;
}) {
  if (!input.contentType.startsWith("video/")) {
    throw new Error("仅支持上传 video/* 类型文件");
  }

  const config = requireR2Config();
  const client = createR2Client(config);
  const objectKey = createTempVideoObjectKey(input.fileName, config);
  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: objectKey,
    ContentType: input.contentType,
  });

  return {
    objectKey,
    uploadUrl: await getSignedUrl(client, command, { expiresIn: config.presignedTtlSeconds }),
    expiresIn: config.presignedTtlSeconds,
  };
}

export async function createPresignedR2ReadUrl(objectKey: string) {
  const config = requireR2Config();
  assertTempObjectKey(objectKey, config);

  const client = createR2Client(config);
  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: objectKey,
  });

  return getSignedUrl(client, command, { expiresIn: config.presignedTtlSeconds });
}

export async function deleteTempR2Object(objectKey: string) {
  const config = requireR2Config();
  assertTempObjectKey(objectKey, config);

  const client = createR2Client(config);
  await client.send(new DeleteObjectCommand({
    Bucket: config.bucket,
    Key: objectKey,
  }));
}
