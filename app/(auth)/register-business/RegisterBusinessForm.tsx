"use client";
import SectionCard from "@/components/SectionCard";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useSignUp } from "@clerk/nextjs";
import { Eye, EyeOff } from "lucide-react";
import { sendRegistrationEmails } from "@/server-actions/email";
import Link from "next/link";

interface Prop {
  className?: String;
}

const items = [
  {
    id: "terms",
    label: "Terms",
  },
] as const;
export const registrationSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters long")
      .max(30, "Username must be at most 30 characters long"),

    email: z.string().email("Invalid email address"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character",
      ),

    confirmPassword: z.string(),

    agreeTerms: z.literal(true, {
      error: "You must accept the terms and condition",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

const RegisterBusinessForm = ({ className }: Prop) => {
  const router = useRouter();

  const [loading, setLoader] = useState(false);
  const [error, setError] = useState<any>(null);
  const [message, setMessage] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 1. Define your form.
  const form = useForm<z.infer<typeof registrationSchema>>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      // agreeTerms:false
      //   terms: false,
    },
  });

  const { isLoaded, signUp, setActive } = useSignUp();

  // 2. Define a submit handler.
  // TODO:// HANDLE ESCORT REGISRATION
  async function onSubmit(values: z.infer<typeof registrationSchema>) {
    setError(null);

    const { email, password, username } = values;

    if (!isLoaded || !signUp) {
      setError(
        "Sign up is not available at the moment. Please try again later.",
      );
      return;
    }

    setLoader(true);

    try {
      // 1. Create user
      const result = await signUp.create({
        emailAddress: email,
        password,
        username,
        unsafeMetadata: { role: "business" },
      });

      // 2. Save User to DB

      // 3. Auto-Sign User In

      // Check if sign-up is complete
      if (result.status === "complete") {
        // save user to DB
        // const escort = await createEscort({
        //   clerkUserId: result.id,
        //   email: email,
        //   username: username,
        // });
        const escort = {};
        console.log("escort created", escort);

        const clerkUserId = result.id;
        const sessionId = result.createdSessionId;

        if (!clerkUserId || !sessionId) {
          throw new Error("Unable to complete sign up at this time.");
        }

        // Set the session as active
        await setActive({ session: sessionId });

        // Send welcome and admin emails (server action)
        await sendRegistrationEmails({
          email,
          name: username,
          clerkUserId,
          role: "business",
        });

        // Show success message
        setMessage(
          "Account created successfully! Redirecting to your profile...",
        );

        // Delay redirect (2–3 seconds)
        setTimeout(() => {
          router.push("/administration");
        }, 5000);
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || "Sign up failed");
      console.error(err);
    } finally {
      setLoader(false);
    }
  }

  return (
    <div className={cn("", className)}>
      <SectionCard>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <h3 className="text-2xl font-semibold text-white mb-8">
              Agency Registration - Enter your login details
            </h3>
            {/* section 1 */}
            <div className="flex flex-col lg:flex-row gap-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem className="w-full lg:w-1/2 border-none">
                    <FormLabel className=" font-semibold mb-2 text-white/40 text-base">
                      Username *
                    </FormLabel>
                    <FormControl className="">
                      <Input
                        placeholder=""
                        {...field}
                        className="bg-white text-black px-6 h-14 text-2xl focus-visible:ring-0 "
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="w-full lg:w-1/2 border-none">
                    <FormLabel className=" font-semibold mb-2 text-white/40 text-base">
                      Login email *
                    </FormLabel>
                    <FormControl className="">
                      <Input
                        placeholder=""
                        {...field}
                        className="bg-white text-black px-6 h-14 text-2xl focus-visible:ring-0 "
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* section 2 */}
            <div className="flex  flex-col lg:flex-row gap-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="w-full lg:w-1/2 border-none">
                    <FormLabel className=" font-semibold mb-2 text-white/40 text-base">
                      Password *
                    </FormLabel>
                    <FormControl className="">
                      <div className="relative">
                        <Input
                          placeholder=""
                          {...field}
                          type={showPassword ? "text" : "password"}
                          className="bg-white text-black px-6 pr-14 h-14 text-2xl focus-visible:ring-0 "
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-black/50 hover:text-black transition-colors"
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          aria-pressed={showPassword}
                        >
                          {showPassword ? (
                            <EyeOff className="size-6" />
                          ) : (
                            <Eye className="size-6" />
                          )}
                        </button>
                      </div>
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="w-full lg:w-1/2 border-none">
                    <FormLabel className=" font-semibold mb-2 text-white/40 text-base">
                      Password again *
                    </FormLabel>
                    <FormControl className="">
                      <div className="relative">
                        <Input
                          placeholder=""
                          {...field}
                          type={showConfirmPassword ? "text" : "password"}
                          className="bg-white text-black px-6 pr-14 h-14 text-2xl focus-visible:ring-0 "
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword((prev) => !prev)
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-black/50 hover:text-black transition-colors"
                          aria-label={
                            showConfirmPassword
                              ? "Hide password"
                              : "Show password"
                          }
                          aria-pressed={showConfirmPassword}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="size-6" />
                          ) : (
                            <Eye className="size-6" />
                          )}
                        </button>
                      </div>
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* section 3 */}

            <div>
              <FormField
                control={form.control}
                name="agreeTerms"
                render={({ field }) => (
                  <FormItem className="w-full  border-none">
                    {/* <FormLabel className=" font-semibold mb-2 text-white/40 text-base">
                      Password *
                    </FormLabel> */}
                    <FormControl className=" w-full">
                      <div className="flex flex-row mt-6 mb-12  items-center gap-3">
                        <Checkbox
                          className="bg-white size-6"
                          //   id="terms"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="acceptTerms"
                        />
                        <Label
                          htmlFor="terms"
                          className="text-white/50 text-wrap text-lg font-normal"
                        >
                          <p className="">
                            {" "}
                            I agree to the{" "}
                            <Link href='/privacy-policy' className="text-primary">
                              processing of personal data
                            </Link>{" "}
                            and to the{" "}
                            <Link href='/terms' className="text-primary">
                              terms and conditions.
                            </Link>
                          </p>
                        </Label>
                      </div>
                    </FormControl>

                    <FormMessage className="-mt-6" />
                  </FormItem>
                )}
              />
            </div>

            {error && (
              <p className=" bg-primary text-center p-3 my-3 mb-6 text-lg">
                {error}
              </p>
            )}

            {message && (
              <p className=" bg-primary text-white p-3 my-3 mb-6 text-lg">
                {message} ...
              </p>
            )}
            {/* <Button
              type="submit"
              className="w-full cursor-pointer hover:bg-primary/70 h-16 text-lg py-4 bg-primary font-semibold text-white uppercase"
            >
              complete registration
            </Button> */}
            {/* Clerk's CAPTCHA widget */}
            <div id="clerk-captcha" />
            <Button
              type="submit"
              disabled={loading}
              className={`w-full h-16 text-lg py-4 font-semibold uppercase text-white ${
                loading
                  ? "bg-primary/50 cursor-not-allowed"
                  : "bg-primary hover:bg-primary/70 cursor-pointer"
              }`}
            >
              {loading ? "Processing..." : "Complete Registration"}
            </Button>
          </form>
        </Form>
      </SectionCard>
    </div>
  );
};

export default RegisterBusinessForm;
