import { NextResponse } from "next/server";
import { createPresignedR2Upload } from "@/app/lib/server/r2";
import { sessionErrorResponse } from "@/app/lib/server/app-session";

type VideoUploadRequestBody = {
  fileName?: string;
  contentType?: string;
  size?: number;
};

const MAX_VIDEO_UPLOAD_BYTES = 500 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const sessionError = await sessionErrorResponse(request);
    if (sessionError) return sessionError;

    const body = (await request.json()) as VideoUploadRequestBody;
    const contentType = body.contentType || "";

    if (!contentType.startsWith("video/")) {
      return NextResponse.json(
        { success: false, error: "仅支持上传 video/* 类型文件" },
        { status: 400 }
      );
    }

    if (typeof body.size === "number" && body.size > MAX_VIDEO_UPLOAD_BYTES) {
      return NextResponse.json(
        { success: false, error: "视频文件超过 500MB，请压缩后再上传解析" },
        { status: 413 }
      );
    }

    const upload = await createPresignedR2Upload({
      fileName: body.fileName || "video.mp4",
      contentType,
    });
    const { uploadUrl, objectKey, expiresIn } = upload;

    return NextResponse.json({
      success: true,
      uploadUrl,
      objectKey,
      expiresIn,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
