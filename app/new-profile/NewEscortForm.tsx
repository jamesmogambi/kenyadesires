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
import React, { useEffect, useState } from "react";
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

// Define the RichTextEditorHandle type
type RichTextEditorHandle = {
  getContent: () => string;
};

interface Prop {
  className?: string;
  mode?: "create" | "edit";
  initialData?: {
    id?: string;
    name: string;
    email: string;
    street: string;
    phone: string;
    whatsappNumber: string;
    region: string;
    town: string;
    nationality: string;
    age: string;
    height: string;
    breasts: string;
    weight: string;
    ageCategory: string;
    character: string;
    hairColor: string;
    experience: string;
    about: string;
    previewPhoto: string;
    images: string[];
    telephone: string;
    whatsappPhone: string;
    availability: string[];
    languages: string[];
    practices: string[];
    bdsm: string[];
    massage: string[];
    extraServices: string[];
    categories: string[];
    openingHours: {
      monday: string;
      tuesday: string;
      wednesday: string;
      thursday: string;
      friday: string;
      saturday: string;
      sunday: string;
    };
    bustSize?: string;
    clerkUserId?: string;
  };
}

const timeRangeRegex =
  /^([01]\d|2[0-3])[-:]([0-5]\d)\s*-\s*([01]\d|2[0-3])[-:]([0-5]\d)$/;

// const daySchema = z.string().regex(timeRangeRegex, "Invalid time range");
// .default('');
const defaultDay = "";

const daySchema = z
  .string()
  .default(defaultDay)
  .refine((val) => val === "" || timeRangeRegex.test(val), "Invalid time range");

export const formSchema: any = z.object({
  name: z
    .string({ error: "Name is required" })
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters"),
  email: z.email({ error: "Invalid email address" }),

  street: z
    .string({ error: "Street is required" })
    .min(3, "Street name must be at least 3 characters"),
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
const NewEscortForm = ({ className, mode = "create", initialData }: Prop) => {
  const router = useRouter();

  const [error, setError] = useState<any>(null);
  const [loading, setLoader] = useState<any>(false);

  const { user, isLoaded, isSignedIn } = useUser();

  const imageFiles = useFileStore((state) => state.files);

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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const { watch, setValue, formState } = form;

  useFormPersist("storageKey", {
    watch,
    setValue,
  });

  const { isSubmitting } = formState;

  const { clear } = useLocationStore();
  const { clearDescription, clearFiles, clearTags } = useFormStore();
  const { clearCategories, clearLanguages, clearAll } = useSettingStore();
  const { clearFiles: clearEscortGallery } = useFileStore();

  const hydrate = useVariantStore((s) => s.hydrate);
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res: any = null;
        hydrate(res);
      } catch (err) {
        console.error("Failed to hydrate variant settings:", err);
      }
    }

    fetchSettings();
  }, [hydrate]);

  useEffect(() => {
    if (!isLoaded || !user) return;
    setValue("email", user.primaryEmailAddress?.emailAddress || "");
  }, [setValue, user, isLoaded]);

  // Prepopulate form and stores when editing
  useEffect(() => {
    if (mode !== "edit" || !initialData) return;

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
      massage,
      extraServices,
      categories,
      openingHours,
      images,
    } = initialData;

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
      breast: breasts || "",
      character: character || "",
      hairColor: hairColor || "",
      nationality: nationality || "",
      experience: experience || "",
      tags: extraServices || [],
    });

    useSettingStore.setState({
      selected: practices || [],
      massages: massage || [],
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
    files: selectedFiles = [],
  } = useFormStore();

  const {
    selected,
    massages,
    bdsm,
    categories: settingCategories,
    languages,
    availability,
  } = useSettingStore();

  const { files: gallery } = useFileStore();
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setLoader(true);
    setError(null);

    (async () => {
      try {
        // Destructure fields you want from values (add more as needed)
        const {
          // address,
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

        // Validate region and town
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
        // Validate categories
        if (settingCategories.length === 0) {
          setError("Please select categories you want to appear");
          setLoader(false);
          return;
        }

        // Get all files from your file store
        // const allFiles = Array.from(useFileStore.getState().fileMap.values());

        // // Filter image files
        // const imageFiles = allFiles.filter((file) =>
        //   file.type.startsWith("image/"),
        // );

        // Prepare combined list: image files + preview photo (if exists)
        const filesToUpload: File[] = [...imageFiles];

        if (selectedFiles && selectedFiles.length > 0) {
          const previewFile = selectedFiles[0];
          if (
            !filesToUpload.some(
              (f) => f.name === previewFile.name && f.size === previewFile.size,
            )
          ) {
            filesToUpload.push(previewFile);
          }
        }

        if (filesToUpload.length === 0) {
          console.log("No images to upload");
        }

        const uploadedImageUrls: string[] = [];

        for (const file of filesToUpload) {
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
          uploadedImageUrls.push(uploadData.secure_url);
          console.log(`Uploaded ${file.name} -> ${uploadData.secure_url}`);
        }

        console.log("All uploaded image URLs:", uploadedImageUrls);

        const { existingImages } = useFileStore.getState();

        let newPreviewPhotoUrl = "";
        if (selectedFiles && selectedFiles.length > 0 && uploadedImageUrls.length > 0) {
          newPreviewPhotoUrl = uploadedImageUrls[uploadedImageUrls.length - 1];
        } else if (existingImages.length > 0) {
          newPreviewPhotoUrl = existingImages[existingImages.length - 1];
        }

        const allImages = [...existingImages, ...uploadedImageUrls];
        const galleryImageUrls = allImages.filter(
          (url) => url !== newPreviewPhotoUrl,
        );
        const escortData: any = {
          name,
          clerkUserId: user?.id || "",
          previewPhoto: newPreviewPhotoUrl,
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
        };

        if (mode === "edit" && initialData?.id) {
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
          <span className="text-primary font-bold text-xl">girl</span>{" "}
          profile
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
              <div className=" basis-full lg:basis-1/2">
                <RichTextEditor />

                <WorkHoursForm form={form} className={" mt-5"} />

                <SettingsForm form={form} className="mt-14 w-full" />

                <AboutMeForm form={form} className="my-8" />

                <PreviewPhoto className="my-10 lg:w-3/4 w-full" form={form} />
              </div>

              {/* 2 */}

              <div className="lg:basis-1/2 basis-full relative  border-green-600">
                <SelectPackagesForm form={form} />
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
                className="flex lg:w-1/4 w-3/4 rounded-none  items-center  gap-2 p-12 text-white bg-primary"
                type="submit"
              >
                <ArrowDown
                  className={cn("size-8", isSubmitting ? "hidden" : "block")}
                  strokeWidth={4}
                />
                <span className="uppercase font-semibold text-xl tlg:ext-2xl">
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
