"use client";

import React, {useEffect, useState} from "react";
import {useForm} from "react-hook-form";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import useFormPersist from "react-hook-form-persist";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Form} from "@/components/ui/form";
import {cn} from "@/lib/utils";
import {ArrowDown} from "lucide-react";
import {toast} from "sonner";
import SectionCard from "@/components/SectionCard";
import SuccessToast from "@/components/Toasts/SuccessToast";
import {useUser} from "@clerk/nextjs";
import {useFormStore} from "@/store/formStore";
import {useSettingStore} from "@/store/settingStore";
import {useFileStore} from "@/store/fileStore";
import IntroSection from "../new-profile/IntroSection";
import RichTextEditor from "../new-profile/RichTextEditor";
import WorkHoursForm from "../new-profile/WorkHoursForm";
import SettingsForm from "../new-profile/SettingsForm";
import AboutMeForm from "../new-profile/AboutMeForm";
import PreviewPhoto from "../new-profile/PreviewPhoto";
import SelectPackagesForm from "../new-profile/SelectPackagesForm";
import PhotoVideoUploads from "../new-profile/PhotoVideoUploads";

/* -------------------------------- schema -------------------------------- */

const timeRangeRegex =
    /^([01]\d|2[0-3])[-:]([0-5]\d)\s*-\s*([01]\d|2[0-3])[-:]([0-5]\d)$/;

const daySchema = z.string().regex(timeRangeRegex).default("");

export const formSchema = z.object({
    name: z.string().min(2),
    email: z.email(),
    street: z.string().min(3),
    phone: z.string(),
    whatsappNumber: z.string(),
    monday: daySchema,
    tuesday: daySchema,
    wednesday: daySchema,
    thursday: daySchema,
    friday: daySchema,
    saturday: daySchema,
    sunday: daySchema,
    myAge: z.string(),
    myHeight: z.string(),
    myBreasts: z.string(),
    myWeight: z.string(),
});

/* -------------------------------- props -------------------------------- */

interface Props {
    className?: string;
    initialData?: any; // escort profile from DB
}

/* ------------------------------- component ------------------------------- */

const DEFAULT_VALUES = {
    name: "",
    email: "",
    street: "",
    phone: "",
    whatsappNumber: "",
    monday: "",
    tuesday: "",
    wednesday: "",
    thursday: "",
    friday: "",
    saturday: "",
    sunday: "",
    myAge: "",
    myHeight: "",
    myBreasts: "",
    myWeight: "",
};

const EditEscortForm = ({className, initialData}: Props) => {
    const router = useRouter();
    const {user} = useUser();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hydrated, setHydrated] = useState(false);
    const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

    /* ----------------------------- react-hook-form ---------------------------- */

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: DEFAULT_VALUES,
    });

    const {watch, setValue, formState} = form;

    /* ----------------------- PREVENT persist overwrite ----------------------- */

    useFormPersist("escort-form", {
        watch,
        setValue,
    });

    const {isSubmitting} = formState;

    /* ----------------------------- hydrate RHF ----------------------------- */

    useEffect(() => {
        if (!initialData) return;

        form.reset({
            name: initialData.name ?? "",
            email: initialData.email ?? "",
            street: initialData.street ?? "",
            phone: initialData.telephone ?? "",
            whatsappNumber: initialData.whatsappPhone ?? "",
            monday: initialData.openingHours?.monday ?? "",
            tuesday: initialData.openingHours?.tuesday ?? "",
            wednesday: initialData.openingHours?.wednesday ?? "",
            thursday: initialData.openingHours?.thursday ?? "",
            friday: initialData.openingHours?.friday ?? "",
            saturday: initialData.openingHours?.saturday ?? "",
            sunday: initialData.openingHours?.sunday ?? "",
            myAge: initialData.age ?? "",
            myHeight: initialData.height ?? "",
            myBreasts: initialData.breasts ?? "",
            myWeight: initialData.weight ?? "",
        });

        setHydrated(true);
    }, [initialData, form]);

    /* ---------------------------- hydrate zustand ---------------------------- */

    useEffect(() => {
        if (!initialData) return;

        useFormStore.setState({
            description: initialData.about ?? "",
            region: initialData.region ?? "",
            town: initialData.town ?? "",
            tags: initialData.extraServices ?? [],
            breast: initialData.breastSize ?? "",
            age: initialData.age ?? "",
            character: initialData.character ?? "",
            hairColor: initialData.hairColor ?? "",
            experience: initialData.experience ?? "",
            nationality: initialData.nationality ?? "",
        });

        useSettingStore.setState({
            categories: initialData.categories ?? [],
            languages: initialData.languages ?? [],
            availability: initialData.availability ?? [],
            selected: initialData.practices ?? [],
            bdsm: initialData.bdsm ?? [],
            massages: initialData.massages ?? [],
        });

        setPreviewPhoto(initialData.previewPhoto || null);

        useFileStore.setState({
            existingImages: initialData.images ?? [],
        });

        // useFileStore.setState({
        //   existingImages: initialData.images ?? [],
        //   previewImage: initialData.previewPhoto ?? null,
        // });
    }, [initialData]);

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

    /* -------------------------------- submit -------------------------------- */
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setLoading(true);
        setError(null);

        try {
            /* ---------------------- destructure form values ---------------------- */
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

            /* ---------------------- validations ---------------------- */
            if (!region) {
                setError("Please select your region");
                return;
            }

            if (settingCategories.length === 0) {
                setError("Please select at least one category");
                return;
            }

            /* ---------------------- file store ---------------------- */
            const {files, existingImages} = useFileStore.getState();

            // Only upload NEW image files
            const imageFiles = files.filter((file) => file.type.startsWith("image/"));

            const uploadedImageUrls: string[] = [];

            /* ---------------------- upload new images ---------------------- */
            for (const file of imageFiles) {
                const {signature, timestamp, cloudName, apiKey, folder} = await fetch(
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
                    throw new Error(`Image upload failed: ${errText}`);
                }

                const uploadData = await uploadRes.json();
                uploadedImageUrls.push(uploadData.secure_url);
            }

            /* ---------------------- preview photo logic ---------------------- */
            let previewPhotoUrl = initialData?.previewPhoto || null;

            // If user selected a new preview photo (stored as first file)
            if (files.length > 0) {
                previewPhotoUrl = uploadedImageUrls.at(-1) || previewPhotoUrl;
            }

            /* ---------------------- merge gallery images ---------------------- */
            const finalGalleryImages = [
                ...existingImages,
                ...uploadedImageUrls,
            ].filter((url) => url !== previewPhotoUrl);

            /* ---------------------- payload ---------------------- */
            const escortData = {
                name,
                email,
                street,
                telephone: phone,
                whatsappPhone: whatsappNumber,
                previewPhoto: previewPhotoUrl,
                images: finalGalleryImages,
                about: description,
                region,
                town,
                categories: settingCategories,
                languages,
                availability,
                practices: selected,
                bdsm,
                massages,
                extraServices: tags,

                openingHours: {
                    monday,
                    tuesday,
                    wednesday,
                    thursday,
                    friday,
                    saturday,
                    sunday,
                },

                age: myAge,
                height: myHeight,
                breasts: myBreasts,
                weight: myWeight,

                nationality,
                character,
                hairColor,
                experience,

                role: "escort",
            };

            /* ---------------------- server action ---------------------- */
            // await updateEscortProfile(escortData);

            /* ---------------------- success cleanup ---------------------- */
            form.reset(DEFAULT_VALUES);
            localStorage.removeItem("escort-form");

            useFileStore.getState().clearFiles();

            toast.custom(() => (
                <SuccessToast message="Profile updated successfully"/>
            ));

            router.refresh();
            window.scrollTo({top: 0, behavior: "smooth"});
        } catch (err: any) {
            console.error(err);
            setError(err?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    /* -------------------------------- render -------------------------------- */

    if (!hydrated && initialData) {
        return <div className="p-10">Fetching Profile...</div>;
    }
    // TODO: FIX tHE CATEGORIES SECTION AND LANGUAGES OVERFLOWING
    return (
        <div className={cn(className)}>
            <SectionCard className="px-12">
                <h3 className="text-2xl mb-6 font-semibold">
                    {initialData ? "Edit" : "New"}{" "}
                    <span className="text-primary font-bold">Escort</span> Profile
                </h3>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <IntroSection form={form}/>

                        <section className="flex flex-col lg:flex-row gap-6 mt-10">
                            <div className="lg:w-1/2 ">
                                <RichTextEditor/>
                                <WorkHoursForm form={form} className="mt-6"/>
                                <SettingsForm form={form} className="mt-10 w-full"/>
                                <AboutMeForm form={form} className="mt-6"/>

                                <PreviewPhoto
                                    form={form}
                                    storedImageUrl={initialData.previewPhoto}
                                    className="mt-10"
                                />
                            </div>

                            <div className="lg:w-1/2 w-full">
                                <SelectPackagesForm form={form}/>
                            </div>
                        </section>

                        {/* TODO: Render files correctly */}
                        <PhotoVideoUploads/>

                        {error && (
                            <p className="bg-red-500 text-white p-3 text-center">{error}</p>
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

export default EditEscortForm;
