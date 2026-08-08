"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Upload, X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { submitAgencyVerification } from "@/server-actions/agency.action";
import type { IAgency } from "@/types/agency.types";

interface Prop {
  agencyId: string;
  ownerId: string;
  agencyName?: string;
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

const DocPreview = ({ url, label }: { url: string; label: string }) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <label className="font-medium text-white/40 text-base">{label}</label>
      <div className="flex items-center gap-3">
        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-300 bg-gray-100">
          <img
            src={url}
            alt={label}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
        <div className="flex-1">
          <p className="text-sm text-white/70 truncate">Previously uploaded</p>
          <p className="text-xs text-white/40">Click replace to update</p>
        </div>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className="shrink-0 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
          title="Preview"
        >
          <Eye className="size-4" />
        </button>
      </div>

      {showPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={url}
              alt={label}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="absolute -top-10 right-0 text-white text-sm hover:underline"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    if (selected) {
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
      onChange(selected);
    } else {
      setPreviewUrl(null);
      onChange(null);
    }
    e.target.value = "";
  };

  const clear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    onChange(null);
  };

  const hasExisting = Boolean(existingUrl);
  const hasNew = Boolean(file);

  return (
    <div className="flex flex-col gap-2">
      <label className="font-medium text-white/40 text-base">{label}</label>

      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-3">
          {(previewUrl || existingUrl) && (
            <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-300 bg-gray-100 shrink-0">
              <img
                src={previewUrl || existingUrl}
                alt={label}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}

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
              onChange={handleFileChange}
            />
          </label>
        </div>

        {(previewUrl || existingUrl) && (
          <>
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="shrink-0 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
              title="Preview"
            >
              <Eye className="size-4" />
            </button>
            <button
              type="button"
              onClick={clear}
              aria-label={`Clear ${label}`}
              className="shrink-0 rounded-full bg-primary p-2 text-white hover:bg-red-600 transition-colors"
            >
              <X className="size-4" />
            </button>
          </>
        )}
      </div>

      {showPreview && (previewUrl || existingUrl) && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={previewUrl || existingUrl}
              alt={label}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="absolute -top-10 right-0 text-white text-sm hover:underline"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function AgencyVerificationForm({
  agencyId,
  ownerId,
  agencyName,
  existingDocs,
}: Prop) {
  const [loading, setLoading] = useState(false);
  const [regCert, setRegCert] = useState<File | null>(null);
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [kraPin, setKraPin] = useState("");
  const [accepted, setAccepted] = useState(false);
  const router = useRouter();

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

      if (!businessRegistration || !idFrontUrl || !idBackUrl || !kraPin.trim()) {
        toast.error("Please upload all required documents and provide KRA PIN");
        return;
      }

      const res = await submitAgencyVerification(agencyId, {
        ownerId,
        businessRegistration,
        idFront: idFrontUrl,
        idBack: idBackUrl,
        kraPin: kraPin.trim(),
        agencyName: agencyName || "",
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
      setKraPin("");
      router.push("/agency-verification-status");
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong while uploading");
    } finally {
      setLoading(false);
    }
  };

  const hasExisting = Boolean(
    existingDocs?.businessLicense ||
    existingDocs?.idProof ||
    existingDocs?.otherDocuments?.[0],
  );

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
        label="National ID (front) - Agency Representative"
        file={idFront}
        onChange={setIdFront}
        existingUrl={existingDocs?.idProof}
      />
      <DocPicker
        label="National ID (back) - Agency Representative"
        file={idBack}
        onChange={setIdBack}
        existingUrl={existingDocs?.otherDocuments?.[0]}
      />

      <div className="flex flex-col gap-2">
        <label className="font-medium text-white/40 text-base">
          KRA PIN / Registration Number
        </label>
        <input
          type="text"
          value={kraPin}
          onChange={(e) => setKraPin(e.target.value)}
          placeholder="e.g. P051234567X or Registration Number"
          className="w-full h-12 rounded-md border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-700/20"
        />
      </div>

      {agencyName && (
        <div className="flex flex-col gap-2">
          <label className="font-medium text-white/40 text-base">
            Agency Name
          </label>
          <div className="w-full h-12 rounded-md border border-gray-300 px-3 py-2 text-base bg-gray-50 flex items-center">
            {agencyName}
          </div>
        </div>
      )}

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
        {loading ? "Submitting…" : hasExisting ? "Update verification documents" : "Submit verification documents"}
      </Button>
    </form>
  );
}

