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
  variantAge: z.string(),

  myAge: z.string(),
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
  monday: "",
  tuesday: "",
  wednesday: "",
  thursday: "",
  friday: "",
  saturday: "",
  sunday: "",
  variantAvailability: [],
};

const NewEscortForm = ({ className, mode = "create", initialData, agencyId, fresh }: Prop) => {
  const router = useRouter();

  const [error, setError] = useState<any>(null);
  const [loading, setLoader] = useState<any>(false);
  const [hydrated, setHydrated] = useState(false);

  const { user, isLoaded, isSignedIn } = useUser();

  const imageFiles = useFileStore((state) => state.files);

  const previewPhotoRef = useRef<{
    getPreviewFile: () => File | null;
    getPreviewUrl: () => string;
    clear: () => void;
  } | null>(null);

  const freshKeyRef = useRef(`storageKey_${Math.random()}`);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_VALUES,
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
    }
    clear();
    clearDescription();
    clearTags();
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

  useEffect(() => {
    if (!isLoaded || !user) return;
    if (fresh) return;
    setValue("email", user.primaryEmailAddress?.emailAddress || "");
  }, [setValue, user, isLoaded, fresh]);

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
      town,
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
      region: region || "",
      town: town || "",
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
    });

    if (region || town) {
      useFormStore.getState().setRegion(region || "");
      if (town) {
        useFormStore.getState().setTown(town);
      }
    }

    setHydrated(true);
  }, [mode, initialData, setValue]);

  const {
    description,
    region,
    town,
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
        if (!town) {
          setError("Please select your area or town");
          setLoader(false);
          return;
        }
        if (settingCategories.length === 0) {
          setError("Please select categories you want to appear");
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
          town,
          region,
          practices: selected,
          bdsm,
          massages,
          extraServices: tags,
          role: "escort",
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
          agencyId: agencyId || initialData?.agencyId,
          isAgencyOwned: !!agencyId || initialData?.isAgencyOwned,
        };

        if (mode === "edit" && initialData?.id) {
          // console.log("updateEscort called", { ...escortData });
          await updateEscort(initialData.id, escortData);
          toast.custom(() => (
            <SuccessToast message="Your profile was updated successfully." />
          ));
        } else {
          const res = await saveNewEscortProfile(escortData);
          console.log("new escort girl created", res);
          toast.custom(() => (
            <SuccessToast message="Your profile was created successfully." />
          ));
          router.push("/administration");
        }

        form.reset(DEFAULT_VALUES);
        localStorage.removeItem("storageKey");
        localStorage.removeItem("storageKey");
        clear();
        (clearAll(),
          clearDescription(),
          clearLanguages(),
          clearFiles(),
          clearTags(),
          clearCategories());
        clearEscortGallery();
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
              console.error("Validation errors:", errors);
            })}
            // onSubmit={form.handleSubmit(onSubmit, (errors) => {
            //   console.error("Validation errors:", errors);
            // })}
            className="space-y-3"
          >
            {/* about section */}
            <IntroSection form={form} />
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
