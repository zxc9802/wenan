import {
  AppSessionUnauthorizedError,
  appSessionErrorPayload,
  assertAppSessionFromRequest,
  buildPublicSessionData,
  isMainAppSsoRequired,
} from "@/app/lib/server/app-session";

export async function GET(request: Request) {
  try {
    const session = await assertAppSessionFromRequest(request);

    return Response.json({
      success: true,
      data: {
        requiresSso: isMainAppSsoRequired(),
        session: buildPublicSessionData(session),
      },
    });
  } catch (error) {
    if (error instanceof AppSessionUnauthorizedError) {
      return Response.json(appSessionErrorPayload(error), { status: error.status });
    }
    throw error;
  }
}
