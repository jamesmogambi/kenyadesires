// lib/services/replicate.ts
import Replicate from "replicate";

let replicateInstance: Replicate | null = null;

export function getReplicateClient(): Replicate {
  if (!replicateInstance) {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      throw new Error("REPLICATE_API_TOKEN is not defined");
    }

    replicateInstance = new Replicate({
      auth: token,
    });
  }
  return replicateInstance;
}

export const REPLICATE_MODELS = {
  TEXT_REMOVAL: "flux-kontext-apps/text-removal",
  MAGI_CLEANER:
    "clsandoval/magi-cleaner:849ebb56f2ff68b925c64e68e0be6aa261e2a90d1d700c600264a1bae8cfce88",
  STABLE_DIFFUSION_INPAINT: "stability-ai/stable-diffusion-inpainting",
} as const;

export const CLEANING_OPTIONS = {
  textRemoval: {
    aspect_ratio: "match_input_image",
    output_format: "png",
    safety_tolerance: 2,
    guidance_scale: 7.5,
    num_inference_steps: 30,
  },
  magiCleaner: {
    fill: "auto",
  },
  inpainting: {
    num_inference_steps: 30,
    guidance_scale: 7.5,
    prompt_strength: 0.8,
  },
} as const;
