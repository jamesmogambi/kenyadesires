import axios from "axios";

async function processAll() {
  console.log("🚀 Starting batch processing...");

  try {
    const response = await axios.post(
      "http://localhost:4000/api/dewatermark/batch",
      {
        action: "start",
        limit: 50,
        batchSize: 5,
        maxConcurrent: 3,
      },
      {
        headers: {
          "x-api-key":
            process.env.INTERNAL_API_KEY || "your_secure_internal_api_key",
          "Content-Type": "application/json",
        },
      },
    );

    console.log("✅ Batch processing started!");
    console.log(response.data);
  } catch (error: any) {
    console.error("❌ Failed to start:", error.message);
  }
}

processAll();
