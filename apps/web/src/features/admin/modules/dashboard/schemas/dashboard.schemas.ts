import { z } from "zod";
import { PIPELINE_STAGES } from "../types/dashboard.types";

export const moveOrderStageSchema = z.object({ orderId: z.uuid(), stage: z.enum(PIPELINE_STAGES) });
export const hideFabricProductSchema = z.object({ productId: z.uuid() });
