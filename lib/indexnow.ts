export type IndexNowResult = {
  success: boolean;
  submitted: number;
  batches: number;
  statuses: number[];
  errors: string[];
};

const INDEXNOW_ENDPOINT = process.env.INDEXNOW_ENDPOINT || "https://api.indexnow.org/indexnow";
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "";
const INDEXNOW_HOST = process.env.INDEXNOW_HOST || "";
const INDEXNOW_BATCH_SIZE = 500;
const INDEXNOW_DELAY_MS = 200;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function submitUrlsToIndexNow(urls: string[]): Promise<IndexNowResult> {
  if (process.env.NODE_ENV !== "production") {
    return {
      success: true,
      submitted: 0,
      batches: 0,
      statuses: [],
      errors: ["Skipped: not production"],
    };
  }

  if (!INDEXNOW_KEY || !INDEXNOW_HOST) {
    return {
      success: false,
      submitted: 0,
      batches: 0,
      statuses: [],
      errors: ["Missing INDEXNOW_KEY or INDEXNOW_HOST"],
    };
  }

  const uniqueUrls = Array.from(new Set(urls));
  const validUrls: string[] = [];
  const invalidUrls: string[] = [];

  for (const url of uniqueUrls) {
    try {
      const u = new URL(url);
      if (u.hostname === INDEXNOW_HOST || u.hostname === `www.${INDEXNOW_HOST}`) {
        validUrls.push(url);
      } else {
        invalidUrls.push(url);
      }
    } catch {
      invalidUrls.push(url);
    }
  }

  if (invalidUrls.length > 0) {
    console.warn(`[IndexNow] Filtered out ${invalidUrls.length} URLs not matching host ${INDEXNOW_HOST}:`, invalidUrls.slice(0, 10));
  }

  if (validUrls.length === 0) {
    return {
      success: true,
      submitted: 0,
      batches: 0,
      statuses: [],
      errors: [],
    };
  }

  const batches: string[][] = [];
  for (let i = 0; i < validUrls.length; i += INDEXNOW_BATCH_SIZE) {
    batches.push(validUrls.slice(i, i + INDEXNOW_BATCH_SIZE));
  }

  const keyLocation = `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`;
  const statuses: number[] = [];
  const errors: string[] = [];
  let totalSubmitted = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const payload = {
      host: INDEXNOW_HOST,
      key: INDEXNOW_KEY,
      keyLocation,
      urlList: batch,
    };

    try {
      const res = await fetch(INDEXNOW_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify(payload),
      });

      statuses.push(res.status);

      if (res.status === 200 || res.status === 202) {
        totalSubmitted += batch.length;
        console.log(`[IndexNow] Batch ${i + 1}/${batches.length} — ${batch.length} URLs — status ${res.status}`);
      } else {
        const body = await res.text().catch(() => "");
        const err = `Batch ${i + 1} failed: HTTP ${res.status} — ${body}`;
        errors.push(err);
        console.error(`[IndexNow] ${err}`);
      }
    } catch (err: any) {
      const errMsg = `Batch ${i + 1} network error: ${err?.message || err}`;
      statuses.push(0);
      errors.push(errMsg);
      console.error(`[IndexNow] ${errMsg}`);
    }

    if (i < batches.length - 1) {
      await sleep(INDEXNOW_DELAY_MS);
    }
  }

  const success = errors.length === 0 && totalSubmitted > 0;

  return {
    success,
    submitted: totalSubmitted,
    batches: batches.length,
    statuses,
    errors,
  };
}