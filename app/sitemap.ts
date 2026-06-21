import {MetadataRoute} from "next";
import {collection, getDocs, query, where} from "firebase/firestore";
import {db} from "@/lib/firebase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = "https://kenyadivas.com";

    // Static routes
    const staticRoutes = [
        "",
        "/girls",
        "/agencies",
        "/blog",
        "/contact",
        "/frequent-questions",
        "/terms-of-use-of-the-web-interface-for-users",
        "/terms-of-use-for-the-web-interface-for-advertisers-and-users",
        "/withdrawal-from-contract",
        "/bdsm",
        "/erotic-massages",
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: route === "" ? 1 : 0.8,
    }));

    // Dynamic routes - Girls/Escorts
    let escortRoutes: MetadataRoute.Sitemap = [];
    try {
        const escortsRef = collection(db, "escorts");
        const escortsSnapshot = await getDocs(escortsRef);
        escortRoutes = escortsSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                url: `${baseUrl}/girl/${data.id}`,
                lastModified: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
                changeFrequency: "weekly" as const,
                priority: 0.7,
            };
        }).filter(route => route.url.split('/').pop()); // Ensure slug exists
    } catch (error) {
        console.error("Error fetching escorts for sitemap:", error);
    }

    // Dynamic routes - Agencies
    let agencyRoutes: MetadataRoute.Sitemap = [];
    try {
        const agenciesRef = collection(db, "agencies");
        const agenciesSnapshot = await getDocs(agenciesRef);
        agencyRoutes = agenciesSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                url: `${baseUrl}/agencies/${data.slug}`,
                lastModified: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
                changeFrequency: "weekly" as const,
                priority: 0.6,
            };
        }).filter(route => route.url.split('/').pop());
    } catch (error) {
        console.error("Error fetching agencies for sitemap:", error);
    }

    // Dynamic routes - Blog Posts
    let blogRoutes: MetadataRoute.Sitemap = [];
    try {
        const blogRef = collection(db, "blogPosts");
        const blogQuery = query(blogRef, where("isPublished", "==", true));
        const blogSnapshot = await getDocs(blogQuery);
        blogRoutes = blogSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                url: `${baseUrl}/blog/${data.slug}`,
                lastModified: data.publishedAt?.toDate ? data.publishedAt.toDate() : (data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date()),
                changeFrequency: "monthly" as const,
                priority: 0.5,
            };
        }).filter(route => route.url.split('/').pop());
    } catch (error) {
        console.error("Error fetching blog posts for sitemap:", error);
    }

    return [...staticRoutes, ...escortRoutes, ...agencyRoutes, ...blogRoutes];
}
