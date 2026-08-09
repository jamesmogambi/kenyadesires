"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogOverlay,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AD_PACKAGES } from "@/lib/constants/packages";
import { purchaseAdPackage, getUserActivePackages } from "@/server-actions/payment.action";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Prop {
  className?: string;
  onPurchaseSuccess?: () => void;
  onPurchaseError?: (error: string) => void;
  userCredits?: number;
  userPhone?: string;
}

const AdvertisingPriceLIst = ({
  className,
  onPurchaseSuccess,
  onPurchaseError,
  userCredits = 0,
  userPhone = "",
}: Prop) => {
  const router = useRouter();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [displayPhone, setDisplayPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);

  const formatPhoneForDisplay = (digits: string): string => {
    if (!digits) return "";
    if (digits.startsWith("254")) {
      return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }
    if (digits.startsWith("0")) {
      return `${digits.slice(0, 1)}${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    }
    if (digits.length <= 9) {
      return digits;
    }
    return `0${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const digits = phone.replace(/\D/g, "");

    if (digits.length === 0) {
      setPhoneError("Phone number is required");
      return false;
    }

    const normalized = digits.startsWith("254")
      ? `+${digits}`
      : digits.length === 10 && digits.startsWith("07")
        ? digits
        : digits.length === 9 && digits.startsWith("7")
          ? `0${digits}`
          : digits;

    const finalDigits = normalized.replace(/\D/g, "");

    const isValid =
      (finalDigits.length === 10 && finalDigits.startsWith("07")) ||
      (finalDigits.length === 12 && finalDigits.startsWith("2547"));

    if (!isValid) {
      setPhoneError(
        "Please enter a valid Kenyan phone number (e.g., 0712345678 or +254 712 345 678)",
      );
      return false;
    }

    setPhoneError(null);
    return true;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, "");
    setPhoneNumber(digits);
    setDisplayPhone(raw);
    if (phoneError) setPhoneError(null);
  };

  const handlePhoneBlur = () => {
    if (phoneNumber) {
      setDisplayPhone(formatPhoneForDisplay(phoneNumber));
      validatePhoneNumber(phoneNumber);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    const digits = pasted.replace(/\D/g, "");
    setPhoneNumber(digits);
    setDisplayPhone(formatPhoneForDisplay(digits));
    if (phoneError) setPhoneError(null);
  };

  const handleUseCredits = async () => {
    if (!selectedPackage) return;
    setLoading(true);
    setMessage("");
    setStatus("idle");

    try {
      const result = await purchaseAdPackage(selectedPackage);
      if (result.success) {
        setStatus("success");
        setMessage("Ad package purchased successfully with credits!");
        onPurchaseSuccess?.();
        window.dispatchEvent(new Event("packages-updated"));
        window.dispatchEvent(new Event("credits-updated"));
        setTimeout(() => {
          setOpen(false);
          setSelectedPackage(null);
          setStatus("idle");
          setMessage("");
        }, 1500);

        if (result.transactionId) {
          router.push(`/payment-status?checkoutRequestId=${encodeURIComponent(result.transactionId)}`);
        }
      } else {
        setStatus("error");
        setMessage(result.error || "Failed to purchase package");
        onPurchaseError?.(result.error || "Failed to purchase package");
      }
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message || "An error occurred");
      onPurchaseError?.(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyWithMpesa = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!selectedPackage) {
      setStatus("error");
      setMessage("Please select a package first");
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setStatus("error");
      setMessage(phoneError || "Please enter a valid phone number");
      return;
    }

    if (!termsAccepted) {
      setStatus("error");
      setMessage("Please accept the terms and conditions");
      return;
    }

    setLoading(true);
    setStatus("pending");
    setMessage("Initiating payment...");

    try {
      const activeResult = await getUserActivePackages();
      if (activeResult.success && activeResult.packages.length > 0) {
        const pkg = AD_PACKAGES.find((p) => p.id === selectedPackage);
        const hasActiveSameType = activeResult.packages.some(
          (p: any) => p.packageId === selectedPackage && p.status === "active",
        );

        if (hasActiveSameType) {
          setStatus("error");
          setMessage(
            `You already have an active ${pkg?.name || "package"}. Please wait for it to expire before purchasing again.`,
          );
          setLoading(false);
          return;
        }
      }

      const pkg = AD_PACKAGES.find((p) => p.id === selectedPackage);
      if (!pkg) throw new Error("Package not found");

      const amount = pkg.credits * 10;
      const cleanPhone = phoneNumber.replace(/\s/g, "").replace(/^\+/, "");

      const response = await fetch("/api/mpesa/stk-push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: cleanPhone,
          amount,
          accountReference: `Ad-${pkg.name}-${Date.now()}`,
          transactionDesc: `Buy ${pkg.name} ad package`,
          packageId: pkg.id,
          type: "ad_purchase",
        }),
        credentials: "include",
        cache: "no-store",
      });

      const text = await response.text();
      let data: any = {};

      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }

      if (!response.ok || data.error) {
        const detail = data.detail ? `: ${data.detail}` : "";
        const raw = data.raw ? ` | raw: ${data.raw}` : "";
        throw new Error(`${data.error || "Failed to initiate payment"}${detail}${raw}`);
      }

      if (data.success && data.checkoutRequestId) {
        setStatus("success");
        setMessage(
          `✅ Payment initiated! Check your phone (${phoneNumber}) and enter PIN. Redirecting...`,
        );
        onPurchaseSuccess?.();
        setTimeout(() => {
          setOpen(false);
          setSelectedPackage(null);
          setStatus("idle");
          setMessage("");
          router.push(
            `/payment-status?checkoutRequestId=${encodeURIComponent(data.checkoutRequestId)}`,
          );
        }, 1500);
      } else {
        throw new Error(data.error || "Failed to initiate payment");
      }
    } catch (error: any) {
      const errorMessage = error?.message || "An error occurred";
      setStatus("error");
      setMessage(`M-Pesa Error: ${errorMessage}`);
      onPurchaseError?.(errorMessage);
      console.error("M-Pesa payment error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        phoneInputRef.current?.focus();
      }, 300);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setStatus("idle");
      setMessage("");
      setPhoneError(null);
      setPhoneNumber("");
      setDisplayPhone("");
    } else if (open && userPhone) {
      const digits = userPhone.replace(/\D/g, "");
      setPhoneNumber(digits);
      setDisplayPhone(formatPhoneForDisplay(digits));
    }
  }, [open, userPhone]);

  const selectedPkg = AD_PACKAGES.find((p) => p.id === selectedPackage);
  const canAffordCredits = selectedPkg
    ? userCredits >= selectedPkg.credits
    : false;

  const packageDetails: Record<string, { features: string[]; badge?: string }> =
    {
      quick_boost: {
        badge: "Quick Boost",
        features: ["Boosted listing ranking", "Active for 24 hours"],
      },
      weekly_boost: {
        badge: "Weekly Boost",
        features: [
          "Higher listing ranking",
          "Active for 7 days",
          "Higher priority than Quick Boost",
        ],
      },
      premium_boost: {
        badge: "Premium Boost",
        features: [
          "Higher listing ranking",
          "Active for 14 days",
          "Higher priority than Weekly Boost",
          "Eligible for featured/category placement",
        ],
      },
      monthly_vip: {
        badge: "Monthly VIP",
        features: [
          "Highest standard listing priority",
          "Active for 30 days",
          "Eligible for homepage/category featured placement",
          "Highest priority among normal boosted listings",
        ],
      },
    };

  const StatusIndicator = () => {
    if (status === "idle") return null;

    return (
      <div
        className={cn(
          "p-3 rounded-lg flex items-start gap-3",
          status === "pending" && "bg-blue-50 border border-blue-200",
          status === "success" && "bg-green-50 border border-green-200",
          status === "error" && "bg-red-50 border border-red-200",
        )}
      >
        {status === "pending" && (
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0 mt-0.5" />
        )}
        {status === "success" && (
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
        )}
        {status === "error" && (
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        )}
        <p
          className={cn(
            "text-sm",
            status === "pending" && "text-blue-700",
            status === "success" && "text-green-700",
            status === "error" && "text-red-700",
          )}
        >
          {message}
        </p>
      </div>
    );
  };

  return (
    <section className={cn("px-4", className)}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogOverlay className="bg-black/50" />

        <div>
          <div>
            <h4 className="text-2xl md:text-3xl text-center mt-6 text-red-700 font-bold">
              Boost Packages
            </h4>
            <h6 className="text-red-700 text-xl md:text-2xl font-bold text-center mt-6 md:mt-10">
              Choose your boost plan
            </h6>
          </div>

          <div className="flex flex-row mt-6 mb-10 md:mb-12 items-start sm:items-center gap-3">
            <Checkbox
              className="bg-white size-6 border-2 border-blue-300 md:size-8 shrink-0"
              id="acceptTerms"
              checked={termsAccepted}
              onCheckedChange={(checked) =>
                setTermsAccepted(checked as boolean)
              }
            />
            <Label
              htmlFor="terms"
              className="text-gray-800 font-semibold text-wrap text-base"
            >
              <p className="">
                {" "}
                I agree to the{" "}
                <Link href="/terms" className="text-primary">
                  terms and conditions.
                </Link>{" "}
                and to the provision of the service before the expiry of the
                withdrawal period in accordance with § 1834 of the Civil Code.
              </p>
            </Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {AD_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={cn(
                  "rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300 w-full max-w-[360px] flex items-center justify-center flex-col h-fit p-4 md:p-6 relative",
                  (pkg as any).bestValue
                    ? "bg-red-700 text-white"
                    : "bg-stone-100",
                )}
              >
                {(pkg as any).popular && (
                  <div className="absolute -top-2 md:-top-3 right-2 md:right-4 bg-green-500 text-white text-xs md:text-sm font-bold px-2 md:px-3 py-1 rounded-full shadow-md">
                    Popular
                  </div>
                )}
                {(pkg as any).recommended && (
                  <div className="absolute -top-2 md:-top-3 right-2 md:right-4 bg-blue-500 text-white text-xs md:text-sm font-bold px-2 md:px-3 py-1 rounded-full shadow-md">
                    Recommended
                  </div>
                )}
                {(pkg as any).bestValue && (
                  <div className="absolute -top-2 md:-top-3 right-2 md:right-4 bg-purple-500 text-white text-xs md:text-sm font-bold px-2 md:px-3 py-1 rounded-full shadow-md">
                    Best Value
                  </div>
                )}
                {pkg.type === "boost" && (
                  <div className="mt-3 md:mt-4 mb-6 md:mb-8">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="4em"
                      height="4em"
                      viewBox="0 0 24 24"
                      className="md:w-5em md:h-5em"
                    >
                      <path d="M0 0h24v24H0z" fill="none" />
                      <g
                        fill="none"
                        stroke={(pkg as any).bestValue ? "#ffffff" : "#c7c7c7"}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                      >
                        <path d="M4.58 8.607L2 8.454C3.849 3.704 9.158 1 14.333 2.344c5.513 1.433 8.788 6.918 7.314 12.25c-1.219 4.411-5.304 7.337-9.8 7.406" />
                        <path
                          strokeDasharray=".5 3"
                          d="M12 22C6.5 22 2 17 2 11"
                        />
                        <path d="M13.604 9.722c-.352-.37-1.213-1.237-2.575-.62c-1.361.615-1.577 2.596.482 2.807c.93.095 1.537-.11 2.093.47c.556.582.659 2.198-.761 2.634s-2.341-.284-2.588-.509m1.653-6.484v.79m0 6.337v.873" />
                      </g>
                    </svg>
                  </div>
                )}
                <div className="mt-6 md:mt-8">
                  <h5
                    className={cn(
                      "text-3xl md:text-4xl mt-4 font-bold text-center",
                      (pkg as any).bestValue ? "text-white" : "text-red-700",
                    )}
                  >
                    {pkg.name}
                  </h5>
                </div>

                <div className="mt-6 md:mt-8 flex items-center justify-center flex-col gap-2 md:gap-3">
                  <span
                    className={cn(
                      "font-bold text-base md:text-lg text-center",
                      (pkg as any).bestValue ? "text-white" : "text-black",
                    )}
                  >
                    Price
                  </span>
                  <span
                    className={cn(
                      "text-2xl md:text-3xl font-bold",
                      (pkg as any).bestValue ? "text-white" : "text-black",
                    )}
                  >
                    KSH {(pkg.credits * 10).toLocaleString()}
                  </span>
                  <span
                    className={cn(
                      "text-sm md:text-base font-bold",
                      (pkg as any).bestValue ? "text-white/90" : "text-black",
                    )}
                  >
                    Active for {pkg.durationDays} {pkg.durationDays === 1 ? "day" : "days"}
                  </span>
                </div>

                  <Button
                    type="button"
                    className={cn(
                      "mt-6 md:mt-8 h-10 md:h-12 w-full text-white font-semibold text-lg md:text-2xl",
                      (pkg as any).bestValue
                        ? "bg-white text-red-700 hover:bg-white/90"
                        : "bg-red-800 hover:bg-red-700",
                    )}
                    onClick={() => {
                      if (!termsAccepted) {
                        toast.error("Please accept the terms and conditions first");
                        return;
                      }
                      setSelectedPackage(pkg.id);
                      setOpen(true);
                      setStatus("idle");
                      setMessage("");
                      setPhoneError(null);
                    }}
                  >
                    Buy {pkg.name}
                  </Button>
              </div>
            ))}
          </div>

          {selectedPackage && (
            <DialogContent
              className="sm:max-w-lg md:max-w-xl lg:max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              showCloseButton={false}
              onInteractOutside={(event: any) => {
                if (status === "pending") {
                  event.preventDefault();
                  return;
                }
              }}
              onPointerDownOutside={(e) => {
                if (status === "pending") {
                  e.preventDefault();
                }
              }}
            >
              <DialogHeader>
                <DialogTitle className="text-2xl md:text-3xl flex items-center gap-2">
                  Buy {selectedPkg?.name}
                  {status === "pending" && (
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  )}
                </DialogTitle>
                <DialogDescription className="text-base md:text-lg">
                  {selectedPkg?.description}. This package costs{" "}
                  {selectedPkg?.credits} credits (KSH{" "}
                  {((selectedPkg?.credits || 0) * 10).toLocaleString()}).
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-5">
                <div className="bg-stone-100 p-4 rounded-lg">
                  <p className="text-base md:text-lg text-gray-600">
                    Your Credits:{" "}
                    <span className="font-bold text-red-700 text-lg md:text-xl">
                      {userCredits}
                    </span>
                  </p>
                  <p className="text-base md:text-lg text-gray-600">
                    Required:{" "}
                    <span className="font-bold text-red-700 text-lg md:text-xl">
                      {selectedPkg?.credits} credits
                    </span>
                  </p>
                  {selectedPkg && userCredits < selectedPkg.credits && (
                    <p className="text-sm text-orange-600 mt-2">
                      You need {selectedPkg.credits - userCredits} more credits.
                      Purchase with M-Pesa below.
                    </p>
                  )}
                </div>

                <StatusIndicator />

                {status !== "success" && (
                  <div className="flex flex-col gap-4">
                    <Button
                      onClick={handleUseCredits}
                      disabled={
                        loading || !canAffordCredits || status === "pending"
                      }
                      className="w-full h-12 md:h-14 text-base md:text-lg"
                      variant={canAffordCredits ? "default" : "secondary"}
                    >
                      {loading && status === "pending" ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : canAffordCredits ? (
                        `Use ${selectedPkg?.credits} Credits`
                      ) : (
                        "Insufficient Credits"
                      )}
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-sm uppercase">
                        <span className="bg-white px-3 text-gray-500">Or</span>
                      </div>
                    </div>

                    <form
                      onSubmit={handleBuyWithMpesa}
                      className="flex flex-col gap-3"
                    >
                      <div>
                        <Label
                          htmlFor="phone"
                          className="text-base md:text-lg font-semibold"
                        >
                          M-Pesa Phone Number
                        </Label>
                        <div className="mt-2">
                          <input
                            ref={phoneInputRef}
                            id="phone"
                            type="tel"
                            name="phone"
                            autoComplete="tel"
                            inputMode="numeric"
                            pattern="[0-9+ ]*"
                            placeholder="0712 345 678"
                            value={displayPhone}
                            onChange={handlePhoneChange}
                            onBlur={handlePhoneBlur}
                            onPaste={handlePaste}
                            disabled={status === "pending"}
                            className={cn(
                              "w-full h-12 md:h-14 text-black/70 rounded-md border px-3 py-2 text-base md:text-lg shadow-sm",
                              phoneError
                                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                : "border-gray-300 focus:border-red-700 focus:ring-red-700",
                              "focus:outline-none focus:ring-2",
                              status === "pending" &&
                                "opacity-50 cursor-not-allowed bg-gray-100",
                            )}
                          />
                          {phoneError && (
                            <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {phoneError}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 mt-1">
                            Enter a valid Kenyan number. Example: 0712 345 678
                          </p>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={
                          loading ||
                          !phoneNumber ||
                          !termsAccepted ||
                          status === "pending" ||
                          !!phoneError
                        }
                        className="w-full bg-green-600 hover:bg-green-700 h-12 md:h-14 text-base md:text-lg"
                      >
                        {loading && status === "pending" ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          `Buy ${selectedPkg?.name} with M-Pesa`
                        )}
                      </Button>
                    </form>
                  </div>
                )}

                {status === "success" && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <p className="text-green-700 font-semibold text-lg">
                      {message}
                    </p>
                    <p className="text-sm text-green-600 mt-2">
                      Closing in a moment...
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button
                    variant="secondary"
                    disabled={loading && status === "pending"}
                    className="h-10 md:h-12 text-base md:text-lg"
                  >
                    {status === "success" ? "Done" : "Close"}
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          )}
        </div>

        <div className="mt-12 max-w-3xl mx-auto">
          <h4 className="text-xl mt-6 md:text-2xl text-center text-red-700 font-bold mb-4">
            Boost Plan Details
          </h4>
          <p className="text-center text-gray-600 mb-6">
            Click each plan below to see what's included
          </p>
          <div className="space-y-3">
            {AD_PACKAGES.map((pkg) => {
              const details = packageDetails[pkg.id];
              if (!details) return null;

              return (
                <Collapsible
                  key={pkg.id}
                  className="bg-stone-100 rounded-lg shadow-md"
                >
                  <CollapsibleTrigger className="w-full flex items-center justify-between p-4 md:p-5 text-left">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-base md:text-lg text-red-700">
                        {pkg.name}
                      </span>
                      <span className="text-sm text-gray-600">
                        KSH {(pkg.credits * 10).toLocaleString()}
                      </span>
                    </div>
                    <ChevronDown className="size-5 text-gray-500 collapsible-chevron" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 md:px-5 pb-4 md:pb-5">
                      <ul className="space-y-2">
                        {details.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-red-700 mt-1">•</span>
                            <span className="text-gray-800 text-sm md:text-base">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </div>

        <style jsx global>{`
          .collapsible-chevron {
            transition: transform 0.2s ease-in-out;
          }
          [data-state="open"] .collapsible-chevron {
            transform: rotate(180deg);
          }
        `}</style>
      </Dialog>
    </section>
  );
};

export default AdvertisingPriceLIst;
