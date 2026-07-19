// "use client";

// import { useEffect } from "react";
// import { useFilterInputStore } from "@/app/girls/filterInputStore";
// import { useVariantStore } from "@/store/variantStore";

// interface Props {
//   initialCounties?: any[];
//   initialRegions?: any[];
//   initialLookup?: any;
// }

// const LocationInitializer = ({
//   initialCounties,
//   initialRegions,
//   initialLookup,
// }: Props) => {
//   const { setCounties, setRegions, setPractices } = useFilterInputStore();
//   const {
//     setMassage,
//     setBdsm,
//     setPractices: setVariantPractices,
//   } = useVariantStore();

//   useEffect(() => {
//     // ✅ Use initial data if provided
//     if (initialCounties) setCounties(initialCounties);
//     if (initialRegions) setRegions(initialRegions);
//     if (initialLookup) {
//       setPractices(initialLookup.practices || []);
//       setMassage(initialLookup.massage || []);
//       setBdsm(initialLookup.bdsm || []);
//       setVariantPractices(initialLookup.practices || []);
//     }
//   }, [initialCounties, initialRegions, initialLookup]);

//   return null;
// };

// export default LocationInitializer;
"use client";

import { useEffect, useState } from "react";
import { useFilterInputStore } from "@/app/girls/filterInputStore";
import { useVariantStore } from "@/store/variantStore";
import { getPracticesFromCleanedEscorts } from "@/server-actions/cleaned-escorts.action";

interface Props {
  initialCounties?: any[];
  initialRegions?: any[];
  initialLookup?: any;
  filters?: {
    county?: string;
    region?: string;
    town?: string;
    estate?: string;
    category?: string;
    categories?: string[];
    nationality?: string;
    isActive?: boolean;
    isVerified?: boolean;
    isFeatured?: boolean;
    minRating?: number;
  };
}

const LocationInitializer = ({
  initialCounties,
  initialRegions,
  initialLookup,
  filters = {},
}: Props) => {
  const { setCounties, setRegions, setPractices } = useFilterInputStore();
  const {
    setMassage,
    setBdsm,
    setPractices: setVariantPractices,
    setAvailability,
    setAge,
    setBreast,
    setCharacter,
    setHairColor,
    setNationality,
    setExperience,
    setLanguages,
    setCategories,
  } = useVariantStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPractices() {
      try {
        setLoading(true);
        setError(null);

        // ✅ Call the server action to get practices from escorts with cleaned images
        const practicesFromCleanedEscorts =
          await getPracticesFromCleanedEscorts({
            county: filters.county,
            region: filters.region,
            town: filters.town,
            estate: filters.estate,
            category: filters.category,
            categories: filters.categories,
            nationality: filters.nationality,
            isActive: filters.isActive !== undefined ? filters.isActive : true,
            isVerified: filters.isVerified,
            isFeatured: filters.isFeatured,
            minRating: filters.minRating,
          });

        // ✅ Convert to the format expected by the stores
        const formattedPractices = practicesFromCleanedEscorts.map(
          (item, idx) => ({
            // ensure shape matches NamedItem (id: number, name: string)
            // derive a numeric id from the index to satisfy the NamedItem type
            id: idx,
            name: item.practice,
            label: item.practice,
            value: item.practice,
            count: item.count,
          }),
        );

        // ✅ Set practices in both stores
        // variant store expects objects, filter input store expects string[]
        setPractices(formattedPractices.map((p) => p.value));
        setVariantPractices(formattedPractices);

        console.log(
          `✅ Loaded ${formattedPractices.length} practices from cleaned escorts`,
        );
      } catch (err) {
        console.error("Error fetching practices from cleaned escorts:", err);
        setError("Failed to load practices");

        // ✅ Fallback to initialLookup if available
        if (initialLookup?.practices) {
          // normalize fallback: filter input store expects string[]
          setPractices(
            Array.isArray(initialLookup.practices)
              ? initialLookup.practices.map((p: any) =>
                  typeof p === "string" ? p : p.value,
                )
              : [],
          );
          setVariantPractices(initialLookup.practices);
        }
      } finally {
        setLoading(false);
      }
    }

    // ✅ Fetch practices from cleaned escorts
    fetchPractices();
  }, [
    filters.county,
    filters.region,
    filters.town,
    filters.estate,
    filters.category,
    filters.categories,
    filters.nationality,
    filters.isActive,
    filters.isVerified,
    filters.isFeatured,
    filters.minRating,
  ]);

  // ✅ Initialize counties and regions from props (these can come from server)
  useEffect(() => {
    if (initialCounties) setCounties(initialCounties);
    if (initialRegions) setRegions(initialRegions);

    if (initialLookup) {
      setMassage(initialLookup.massage || []);
      setBdsm(initialLookup.bdsm || []);
      setAvailability(initialLookup.availability || []);
      setAge(initialLookup.age || []);
      setBreast(initialLookup.breast || []);
      setCharacter(initialLookup.character || []);
      setHairColor(initialLookup.hairColor || []);
      setNationality(initialLookup.nationality || []);
      setExperience(initialLookup.experience || []);
      setLanguages(initialLookup.languages || []);
      setCategories(initialLookup.categories || []);
      if (initialLookup.practices) {
        setVariantPractices(
          Array.isArray(initialLookup.practices)
            ? initialLookup.practices.map((p: any, idx: number) => ({
                id: typeof p.id === "number" ? p.id : idx,
                name: typeof p === "string" ? p : p.name || p.value || "",
                label: typeof p === "string" ? p : p.name || p.value || "",
                value: typeof p === "string" ? p : p.name || p.value || "",
                count: typeof p === "string" ? 0 : p.count ?? 0,
              }))
            : [],
        );
        setPractices(
          Array.isArray(initialLookup.practices)
            ? initialLookup.practices.map((p: any) =>
                typeof p === "string" ? p : p.value,
              )
            : [],
        );
      }
    }
  }, [initialCounties, initialRegions, initialLookup]);

  // ✅ Return loading or error states if needed (optional)
  if (loading) {
    return null;
    // <div className="text-sm text-gray-500">
    //   Loading practices from cleaned escorts...
    // </div>
  }

  if (error) {
    return null;
    // <div className="text-sm text-red-500">
    //   Error loading practices: {error}
    // </div>
  }

  return null;
};

export default LocationInitializer;
