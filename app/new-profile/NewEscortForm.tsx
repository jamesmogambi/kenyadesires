"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import useFormPersist from "react-hook-form-persist";
import { Form } from "@/components/ui/form";
import { useRouter } from "next/navigation";
import SectionCard from "@/components/SectionCard";
import { cn } from "@/lib/utils";
import React, { useEffect, useState, useRef } from "react";
import WorkHoursForm from "./WorkHoursForm";
import SettingsForm from "./SettingsForm";
import AboutMeForm from "./AboutMeForm";
import PreviewPhoto from "./PreviewPhoto";
import SelectPackagesForm from "./SelectPackagesForm";
import { ArrowDown } from "lucide-react";
import PhotoVideoUploads from "./PhotoVideoUploads";
import IntroSection from "./IntroSection";
import RichTextEditor from "./RichTextEditor";
import { useFormStore } from "@/store/formStore";
import { useSettingStore } from "@/store/settingStore";
import { useFileStore } from "@/store/fileStore";
import { useUser } from "@clerk/nextjs";
import { useVariantStore } from "@/store/variantStore";
import { useLocationStore } from "@/store/locationStore";
import { toast } from "sonner";
import SuccessToast from "@/components/Toasts/SuccessToast";
import { saveNewEscortProfile } from "@/server-actions/girl.action";
import { updateEscort } from "@/server-actions/escort.action";
import type { NewEscortProfileInput } from "@/server-actions/girl.action";
import { useAttribution } from "@/lib/attribution";
import { trackProvider } from "@/lib/analytics";

// Define the RichTextEditorHandle type
type RichTextEditorHandle = {
  getContent: () => string;
};

interface Prop {
  className?: string;
  mode?: "create" | "edit";
  initialData?: NewEscortProfileInput;
  agencyId?: string;
  fresh?: boolean;
  isEscort?: boolean;
}

const timeRangeRegex =
  /^([01]\d|2[0-3])[-:]([0-5]\d)\s*-\s*([01]\d|2[0-3])[-:]([0-5]\d)$/;

// const daySchema = z.string().regex(timeRangeRegex, "Invalid time range");
// .default('');
const defaultDay = "";

const daySchema = z
  .string()
  .default(defaultDay)
  .refine(
    (val) => val === "" || timeRangeRegex.test(val),
    "Invalid time range",
  );

export const formSchema: any = z.object({
  name: z
    .string({ error: "Name is required" })
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters"),
  email: z.email({ error: "Invalid email address" }),
  street: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 3, {
      message: "Street name must be at least 3 characters",
    }),

  whatsappNumber: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === "" || /^\+?[0-9]{7,15}$/.test(val),
      "Invalid WhatsApp number",
    ),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === "" || /^\+?[0-9]{7,15}$/.test(val),
      "Invalid phone number",
    ),
  // address: z
  //   .string({ error: "Address is required" })
  //   .min(5, "Address must be at least 5 characters"),
  // description: z.string({}).min(10, "Description must be at least 10 characters"),
  monday: daySchema,
  tuesday: daySchema,
  wednesday: daySchema,
  thursday: daySchema,
  friday: daySchema,
  saturday: daySchema,
  sunday: daySchema,
  variantAge: z.string().optional(),
  variantGender: z.string().default("female"),

  myAge: z.string().min(1, "Age is required"),
  myHeight: z.string(),
  myBreasts: z.string(),
  myWeight: z.string(),
  // photo: z.any,
  variantAvailability: z
    .array(z.string().min(1, "Tag cannot be empty"))
    .default([]),
});
const DEFAULT_VALUES = {
  name: "",
  email: "",
  street: "",
  phone: "",
  whatsappNumber: "",
  myAge: "",
  myBreasts: "",
  myWeight: "",
  myHeight: "",
  variantAge: "",
  variantGender: "female",
  monday: "",
  tuesday: "",
  wednesday: "",
  thursday: "",
  friday: "",
  saturday: "",
  sunday: "",
  variantAvailability: [],
};

function convertToFormDefaults(data: NewEscortProfileInput) {
  return {
    name: data.name || "",
    email: data.email || "",
    street: data.street || "",
    phone: data.phone || "",
    whatsappNumber: data.whatsappNumber || "",
    myAge: data.age || "",
    myHeight: data.height || "",
    myBreasts: data.breasts || "",
    myWeight: data.weight || "",
    variantAge: data.ageCategory || "",
    variantGender: "female",
    monday: data.openingHours?.monday || "",
    tuesday: data.openingHours?.tuesday || "",
    wednesday: data.openingHours?.wednesday || "",
    thursday: data.openingHours?.thursday || "",
    friday: data.openingHours?.friday || "",
    saturday: data.openingHours?.saturday || "",
    sunday: data.openingHours?.sunday || "",
    variantAvailability: data.availability || [],
  };
}

const NewEscortForm = ({
  className,
  mode = "create",
  initialData,
  agencyId,
  fresh,
  isEscort,
}: Prop) => {
  const router = useRouter();

  const [error, setError] = useState<any>(null);
  const [loading, setLoader] = useState<any>(false);
  const [hydrated, setHydrated] = useState(false);

  const { user, isLoaded, isSignedIn } = useUser();

  const attribution = useAttribution();

  const imageFiles = useFileStore((state) => state.files);
  const { videoFiles, clearVideoFiles } = useFileStore();

  const previewPhotoRef = useRef<{
    getPreviewFile: () => File | null;
    getPreviewUrl: () => string;
    clear: () => void;
    setStoredUrl: (url: string) => void;
  } | null>(null);

  const freshKeyRef = useRef(`storageKey_${Math.random()}`);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues:
      mode === "edit" && initialData
        ? convertToFormDefaults(initialData)
        : DEFAULT_VALUES,
  });

  const { watch, setValue, formState } = form;

  const storageKey = fresh ? freshKeyRef.current : "storageKey";

  useFormPersist(storageKey, {
    watch,
    setValue,
  });

  const { isSubmitting } = formState;

  const { clear } = useLocationStore();
  const { clearDescription, clearFiles, clearTags } = useFormStore();
  const { clearCategories, clearLanguages, clearAll } = useSettingStore();
  const { clearFiles: clearEscortGallery } = useFileStore();

  const hasClearedRef = useRef(false);
  const clearStoresRef = useRef<(() => void) | null>(null);

  clearStoresRef.current = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("form-store");
      localStorage.removeItem("Setting-selection");
      localStorage.removeItem("location-store");
      localStorage.removeItem("storageKey");
      sessionStorage.removeItem("form-store");
      sessionStorage.removeItem("Setting-selection");
      sessionStorage.removeItem("location-store");
      sessionStorage.removeItem("storageKey");
    }
    clear();
    useFormStore.getState().reset();
    clearCategories();
    clearLanguages();
    clearAll();
    clearEscortGallery();
  };

  useEffect(() => {
    if (!fresh || hasClearedRef.current) return;
    hasClearedRef.current = true;

    clearStoresRef.current?.();
    form.reset(DEFAULT_VALUES);
  }, [fresh, form]);

  // Clear stores and reset form when creating a new profile without existing data
  useEffect(() => {
    if (mode !== "create" || initialData || !isLoaded) return;
    clearStoresRef.current?.();
    form.reset(DEFAULT_VALUES);
  }, [mode, initialData, isLoaded, form]);

  // Prepopulate email from Clerk user on create
  useEffect(() => {
    if (mode !== "create" || !isLoaded || !user) return;
    setValue("email", user.primaryEmailAddress?.emailAddress || "");
  }, [mode, isLoaded, user, setValue]);

  // Prepopulate form and stores when editing
  useEffect(() => {
    if (mode !== "edit" || !initialData) {
      setHydrated(true);
      return;
    }

    const {
      name,
      email,
      street,
      phone,
      whatsappNumber,
      region,
      county,
      towns,
      nationality,
      age,
      height,
      breasts,
      bustSize,
      weight,
      ageCategory,
      character,
      hairColor,
      experience,
      about,
      availability,
      languages,
      practices,
      bdsm,
      massages,
      extraServices,
      categories,
      openingHours,
      images,
    } = initialData;

    setHydrated(false);

    if (typeof window !== "undefined") {
      sessionStorage.removeItem("storageKey");
      localStorage.removeItem("form-store");
      localStorage.removeItem("Setting-selection");
    }
    setValue("name", name || "");
    setValue("email", email || "");
    setValue("street", street || "");
    setValue("phone", phone || "");
    setValue("whatsappNumber", whatsappNumber || "");
    setValue("myAge", age || "");
    setValue("myBreasts", breasts || "");
    setValue("myWeight", weight || "");
    setValue("myHeight", height || "");
    setValue("variantAge", ageCategory || "");

    if (openingHours) {
      setValue("monday", openingHours.monday || "");
      setValue("tuesday", openingHours.tuesday || "");
      setValue("wednesday", openingHours.wednesday || "");
      setValue("thursday", openingHours.thursday || "");
      setValue("friday", openingHours.friday || "");
      setValue("saturday", openingHours.saturday || "");
      setValue("sunday", openingHours.sunday || "");
    }

    useFormStore.setState({
      description: about || "",
      county: county || "",
      region: region || "",
      towns: towns || [],
      age: ageCategory || "",
      breast: bustSize || "",
      character: character || "",
      hairColor: hairColor || "",
      nationality: nationality || "",
      experience: experience || "",
      tags: extraServices || [],
    });

    useSettingStore.setState({
      selected: practices || [],
      massages: massages || [],
      bdsm: bdsm || [],
      categories: categories || [],
      languages: languages || [],
      availability: availability || [],
    });

    useFileStore.setState({
      existingImages: images || [],
      files: [],
      existingVideos: initialData?.videos || [],
      videoFiles: [],
    });

    if (region || towns?.length) {
      useFormStore.getState().setRegion(region || "");
      (towns ?? []).forEach((t) => useFormStore.getState().setTown(t));
    }

    setHydrated(true);
  }, [mode, initialData, setValue]);

  const {
    description,
    region,
    county,
    towns,
    age,
    breast,
    character,
    hairColor,
    nationality,
    experience,
    tags,
  } = useFormStore();

  const {
    selected,
    massages,
    bdsm,
    categories: settingCategories,
    languages,
    availability,
  } = useSettingStore();

  const { files: gallery, existingImages } = useFileStore();

  const uploadSingleFile = async (file: File | null): Promise<string> => {
    if (!file) return "";
    const { signature, timestamp, cloudName, apiKey, folder } = await fetch(
      "/api/cloudinary-signature",
    ).then((res) => res.json());

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
    formData.append("folder", folder);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(
        `Failed to upload preview image ${file.name}: ${uploadRes.status} - ${errText}`,
      );
    }

    const uploadData = await uploadRes.json();
    return uploadData.secure_url;
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setLoader(true);
    setError(null);

    (async () => {
      try {
        const {
          name,
          email,
          whatsappNumber,
          street,
          phone,
          monday,
          tuesday,
          wednesday,
          thursday,
          friday,
          saturday,
          sunday,
          myAge,
          myHeight,
          myBreasts,
          myWeight,
        } = values;

        if (!region) {
          setError("Please select your region");
          setLoader(false);
          return;
        }
        if (settingCategories.length === 0) {
          setError("Please select categories you want to appear");
          setLoader(false);
          return;
        }
        if (
          imageFiles.length === 0 &&
          existingImages.length === 0 &&
          !(
            previewPhotoRef.current?.getPreviewFile() ||
            previewPhotoRef.current?.getPreviewUrl()
          )
        ) {
          setError("Please upload at least one image for your profile");
          setLoader(false);
          return;
        }

        const previewFile = previewPhotoRef.current?.getPreviewFile() ?? null;
        const storedPreviewUrl = previewPhotoRef.current?.getPreviewUrl() || "";

        const uploadedPreviewUrl = await uploadSingleFile(previewFile);
        const finalPreviewPhotoUrl = uploadedPreviewUrl || storedPreviewUrl;

        const galleryFiles = [...imageFiles];
        const uploadedGalleryUrls: string[] = [];

        for (const file of galleryFiles) {
          const { signature, timestamp, cloudName, apiKey, folder } =
            await fetch("/api/cloudinary-signature").then((res) => res.json());

          const formData = new FormData();
          formData.append("file", file);
          formData.append("api_key", apiKey);
          formData.append("timestamp", timestamp.toString());
          formData.append("signature", signature);
          formData.append("folder", folder);

          const uploadRes = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
            {
              method: "POST",
              body: formData,
            },
          );

          if (!uploadRes.ok) {
            const errText = await uploadRes.text();
            throw new Error(
              `Failed to upload image ${file.name}: ${uploadRes.status} - ${errText}`,
            );
          }

          const uploadData = await uploadRes.json();
          uploadedGalleryUrls.push(uploadData.secure_url);
        }

        const galleryImageUrls = [...existingImages, ...uploadedGalleryUrls];

        form.setValue("previewPhoto", finalPreviewPhotoUrl);
        useFileStore.setState({ existingImages: galleryImageUrls });
        previewPhotoRef.current?.setStoredUrl(finalPreviewPhotoUrl);

        const escortData: any = {
          name,
          clerkUserId: user?.id || "",
          previewPhoto: finalPreviewPhotoUrl,
          telephone: phone,
          whatsappPhone: whatsappNumber,
          images: galleryImageUrls,
          about: description,
          availability,
          nationality,
          bustSize: breast,
          languages,
          towns,
          county,
          region,
          regions: Array.from(new Set([region, ...(towns || [])])).filter(
            (r): r is string => Boolean(r),
          ),
          practices: selected,
          bdsm,
          massages,
          extraServices: tags,
          role: "escort",
          gender: "female",
          openingHours: {
            monday,
            tuesday,
            wednesday,
            thursday,
            friday,
            saturday,
            sunday,
          },
          ageCategory: age,
          character,
          hairColor,
          experience,
          age: myAge,
          breasts: myBreasts,
          weight: myWeight,
          height: myHeight,
          categories: settingCategories,
          email,
          street,
          agencyId: agencyId || initialData?.agencyId || "",
          isAgencyOwned: !!agencyId || initialData?.isAgencyOwned || false,
          utm_source: attribution?.utm_source,
          utm_medium: attribution?.utm_medium,
          utm_campaign: attribution?.utm_campaign,
          utm_content: attribution?.utm_content,
          utm_term: attribution?.utm_term,
          utm_id: attribution?.utm_id,
          utm_source_platform: attribution?.utm_source_platform,
          landing_page: attribution?.landing_page,
          first_touch_at: attribution?.first_touch_at,
          registration_date: new Date().toISOString(),
        };

        let escortId: string | undefined;

        if (mode === "edit" && initialData?.id) {
          escortId = initialData.id;
          await updateEscort(initialData.id, escortData);
          const providerId = user?.id || initialData.id;
          trackProvider("profile_published", { provider_id: providerId });
          toast.custom(() => (
            <SuccessToast message="Your profile was updated successfully." />
          ));
        } else {
          const res = await saveNewEscortProfile(escortData);
          if (!res.success) {
            setError(res.error || "Failed to create profile");
            setLoader(false);
            return;
          }
          escortId = res.id;
          const providerId = user?.id || res.id;
          trackProvider("complete_profile", { provider_id: providerId });
          trackProvider("profile_published", { provider_id: providerId });
          toast.custom(() => (
            <SuccessToast message="Your profile was created successfully." />
          ));

          window.dispatchEvent(new CustomEvent("credits-updated"));
        }

        // Upload videos to Mux for this escort
        const { existingVideos: currentExistingVideos } =
          useFileStore.getState();
        const newPlaybackIds: string[] = [];

        if (videoFiles && videoFiles.length > 0 && escortId) {
          toast.loading("Uploading videos...", { id: "video-upload-batch" });

          for (let i = 0; i < videoFiles.length; i++) {
            const videoFile = videoFiles[i];
            const videoForm = new FormData();
            videoForm.append("escortId", escortId);
            videoForm.append("video", videoFile);

            try {
              const uploadRes = await fetch("/api/mux/escort-video", {
                method: "POST",
                body: videoForm,
              });

              const result = await uploadRes.json();

              if (result.success && result.playbackId) {
                newPlaybackIds.push(result.playbackId);
                toast.success(
                  `Video ${i + 1}/${videoFiles.length} uploaded successfully`,
                  { id: `video-upload-${i}` },
                );
              } else {
                toast.error(
                  `Video ${i + 1}/${videoFiles.length} upload issue: ${result.message || result.error}`,
                  { id: `video-upload-${i}` },
                );
              }
            } catch (err: any) {
              toast.error(
                `Video ${i + 1}/${videoFiles.length} failed to upload: ${err?.message || "Unknown error"}`,
                { id: `video-upload-${i}` },
              );
            }
          }

          toast.success("Video upload complete!", { id: "video-upload-batch" });
        }

        // Sync videos in Firestore: kept existing + newly uploaded playback IDs
        const finalVideos = Array.from(
          new Set([...currentExistingVideos, ...newPlaybackIds]),
        );
        if (escortId && finalVideos.length > 0) {
          try {
            await fetch(`/api/escorts/${escortId}/videos`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ videos: finalVideos }),
            });
          } catch (err: any) {
            console.error("Failed to sync videos:", err);
          }
        }

        clearVideoFiles();

        form.reset(DEFAULT_VALUES);
        localStorage.removeItem("form-store");
        localStorage.removeItem("Setting-selection");
        localStorage.removeItem("location-store");
        localStorage.removeItem("storageKey");
        sessionStorage.removeItem("form-store");
        sessionStorage.removeItem("Setting-selection");
        sessionStorage.removeItem("location-store");
        sessionStorage.removeItem("storageKey");
        clear();
        clearDescription();
        clearTags();
        clearCategories();
        clearLanguages();
        clearAll();
        clearFiles();
        clearEscortGallery();
        clearVideoFiles();
        hasClearedRef.current = false;

        router.push("/administration");
      } catch (error: any) {
        console.error("Error saving profile:", error);
        setError(error?.message || "Something went wrong");
      } finally {
        setLoader(false);
      }
    })();
  };

  return (
    <div className={cn("", className)}>
      <SectionCard className="px-12">
        <h3 className="text-2xl mb-5 font-semibold">
          {mode === "edit" ? "Edit" : "New"}{" "}
          <span className="text-primary font-bold text-xl">girl</span> profile
        </h3>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, (errors) => {
              const details = Object.entries(errors).map(
                ([field, fieldError]) => {
                  const message = fieldError?.message;
                  const label = field
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (str) => str.toUpperCase());
                  return message || `${label} is invalid`;
                },
              );

              setError(
                details.length > 0
                  ? details.join(". ")
                  : "Please fix the highlighted fields.",
              );
            })}
            className="space-y-3"
          >
            {/* about section */}
            <IntroSection form={form} isEscort={isEscort} />
            {/* description and setting section */}
            <section className="flex flex-col lg:flex-row mt-12 gap-6">
              {/* 1 */}
              <div className="w-full lg:w-1/2 shrink-0">
                <RichTextEditor />

                <div>
                  <WorkHoursForm form={form} className={"  mt-5"} />
                </div>

                {hydrated ? (
                  <SettingsForm form={form} className="mt-14 w-full" />
                ) : (
                  <div className="mt-14 w-full animate-pulse bg-gray-1/30 h-48 rounded" />
                )}

                {hydrated ? (
                  <AboutMeForm form={form} className="my-8" />
                ) : (
                  <div className="my-8 animate-pulse bg-gray-1/30 h-32 rounded" />
                )}

                {hydrated ? (
                  <PreviewPhoto
                    ref={previewPhotoRef}
                    className="my-10 lg:w-3/4 w-full"
                    form={form}
                    storedImageUrl={initialData?.previewPhoto}
                  />
                ) : (
                  <div className="my-10 lg:w-3/4 w-full animate-pulse bg-gray-1/30 h-48 rounded" />
                )}
              </div>

              {/* 2 */}

              <div className="w-full lg:w-1/2 shrink-0">
                {hydrated ? (
                  <SelectPackagesForm form={form} />
                ) : (
                  <div className="animate-pulse bg-gray-1/30 h-96 rounded" />
                )}
              </div>
            </section>
            <PhotoVideoUploads />

            {error && (
              <p className="p-3 bg-primary text-lg text-white py-2 text-center my-4">
                {error}
              </p>
            )}
            {/* // submit button */}
            <div className="flex justify-center ">
              <Button
                disabled={loading}
                className="flex lg:w-1/4 w-3/4 rounded-none  font-bold items-center  gap-2 p-12 text-white bg-primary"
                type="submit"
              >
                <ArrowDown
                  className={cn("size-8", isSubmitting ? "hidden" : "block")}
                  strokeWidth={4}
                />
                <span className="uppercase font-semibold text-xl lg:text-2xl">
                  {loading ? "Submitting..." : "Save Changes"}
                </span>
              </Button>
            </div>
          </form>
        </Form>
      </SectionCard>
    </div>
  );
};

export default NewEscortForm;
