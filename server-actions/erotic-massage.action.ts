"use server";

import { getEroticMassageEscortsOptimized } from "./escort.action";
import type { GetEscortsParams, GetEscortsResponse } from "./escort.action";

export async function getEroticMassageEscorts(
  params?: GetEscortsParams,
): Promise<GetEscortsResponse> {
  return getEroticMassageEscortsOptimized(params);
}
