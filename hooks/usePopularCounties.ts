// // hooks/usePopularCounties.ts
// "use client";

// import { getCachedPopularCounties } from "@/lib/cache";
// import { useEffect, useState } from "react";

// // Define the County type based on your data structure
// interface County {
//   id: string;
//   name: string;
//   slug: string;
//   [key: string]: any;
// }

// interface UseCountiesReturn {
//   counties: County[];
//   loading: boolean;
//   error: string | null;
//   refetch: () => Promise<void>;
// }

// export function usePopularCounties(limit: number = 15): UseCountiesReturn {
//   const [counties, setCounties] = useState<County[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);

//   const fetchCounties = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       // ✅ Now calling the server action directly
//       const res = await getPopularCounties(limit);

//       if (res.success) {
//         setCounties(res.data);
//       } else {
//         setError(res.error || "Failed to load counties");
//         setCounties([]);
//       }
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Error loading data");
//       setCounties([]);
//       console.error("Error fetching counties:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchCounties();
//   }, [limit]);

//   return {
//     counties,
//     loading,
//     error,
//     refetch: fetchCounties,
//   };
// }
