"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "pesapal:lastPhone";

const KENYAN_MOBILE_REGEX = /^(?:\+?254|0)(7\d{8}|1\d{8})$/;
const SAFARICOM_PREFIXES = ["07", "011"];
const AIRTEL_PREFIXES = ["073", "078"];

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  
  if (digits.startsWith("254")) {
    return `+${digits}`;
  }
  if (digits.startsWith("0")) {
    return `+254${digits.slice(1)}`;
  }
  if (digits.length === 9 && digits.startsWith("7")) {
    return `+254${digits}`;
  }
  if (digits.length === 9 && digits.startsWith("1")) {
    return `+254${digits}`;
  }
  return digits;
}

function getDisplayValue(normalized: string): string {
  if (!normalized) return "";
  if (normalized.startsWith("+254")) {
    const national = normalized.slice(4);
    return `+254 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
  }
  if (normalized.startsWith("0")) {
    return `${normalized.slice(0, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7)}`;
  }
  return normalized;
}

function isValidKenyanMobile(phone: string): boolean {
  return KENYAN_MOBILE_REGEX.test(phone);
}

function getCarrier(phone: string): "safaricom" | "airtel" | "unknown" {
  const normalized = normalizePhone(phone);
  const national = normalized.replace("+254", "0");
  
  if (SAFARICOM_PREFIXES.some(p => national.startsWith(p))) return "safaricom";
  if (AIRTEL_PREFIXES.some(p => national.startsWith(p))) return "airtel";
  return "unknown";
}

interface PhoneInputProps {
  value: string;
  onChange: (normalizedValue: string) => void;
  error?: string | null;
  disabled?: boolean;
  placeholder?: string;
  showCarrier?: boolean;
  onUseDifferent?: () => void;
}

export function PhoneInput({
  value,
  onChange,
  error,
  disabled = false,
  placeholder = "0712 345 678",
  showCarrier = true,
  onUseDifferent,
}: PhoneInputProps) {
  const [displayValue, setDisplayValue] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [carrier, setCarrier] = useState<"safaricom" | "airtel" | "unknown">("unknown");
  const [showUseDifferent, setShowUseDifferent] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored && !value) {
      const normalized = normalizePhone(stored);
      if (isValidKenyanMobile(normalized)) {
        onChange(normalized);
      }
    }
  }, []);

  useEffect(() => {
    if (value) {
      setDisplayValue(getDisplayValue(value));
      setCarrier(getCarrier(value));
      const valid = isValidKenyanMobile(value);
      setLocalError(valid ? null : "Please enter a valid Kenyan mobile number (Safaricom or Airtel)");
    } else {
      setDisplayValue("");
      setCarrier("unknown");
      setLocalError(null);
    }
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, "");
    
    let normalized = "";
    if (digits.startsWith("254")) {
      normalized = `+${digits}`;
    } else if (digits.startsWith("0")) {
      normalized = `+254${digits.slice(1)}`;
    } else if (digits.length === 9 && (digits.startsWith("7") || digits.startsWith("1"))) {
      normalized = `+254${digits}`;
    } else {
      normalized = digits;
    }

    setDisplayValue(getDisplayValue(normalized));
    onChange(normalized);

    if (normalized) {
      const valid = isValidKenyanMobile(normalized);
      setLocalError(valid ? null : "Please enter a valid Kenyan mobile number (Safaricom or Airtel)");
      setCarrier(getCarrier(normalized));
    } else {
      setLocalError(null);
      setCarrier("unknown");
    }
  }, [onChange]);

  const handleBlur = useCallback(() => {
    if (value && isValidKenyanMobile(value)) {
      try {
        localStorage.setItem(STORAGE_KEY, value);
      } catch {
        // ignore localStorage errors (private mode, etc.)
      }
    }
  }, [value]);

  const handleUseDifferent = useCallback(() => {
    onChange("");
    setDisplayValue("");
    setShowUseDifferent(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    onUseDifferent?.();
  }, [onChange, onUseDifferent]);

  const finalError = error || localError;
  const isValid = value && isValidKenyanMobile(value);

  return (
    <div className="w-full">
      <label htmlFor="pesapal-phone" className="block text-sm font-medium text-gray-700 mb-1.5">
        M-Pesa / Airtel Phone Number
      </label>
      <div className="relative">
        <input
          id="pesapal-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={placeholder}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          className={cn(
            "w-full h-11 px-4 pr-10 text-base border rounded-lg shadow-sm transition-colors",
            "bg-white text-gray-900 placeholder:text-gray-400",
            disabled 
              ? "bg-gray-50 cursor-not-allowed border-gray-200" 
              : finalError 
                ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                : "border-gray-300 focus:border-red-700 focus:ring-red-700",
            "focus:outline-none focus:ring-2"
          )}
          aria-invalid={!!finalError}
          aria-describedby={finalError ? "phone-error" : undefined}
        />
        {isValid && showCarrier && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
            {carrier === "safaricom" ? "✓ Safaricom" : carrier === "airtel" ? "✓ Airtel" : "✓ Valid"}
          </span>
        )}
        {finalError && !isValid && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
            ✗ Invalid
          </span>
        )}
      </div>
      {finalError && (
        <p id="phone-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {finalError}
        </p>
      )}
      {!finalError && value && isValid && (
        <p className="mt-1.5 text-sm text-gray-500 flex items-center gap-1">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13.707 11.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L10 12.586l3.707-3.707a1 1 0 011.414 0z" />
            <path fillRule="evenodd" d="M4.293 2.293a1 1 0 011.414 0L10 5.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          You'll receive an M-Pesa STK push on this number.
        </p>
      )}
      {showUseDifferent && (
        <button
          type="button"
          onClick={handleUseDifferent}
          className="mt-2 text-sm text-red-700 hover:text-red-800 underline"
        >
          Use a different number
        </button>
      )}
    </div>
  );
}