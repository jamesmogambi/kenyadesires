"use server";

import { getBDSMEscortsOptimized } from "./escort.action";
import type { GetEscortsParams, GetEscortsResponse } from "./escort.action";

export async function getBDSMEscorts(
  params?: GetEscortsParams,
): Promise<GetEscortsResponse> {
  return getBDSMEscortsOptimized(params);
}
