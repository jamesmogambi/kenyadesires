"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileText, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { submitAgencyVerification } from "@/server-actions/agency.action";
import type { IAgency } from "@/types/agency.types";

interface Prop {
  agencyId: string;
  ownerId: string;
  existingDocs?: IAgency["verificationDocuments"];
}

const uploadToCloudinary = async (file: File): Promise<string> => {
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
    { method: "POST", body: formData },
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(
      `Upload failed (${file.name}): ${uploadRes.status} - ${errText}`,
    );
  }

  const data = await uploadRes.json();
  return data.secure_url as string;
};

const DocPicker = ({
  label,
  file,
  onChange,
  existingUrl,
}: {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  existingUrl?: string;
}) => {
  const hasExisting = Boolean(existingUrl);
  const hasNew = Boolean(file);

  const clear = () => {
    onChange(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="font-medium text-white/40 text-base">{label}</label>

      <div className="flex items-center gap-3">
        <label
          htmlFor={label}
          className="flex-1 flex items-center justify-between border border-primary bg-white text-black px-4 h-10 rounded-full text-base cursor-pointer overflow-hidden"
        >
          <span
            className={cn(
              "truncate",
              hasNew || hasExisting ? "text-black" : "text-black/40",
            )}
          >
            {hasNew
              ? file?.name
              : hasExisting
                ? "Uploaded - click to replace"
                : "No file selected"}
          </span>
          <span className="shrink-0 bg-primary h-full flex items-center justify-center text-white font-semibold text-base px-4 rounded-r-full">
            <Upload className="size-4" />
          </span>
          <input
            id={label}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => {
              const selected = e.target.files?.[0];
              onChange(selected ?? null);
              e.target.value = "";
            }}
          />
        </label>

        {(hasNew || hasExisting) && (
          <button
            type="button"
            onClick={clear}
            aria-label={`Clear ${label}`}
            className="shrink-0 rounded-full bg-primary p-2 text-white hover:bg-red-600 transition-colors"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default function AgencyVerificationForm({
  agencyId,
  ownerId,
  existingDocs,
}: Prop) {
  const [loading, setLoading] = useState(false);
  const [regCert, setRegCert] = useState<File | null>(null);
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [accepted, setAccepted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let businessRegistration = existingDocs?.businessLicense || "";
      let idFrontUrl = existingDocs?.idProof || "";
      let idBackUrl = existingDocs?.otherDocuments?.[0] || "";

      if (regCert) {
        businessRegistration = await uploadToCloudinary(regCert);
      }
      if (idFront) {
        idFrontUrl = await uploadToCloudinary(idFront);
      }
      if (idBack) {
        idBackUrl = await uploadToCloudinary(idBack);
      }

      if (!businessRegistration || !idFrontUrl || !idBackUrl) {
        toast.error("Please upload all required documents");
        return;
      }

      const res = await submitAgencyVerification(agencyId, {
        ownerId,
        businessRegistration,
        idFront: idFrontUrl,
        idBack: idBackUrl,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to submit verification");
        return;
      }

      toast.success("Verification documents submitted", {
        description:
          "Your agency is now under review. You will be notified once approved.",
      });

      setRegCert(null);
      setIdFront(null);
      setIdBack(null);
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong while uploading");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <h3 className="text-xl font-bold text-primary mb-1">
          Agency verification documents
        </h3>
        <p className="text-white/50 text-sm">
          Required: Business Registration Certificate and the representative's
          National ID (front and back).
        </p>
      </div>

      <DocPicker
        label="Business Registration Certificate"
        file={regCert}
        onChange={setRegCert}
        existingUrl={existingDocs?.businessLicense}
      />
      <DocPicker
        label="National ID (front)"
        file={idFront}
        onChange={setIdFront}
        existingUrl={existingDocs?.idProof}
      />
      <DocPicker
        label="National ID (back)"
        file={idBack}
        onChange={setIdBack}
        existingUrl={existingDocs?.otherDocuments?.[0]}
      />

      <div className="flex items-center gap-2 text-xs text-white/50">
        <FileText className="size-4" />
        Accepted: JPG, PNG, PDF. Max 10MB each.
      </div>

      <div className="flex items-center gap-3">
        <Checkbox
          id="agency-verify-accept"
          checked={accepted}
          onCheckedChange={(checked) => setAccepted(checked === true)}
          className="mt-1 size-6"
        />
        <label
          htmlFor="agency-verify-accept"
          className="text-sm text-white/70 leading-snug cursor-pointer"
        >
          I confirm that all information submitted is accurate and that I am
          authorized to represent this agency.
        </label>
      </div>

      <Button
        type="submit"
        disabled={loading || !accepted}
        className="w-full lg:w-1/3 rounded-none font-bold items-center gap-2 py-6 uppercase text-lg text-white bg-primary"
      >
        {loading ? "Submitting…" : "Submit verification documents"}
      </Button>
    </form>
  );
}
