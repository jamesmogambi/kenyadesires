"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { submitEscortVerification } from "@/server-actions/girl.action";

interface Prop {
  escortId: string;
  existingDocs?: {
    idProof?: string;
    idBack?: string;
    selfieWithId?: string;
  };
  existingName?: string;
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
        <div className="flex-1 flex items-center gap-3">
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
              file ? "text-black" : "text-black/40",
            )}
          >
            {file ? file.name : "No file selected"}
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

        {file && (
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

export default function EscortVerificationForm({
  escortId,
  existingDocs,
  existingName,
}: Prop) {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(existingName || "");
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [accepted, setAccepted] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!fullName.trim()) {
        toast.error("Please enter your full name");
        return;
      }
      if (!idFront || !idBack || !selfie) {
        toast.error("Please upload all required documents");
        return;
      }

      const [idFrontUrl, idBackUrl, selfieUrl] = await Promise.all([
        uploadToCloudinary(idFront),
        uploadToCloudinary(idBack),
        uploadToCloudinary(selfie),
      ]);

      const res = await submitEscortVerification({
        escortId,
        fullName: fullName.trim(),
        idFront: idFrontUrl,
        idBack: idBackUrl,
        selfie: selfieUrl,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to submit verification");
        return;
      }

      toast.success("Verification documents submitted", {
        description:
          "Your identity verification is now under review. You will be notified once approved. Verification typically takes a few hours.",
      });

      setFullName("");
      setIdFront(null);
      setIdBack(null);
      setSelfie(null);
      router.push("/verify/done");
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong while uploading");
    } finally {
      setLoading(false);
    }
  };

  const hasExisting = Boolean(existingDocs?.idProof || existingDocs?.idBack || existingDocs?.selfieWithId);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <h3 className="text-xl font-bold text-primary mb-1">
          Identity verification documents
        </h3>
        <p className="text-white/50 text-sm">
          Upload your government-issued ID and a real-time selfie. Verification
          typically takes a few hours.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-medium text-white/40 text-base">
          Full Name (as on ID)
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Enter your full legal name"
          className="w-full h-12 rounded-md border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-700/20"
        />
      </div>

      {hasExisting && (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <p className="text-sm text-white/70 mb-3 font-medium">
            Previously submitted documents
          </p>
          <div className="flex flex-col gap-4">
            {existingDocs?.idProof && (
              <DocPreview url={existingDocs.idProof} label="National ID (front)" />
            )}
            {existingDocs?.idBack && (
              <DocPreview url={existingDocs.idBack} label="National ID (back)" />
            )}
            {existingDocs?.selfieWithId && (
              <DocPreview url={existingDocs.selfieWithId} label="Selfie" />
            )}
          </div>
          <p className="text-xs text-white/40 mt-3">
            Upload new files below to replace existing documents
          </p>
        </div>
      )}

      <DocPicker
        label="National ID (front)"
        file={idFront}
        onChange={setIdFront}
      />
      <DocPicker
        label="National ID (back)"
        file={idBack}
        onChange={setIdBack}
      />
      <DocPicker
        label="Selfie (hold your ID next to your face)"
        file={selfie}
        onChange={setSelfie}
      />

      <div className="flex items-center gap-2 text-xs text-white/50">
        <Upload className="size-4" />
        Accepted: JPG, PNG, PDF. Max 10MB each.
      </div>

      <div className="flex items-center gap-3">
        <Checkbox
          id="escort-verify-accept"
          checked={accepted}
          onCheckedChange={(checked) => setAccepted(checked === true)}
          className="mt-1 size-6"
        />
        <label
          htmlFor="escort-verify-accept"
          className="text-sm text-white/70 leading-snug cursor-pointer"
        >
          I confirm that all information submitted is accurate and that I am the
          person in the documents.
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
