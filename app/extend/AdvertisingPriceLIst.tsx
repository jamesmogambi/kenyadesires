"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import React from "react";
import { initiateSTKPush } from "@/lib/mpesa";
import { AD_PACKAGES } from "@/lib/constants/packages";
import { purchaseAdPackage } from "@/server-actions/payment.action";
import Link from "next/link";

interface Prop {
  className?: string;
  onPurchaseSuccess?: () => void;
  userCredits?: number;
}

const AdvertisingPriceLIst = ({
  className,
  onPurchaseSuccess,
  userCredits = 0,
}: Prop) => {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleBuyClick = (packageId: string) => {
    setSelectedPackage(packageId);
    setDialogOpen(true);
    setStatus("idle");
    setMessage("");
  };

  const handleUseCredits = async () => {
    if (!selectedPackage) return;
    setLoading(true);
    setMessage("");

    try {
      const result = await purchaseAdPackage(selectedPackage);
      if (result.success) {
        setStatus("success");
        setMessage("Ad package purchased successfully with credits!");
        onPurchaseSuccess?.();
        setTimeout(() => setDialogOpen(false), 1500);
      } else {
        setStatus("error");
        setMessage(result.error || "Failed to purchase package");
      }
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyWithMpesa = async () => {
    if (!selectedPackage || !phoneNumber || !termsAccepted) return;

    setLoading(true);
    setStatus("pending");
    setMessage("Initiating payment...");

    try {
      const pkg = AD_PACKAGES.find((p) => p.id === selectedPackage);
      if (!pkg) throw new Error("Package not found");

      const amount = pkg.credits * 10;

      const response = await initiateSTKPush({
        phoneNumber,
        amount,
        accountReference: `Ad-${pkg.name}`,
        transactionDesc: `Buy ${pkg.name} ad package`,
      });

      if (response.ResponseCode === "0") {
        setStatus("success");
        setMessage(
          `Payment initiated! Check your phone (${phoneNumber}) and enter PIN. After payment, ${pkg.credits} credits will be added and your ${pkg.name} package will be activated automatically.`,
        );
        onPurchaseSuccess?.();
        setTimeout(() => setDialogOpen(false), 3000);
      } else {
        setStatus("error");
        setMessage(
          response.ResponseDescription || "Failed to initiate payment",
        );
      }
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const selectedPkg = AD_PACKAGES.find((p) => p.id === selectedPackage);
  const canAffordCredits = selectedPkg
    ? userCredits >= selectedPkg.credits
    : false;

  return (
    <section className={cn("px-4", className)}>
      <div>
        <h4 className="text-2xl md:text-3xl text-center mt-6 text-red-700 font-bold">
          Ad Packages
        </h4>
        <h6 className="text-red-700 text-xl md:text-2xl font-bold text-center mt-6 md:mt-10">
          30 days of advertising = 150 credits
        </h6>
      </div>

      <div className="flex flex-col sm:flex-row mt-6 mb-10 md:mb-12 items-start sm:items-center gap-3">
        <Checkbox
          className="bg-white size-6 md:size-8 shrink-0"
          id="acceptTerms"
          checked={termsAccepted}
          onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
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
              pkg.type === "extend" ? "bg-red-700 text-white" : "bg-stone-100",
            )}
          >
            {(pkg as any).savings && (
              <div className="absolute -top-2 md:-top-3 right-2 md:right-4 bg-green-500 text-white text-xs md:text-sm font-bold px-2 md:px-3 py-1 rounded-full shadow-md">
                {(pkg as any).savings}
              </div>
            )}
            {pkg.type === "extend" && (
              <Label className="border border-primary shadow-lg mt-3 md:mt-4 mb-8 md:mb-10 bg-white text-red-800 text-lg md:text-xl p-2 font-bold rounded-2xl">
                Popular
              </Label>
            )}
            <div
              className={cn(
                "mt-6 md:mt-8",
                pkg.type === "extend" && "mt-10 md:mt-16",
              )}
            >
              <h5
                className={cn(
                  "text-4xl md:text-5xl mt-4 font-bold text-center",
                  !pkg.type === "extend" && "text-red-700",
                )}
              >
                {pkg.credits}{" "}
              </h5>
              <span
                className={cn(
                  "text-xl md:text-2xl font-extrabold",
                  !pkg.type === "extend" && "text-red-700",
                )}
              >
                Credits
              </span>
            </div>

            <div className="mt-6 md:mt-8 flex items-center justify-center flex-col gap-2 md:gap-3">
              <span
                className={cn(
                  "font-bold text-base md:text-lg text-center",
                  !pkg.type === "extend" && "text-black",
                )}
              >
                Price
              </span>
              <span
                className={cn(
                  "text-2xl md:text-3xl font-bold",
                  !pkg.type === "extend" && "text-black",
                )}
              >
                KSH {(pkg.credits * 10).toLocaleString()}
              </span>
              <span
                className={cn(
                  "text-sm md:text-base font-bold",
                  !pkg.type === "extend" && "text-black",
                )}
              >
                including VAT
              </span>
            </div>

            <Dialog
              open={dialogOpen && selectedPackage === pkg.id}
              onOpenChange={setDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  className={cn(
                    "mt-6 md:mt-8 h-10 md:h-12 w-full text-white font-semibold text-lg md:text-2xl",
                    pkg.type === "extend"
                      ? "bg-white text-red-700 hover:bg-white/90"
                      : "bg-red-800 hover:bg-red-700",
                  )}
                  onClick={() => handleBuyClick(pkg.id)}
                >
                  Buy
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Buy {pkg.name}</DialogTitle>
                  <DialogDescription>
                    {pkg.description}. This package costs {pkg.credits} credits
                    (KSH {(pkg.credits * 10).toLocaleString()}).
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="bg-stone-100 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Your Credits:{" "}
                      <span className="font-bold text-red-700">
                        {userCredits}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Required:{" "}
                      <span className="font-bold text-red-700">
                        {pkg.credits} credits
                      </span>
                    </p>
                  </div>

                  {message && (
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        status === "error" ? "text-red-600" : "text-green-600",
                      )}
                    >
                      {message}
                    </p>
                  )}

                  {status !== "success" && (
                    <div className="flex flex-col gap-3">
                      <Button
                        onClick={handleUseCredits}
                        disabled={loading || !canAffordCredits}
                        className="w-full"
                        variant={canAffordCredits ? "default" : "secondary"}
                      >
                        {loading
                          ? "Processing..."
                          : canAffordCredits
                            ? `Use ${pkg.credits} Credits`
                            : "Insufficient Credits"}
                      </Button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-2 text-gray-500">
                            Or
                          </span>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="phone">M-Pesa Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="e.g. 0712345678"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <Button
                        onClick={handleBuyWithMpesa}
                        disabled={loading || !phoneNumber || !termsAccepted}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {loading
                          ? "Processing..."
                          : `Buy ${pkg.credits} Credits + ${pkg.name} with M-Pesa`}
                      </Button>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="secondary"
                    onClick={() => setDialogOpen(false)}
                    disabled={loading && status !== "success"}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AdvertisingPriceLIst;
