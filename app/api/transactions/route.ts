import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

function sortTransactions(docs: any[]) {
  return docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || a.createdAt?._seconds * 1000 || 0;
      const bTime = b.createdAt?.toMillis?.() || b.createdAt?._seconds * 1000 || 0;
      return bTime - aTime;
    })
    .slice(0, 50);
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Not available" }, { status: 503 });
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    const message = error.message || "Failed to fetch transactions";
    const needsIndex = message.includes("index") || message.includes("Index");
    return NextResponse.json(
      {
        error: "internal_error",
        detail: needsIndex ? "Index missing" : message,
      },
      { status: 500 },
    );
  }
}
