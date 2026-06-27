import { NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getBlogPostsCountForSitemap } from "@/lib/sanity/queries";

export async function GET() {
  try {
    // Check blog posts
    const blogCount = await getBlogPostsCountForSitemap();

    // Check escorts
    let escortCount = 0;
    try {
      const escortsRef = collection(db, "escorts");
      const escortsSnapshot = await getDocs(escortsRef);
      escortCount = escortsSnapshot.docs.length;
    } catch (error) {
      console.error("Error fetching escorts:", error);
    }

    // Check agencies
    let agencyCount = 0;
    try {
      const agenciesRef = collection(db, "agencies");
      const agenciesSnapshot = await getDocs(agenciesRef);
      agencyCount = agenciesSnapshot.docs.length;
    } catch (error) {
      console.error("Error fetching agencies:", error);
    }

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      counts: {
        blog: blogCount,
        escorts: escortCount,
        agencies: agencyCount,
        total: blogCount + escortCount + agencyCount,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { status: "unhealthy", error: String(error) },
      { status: 500 },
    );
  }
}
