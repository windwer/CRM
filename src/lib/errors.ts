import { NextResponse } from "next/server";

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public status: number = 400
  ) {
    super(message);
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: { code: error.code, message: error.message },
      },
      { status: error.status }
    );
  }

  console.error("[API_ERROR]", error);

  return NextResponse.json(
    {
      success: false,
      error: { code: "INTERNAL_SERVER_ERROR", message: "Something went wrong" },
    },
    { status: 500 }
  );
}

export function apiResponse<T>(data: T, meta?: ApiSuccessResponse<T>["meta"]) {
  return NextResponse.json({
    success: true,
    data,
    meta,
  });
}
