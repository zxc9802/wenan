import { NextResponse } from "next/server";
import { uploadTempVideoToR2 } from "@/app/lib/server/r2";
import { sessionErrorResponse } from "@/app/lib/server/app-session";

const MAX_VIDEO_UPLOAD_BYTES = 500 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const sessionError = await sessionErrorResponse(request);
    if (sessionError) return sessionError;

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "缺少视频文件" },
        { status: 400 }
      );
    }

    const contentType = file.type || "video/mp4";
    if (!contentType.startsWith("video/")) {
      return NextResponse.json(
        { success: false, error: "仅支持上传 video/* 类型文件" },
        { status: 400 }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        { success: false, error: "视频文件为空，请重新上传" },
        { status: 400 }
      );
    }

    if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
      return NextResponse.json(
        { success: false, error: "视频文件超过 500MB，请压缩后再上传解析" },
        { status: 413 }
      );
    }

    const upload = await uploadTempVideoToR2({
      fileName: file.name || "video.mp4",
      contentType,
      body: new Uint8Array(await file.arrayBuffer()),
      size: file.size,
    });
    const { objectKey } = upload;

    return NextResponse.json({
      success: true,
      objectKey,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
