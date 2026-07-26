"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown } from "lucide-react";

import SectionCard from "@/components/SectionCard";
import SuccessToast from "@/components/Toasts/SuccessToast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn, slugify } from "@/lib/utils";
import countiesAndRegions from "@/data/development/countiesAndRegions.json";
import { createAgency } from "@/server-actions/agency.action";
import WorkHoursForm from "../new-profile/WorkHoursForm";
import AgencySelectField from "./AgencySelectField";
import AgencyTagsInput from "./AgencyTagsInput";
import AgencyImageField from "./AgencyImageField";

interface Prop {
  className?: string;
  ownerId: string;
  defaultEmail?: string;
}

const BUSINESS_TYPES = [
  { value: "agency", label: "Escort Agency" },
  { value: "spa", label: "Spa" },
  { value: "massage_parlor", label: "Massage Parlor" },
  { value: "brothel", label: "Brothel" },
];

const PLAN_TYPES = [
  { value: "basic", label: "Basic - 10 girls, 20 photos" },
  { value: "premium", label: "Premium - 25 girls, 50 photos" },
  { value: "enterprise", label: "Enterprise - 100 girls, 200 photos" },
];

const CATEGORY_SUGGESTIONS = ["VIP", "Premium", "Standard", "Luxury"];
const SERVICE_SUGGESTIONS = [
  "Escort Services",
  "Massage",
  "Outcall",
  "Incall",
  "Companionship",
];
const LANGUAGE_SUGGESTIONS = ["English", "Swahili", "French", "Kikuyu", "Luo"];
const PAYMENT_SUGGESTIONS = [
  "Cash",
  "M-Pesa",
  "Bank Transfer",
  "Card",
  "Crypto",
];

const currentYear = new Date().getFullYear();

const timeRangeRegex =
  /^([01]\d|2[0-3])[-:]([0-5]\d)\s*-\s*([01]\d|2[0-3])[-:]([0-5]\d)$/;

const daySchema = z
  .string()
  .refine(
    (val) => !val || timeRangeRegex.test(val),
    "Use the format 09:00-18:00",
  );

const optionalPhone = z
  .string()
  .refine(
    (val) => !val || /^\+?[0-9]{7,15}$/.test(val),
    "Enter a valid phone number",
  );

export const agencySchema = z.object({
  // Business details
  name: z
    .string()
    .min(2, "Agency name must be at least 2 characters")
    .max(80, "Agency name must be at most 80 characters"),
  businessType: z.enum(["agency", "spa", "massage_parlor", "brothel"]),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must be at most 2000 characters"),
  establishmentYear: z
    .string()
    .refine(
      (val) =>
        !val ||
        (/^\d{4}$/.test(val) &&
          Number(val) >= 1900 &&
          Number(val) <= currentYear),
      `Enter a year between 1900 and ${currentYear}`,
    ),

  // Contact
  contactEmail: z.email({ error: "Enter a valid email address" }),
  contactPhone: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, "Enter a valid phone number"),
  whatsappPhone: optionalPhone,
  website: z
    .string()
    .refine(
      (val) => !val || /^https?:\/\/[^\s.]+\.[^\s]{2,}$/.test(val),
      "Enter a valid url, e.g. https://example.com",
    ),

  // Location
  county: z.string().min(1, "Select a county"),
  region: z.string().min(1, "Select a region"),
  town: z.string().min(2, "Town or area is required"),
  estate: z.string(),
  address: z.string(),
  street: z.string(),
  postalCode: z.string(),

  // Opening hours
  monday: daySchema,
  tuesday: daySchema,
  wednesday: daySchema,
  thursday: daySchema,
  friday: daySchema,
  saturday: daySchema,
  sunday: daySchema,

  // Services
  categories: z.array(z.string()).min(1, "Add at least one category"),
  services: z.array(z.string()).min(1, "Add at least one service"),
  specialties: z.array(z.string()),
  languages: z.array(z.string()).min(1, "Add at least one language"),
  paymentMethods: z.array(z.string()).min(1, "Add at least one payment method"),

  // Social media
  instagram: z.string(),
  twitter: z.string(),
  facebook: z.string(),
  telegram: z.string(),

  // Plan
  planType: z.enum(["basic", "premium", "enterprise"]),
});

export type AgencyFormValues = z.infer<typeof agencySchema>;

const AgencyProfileForm = ({ className, ownerId, defaultEmail }: Prop) => {
  const router = useRouter();

  const [loading, setLoader] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const DEFAULT_VALUES: AgencyFormValues = {
    name: "",
    businessType: "agency",
    description: "",
    establishmentYear: "",
    contactEmail: defaultEmail || "",
    contactPhone: "",
    whatsappPhone: "",
    website: "",
    county: "",
    region: "",
    town: "",
    estate: "",
    address: "",
    street: "",
    postalCode: "",
    monday: "09:00-18:00",
    tuesday: "09:00-18:00",
    wednesday: "09:00-18:00",
    thursday: "09:00-18:00",
    friday: "09:00-18:00",
    saturday: "09:00-18:00",
    sunday: "09:00-18:00",
    categories: [],
    services: [],
    specialties: [],
    languages: ["English", "Swahili"],
    paymentMethods: ["Cash", "M-Pesa"],
    instagram: "",
    twitter: "",
    facebook: "",
    telegram: "",
    planType: "basic",
  };

  const form = useForm<AgencyFormValues>({
    resolver: zodResolver(agencySchema),
    defaultValues: DEFAULT_VALUES,
  });

  const selectedCounty = form.watch("county");

  const countyOptions = useMemo(
    () =>
      countiesAndRegions.map((county) => ({
        value: county.countyName,
        label: county.countyName,
      })),
    [],
  );

  const regionOptions = useMemo(() => {
    const county = countiesAndRegions.find(
      (item) => item.countyName === selectedCounty,
    );

    return (county?.regions || []).map((region) => ({
      value: region,
      label: region,
    }));
  }, [selectedCounty]);

  // Reset the region whenever a different county is picked
  useEffect(() => {
    const region = form.getValues("region");
    if (region && !regionOptions.some((option) => option.value === region)) {
      form.setValue("region", "");
    }
  }, [regionOptions, form]);

  const uploadImage = async (file: File | null): Promise<string> => {
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
        `Failed to upload image ${file.name}: ${uploadRes.status} - ${errText}`,
      );
    }

    const uploadData = await uploadRes.json();
    return uploadData.secure_url;
  };

  const onSubmit = async (values: AgencyFormValues) => {
    setError(null);
    setLoader(true);

    try {
      const [logo, coverImage] = await Promise.all([
        uploadImage(logoFile),
        uploadImage(coverFile),
      ]);

      const res = await createAgency({
        name: values.name,
        description: values.description,
        businessType: values.businessType,
        contactEmail: values.contactEmail,
        contactPhone: values.contactPhone,
        whatsappPhone: values.whatsappPhone,
        website: values.website,
        ownerId,
        county: values.county,
        countyCode: slugify(values.county),
        region: values.region,
        town: values.town,
        estate: values.estate,
        address: values.address,
        street: values.street,
        postalCode: values.postalCode,
        categories: values.categories,
        services: values.services,
        specialties: values.specialties,
        languages: values.languages,
        paymentMethods: values.paymentMethods,
        establishmentYear: values.establishmentYear
          ? Number(values.establishmentYear)
          : undefined,
        openingHours: {
          monday: values.monday,
          tuesday: values.tuesday,
          wednesday: values.wednesday,
          thursday: values.thursday,
          friday: values.friday,
          saturday: values.saturday,
          sunday: values.sunday,
        },
        socialMedia: {
          instagram: values.instagram,
          twitter: values.twitter,
          facebook: values.facebook,
          telegram: values.telegram,
        },
        logo,
        coverImage,
        planType: values.planType,
      });

      if (!res.success) {
        setError(res.error || "Failed to create the agency profile");
        return;
      }

      toast.custom(() => (
        <SuccessToast message="Your agency profile was created successfully." />
      ));

      form.reset(DEFAULT_VALUES);
      setLogoFile(null);
      setCoverFile(null);
      router.push("/administration");
    } catch (err: any) {
      console.error("Error creating agency:", err);
      setError(err?.message || "Something went wrong");
    } finally {
      setLoader(false);
    }
  };

  const inputClass =
    "bg-white text-black px-6 h-10 rounded-full text-lg focus-visible:ring-0";
  const labelClass = "font-medium text-white/40 text-base";

  return (
    <div className={cn("", className)}>
      <SectionCard className="lg:px-12">
        <h3 className="text-2xl mb-5 font-semibold">
          New <span className="text-primary font-bold text-xl">agency</span>{" "}
          profile
        </h3>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, (errors) => {
              console.error("Validation errors:", errors);
            })}
            className="space-y-10"
          >
            {/* BUSINESS DETAILS */}
            <section>
              <h4 className="my-4 font-bold text-primary text-xl">
                Business Details
              </h4>

              <div className="flex flex-col lg:flex-row gap-6">
                <div className="w-full lg:w-1/2 space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="border-none">
                        <FormLabel className={labelClass}>
                          Agency name *
                        </FormLabel>
                        <FormControl className="border border-primary">
                          <Input
                            placeholder="Kiambu Escorts & SPA"
                            {...field}
                            className={inputClass}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem className="border-none">
                        <FormLabel className={labelClass}>
                          Business type *
                        </FormLabel>
                        <FormControl>
                          <AgencySelectField
                            value={field.value}
                            onChange={field.onChange}
                            options={BUSINESS_TYPES}
                            placeholder="Select business type"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="establishmentYear"
                    render={({ field }) => (
                      <FormItem className="border-none">
                        <FormLabel className={labelClass}>
                          Year established
                        </FormLabel>
                        <FormControl className="border border-primary">
                          <Input
                            placeholder="2020"
                            inputMode="numeric"
                            {...field}
                            className={inputClass}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="w-full lg:w-1/2">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="border-none">
                        <FormLabel className={labelClass}>
                          Description *
                        </FormLabel>
                        <FormControl className="border border-primary">
                          <Textarea
                            placeholder="Tell clients about your agency, your girls and what makes you different..."
                            {...field}
                            className="bg-white text-black px-6 py-4 min-h-56 rounded-2xl text-lg focus-visible:ring-0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </section>

            {/* CONTACT */}
            <section>
              <h4 className="my-4 font-bold text-primary text-xl">
                Contact Details
              </h4>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem className="border-none">
                      <FormLabel className={labelClass}>Email *</FormLabel>
                      <FormControl className="border border-primary">
                        <Input
                          placeholder="info@eliteescorts.com"
                          {...field}
                          className={inputClass}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem className="border-none">
                      <FormLabel className={labelClass}>Website</FormLabel>
                      <FormControl className="border border-primary">
                        <Input
                          placeholder="https://www.eliteescorts.com"
                          {...field}
                          className={inputClass}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem className="border-none">
                      <FormLabel className={labelClass}>Phone *</FormLabel>
                      <FormControl className="border border-primary">
                        <Input
                          placeholder="+254712345678"
                          type="tel"
                          {...field}
                          className={inputClass}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="whatsappPhone"
                  render={({ field }) => (
                    <FormItem className="border-none">
                      <FormLabel className={labelClass}>WhatsApp</FormLabel>
                      <FormControl className="border border-primary">
                        <Input
                          placeholder="+254712345678"
                          type="tel"
                          {...field}
                          className={inputClass}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {/* LOCATION */}
            <section>
              <h4 className="my-4 font-bold text-primary text-xl">Location</h4>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="county"
                  render={({ field }) => (
                    <FormItem className="border-none">
                      <FormLabel className={labelClass}>County *</FormLabel>
                      <FormControl>
                        <AgencySelectField
                          value={field.value}
                          onChange={field.onChange}
                          options={countyOptions}
                          placeholder="Select county"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem className="border-none">
                      <FormLabel className={labelClass}>Region *</FormLabel>
                      <FormControl>
                        <AgencySelectField
                          value={field.value}
                          onChange={field.onChange}
                          options={regionOptions}
                          placeholder={
                            selectedCounty
                              ? "Select region"
                              : "Select a county first"
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="town"
                  render={({ field }) => (
                    <FormItem className="border-none">
                      <FormLabel className={labelClass}>
                        Town or area *
                      </FormLabel>
                      <FormControl className="border border-primary">
                        <Input
                          placeholder="Westlands"
                          {...field}
                          className={inputClass}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estate"
                  render={({ field }) => (
                    <FormItem className="border-none">
                      <FormLabel className={labelClass}>Estate</FormLabel>
                      <FormControl className="border border-primary">
                        <Input
                          placeholder="Westlands Business Park"
                          {...field}
                          className={inputClass}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="border-none">
                      <FormLabel className={labelClass}>Address</FormLabel>
                      <FormControl className="border border-primary">
                        <Input
                          placeholder="3rd Floor, Westlands Business Park"
                          {...field}
                          className={inputClass}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem className="border-none">
                      <FormLabel className={labelClass}>Street</FormLabel>
                      <FormControl className="border border-primary">
                        <Input
                          placeholder="Waiyaki Way"
                          {...field}
                          className={inputClass}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem className="border-none">
                      <FormLabel className={labelClass}>Postal code</FormLabel>
                      <FormControl className="border border-primary">
                        <Input
                          placeholder="00100"
                          {...field}
                          className={inputClass}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {/* OPENING HOURS */}
            <WorkHoursForm form={form} />

            {/* SERVICES & CATEGORIES */}
            <section>
              <h4 className="my-4 font-bold text-primary text-xl">
                Services & Categories
              </h4>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="categories"
                  render={({ field }) => (
                    <FormItem className="border-none">
                      <FormControl>
                        <AgencyTagsInput
                          label="Categories *"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="e.g. VIP"
                          suggestions={CATEGORY_SUGGESTIONS}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="services"
                  render={({ field }) => (
                    <FormItem className="border-none">
                      <FormControl>
                        <AgencyTagsInput
                          label="Services *"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="e.g. Massage"
                          suggestions={SERVICE_SUGGESTIONS}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specialties"
                  render={({ field }) => (
                    <FormItem className="border-none">
                      <FormControl>
                        <AgencyTagsInput
                          label="Specialties"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="e.g. High-end escorts"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="languages"
                  render={({ field }) => (
                    <FormItem className="border-none">
                      <FormControl>
                        <AgencyTagsInput
                          label="Languages *"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="e.g. English"
                          suggestions={LANGUAGE_SUGGESTIONS}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMethods"
                  render={({ field }) => (
                    <FormItem className="border-none">
                      <FormControl>
                        <AgencyTagsInput
                          label="Payment methods *"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="e.g. M-Pesa"
                          suggestions={PAYMENT_SUGGESTIONS}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {/* SOCIAL MEDIA */}
            <section>
              <h4 className="my-4 font-bold text-primary text-xl">
                Social Media
              </h4>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[
                  ["instagram", "Instagram", "eliteescorts_ke"],
                  ["twitter", "X / Twitter", "eliteescorts_ke"],
                  ["facebook", "Facebook", "eliteescorts.ke"],
                  ["telegram", "Telegram", "eliteescorts"],
                ].map(([name, label, placeholder]) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name as keyof AgencyFormValues}
                    render={({ field }) => (
                      <FormItem className="border-none">
                        <FormLabel className={labelClass}>{label}</FormLabel>
                        <FormControl className="border border-primary">
                          <Input
                            placeholder={placeholder}
                            {...field}
                            value={(field.value as string) || ""}
                            className={inputClass}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </section>

            {/* MEDIA & PLAN */}
            <section>
              <h4 className="my-4 font-bold text-primary text-xl">
                Media & Plan
              </h4>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <AgencyImageField
                  label="Logo:"
                  file={logoFile}
                  onFileChange={setLogoFile}
                />

                <AgencyImageField
                  label="Cover:"
                  file={coverFile}
                  onFileChange={setCoverFile}
                />

                <FormField
                  control={form.control}
                  name="planType"
                  render={({ field }) => (
                    <FormItem className="border-none">
                      <FormLabel className={labelClass}>
                        Subscription plan *
                      </FormLabel>
                      <FormControl>
                        <AgencySelectField
                          value={field.value}
                          onChange={field.onChange}
                          options={PLAN_TYPES}
                          placeholder="Select a plan"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {error && (
              <p className="p-3 bg-primary text-lg text-white py-2 text-center my-4">
                {error}
              </p>
            )}

            <div className="flex justify-center">
              <Button
                disabled={loading}
                className="flex lg:w-1/4 w-3/4 rounded-none font-bold items-center gap-2 p-12 text-white bg-primary"
                type="submit"
              >
                <ArrowDown
                  className={cn("size-8", loading ? "hidden" : "block")}
                  strokeWidth={4}
                />
                <span className="uppercase font-semibold text-xl lg:text-2xl">
                  {loading ? "Submitting..." : "Create Agency"}
                </span>
              </Button>
            </div>
          </form>
        </Form>
      </SectionCard>
    </div>
  );
};

export default AgencyProfileForm;
