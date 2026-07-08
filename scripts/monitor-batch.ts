import axios from "axios";

async function monitorBatch() {
  console.log("📊 Monitoring batch processing...");
  console.log("Press Ctrl+C to stop\n");

  let lastProgress = "";

  while (true) {
    try {
      const response = await axios.post(
        "http://localhost:4000/api/dewatermark/batch",
        { action: "status" },
        {
          headers: {
            "x-api-key":
              process.env.INTERNAL_API_KEY || "your_secure_internal_api_key",
            "Content-Type": "application/json",
          },
        },
      );

      const data = response.data;

      if (!data.isRunning && data.stats?.processedEscorts > 0) {
        console.log("\n✅ Batch processing completed!");
        console.log(`📊 Final stats:`);
        console.log(
          `   Escorts: ${data.stats.processedEscorts} processed, ${data.stats.failedEscorts} failed`,
        );
        console.log(
          `   Images: ${data.stats.processedImages} processed, ${data.stats.failedImages} failed`,
        );
        break;
      }

      if (!data.isRunning) {
        console.log("⏸️  No active batch processing");
        break;
      }

      const progress = data.progress;
      if (progress !== lastProgress) {
        console.log(progress);
        lastProgress = progress;

        if (data.stats) {
          console.log(
            `   ⏱️  Running for: ${Math.round((Date.now() - new Date(data.stats.startTime).getTime()) / 60000)} minutes`,
          );
          console.log(
            `   📸 Images: ${data.stats.processedImages}/${data.stats.totalImages}`,
          );
          console.log(`   ❌ Failed: ${data.stats.failedImages}`);
          console.log(
            `   💰 Credits used: ~${data.stats.processedImages} ($${(data.stats.processedImages * 0.01).toFixed(2)})`,
          );
        }

        if (data.checkpoint) {
          console.log(
            `   📌 Checkpoint: ${data.checkpoint.processedCount} escorts processed`,
          );
        }
        console.log("---");
      }

      await new Promise((resolve) => setTimeout(resolve, 10000));
    } catch (error: any) {
      console.error("❌ Monitor error:", error.message);
      await new Promise((resolve) => setTimeout(resolve, 30000));
    }
  }
}

monitorBatch();
