"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DialogClose } from "@radix-ui/react-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, Eye, EyeOff, XIcon } from "lucide-react";
import { useSignIn } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import EmailResetPasswordSheet from "./(password-reset)/EmailResetPasswordSheet";

interface Prop {
  className?: string;
  children: React.ReactNode;
}

export const LoginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be under 100 characters"),
});

type FormData = z.infer<typeof LoginSchema>;

const LoginFormSheet = ({ className, children }: Prop) => {
  const router = useRouter();
  const [loading, setLoader] = useState(false);
  const [error, setError] = useState<any>(null);
  const [open, setOpen] = React.useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { signIn } = useSignIn();

  // 1. Define your form.
  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { handleSubmit } = form;

  const onSubmit = async (data: FormData) => {
    // console.log("login form data", data);
    const { email, password } = data;

    setError(null);
    setLoader(true);

    try {
      if (signIn) {
        await signIn.create({ identifier: email, password });
        setOpen(false);
        window.location.href = "/";
      } else {
        throw new Error("SignIn instance is undefined.");
      }
    } catch (error: any) {
      setError(error.errors[0]?.message || "Login failed");
    } finally {
      setLoader(false);
    }
  };

  const onForgotPassword = () => {
    // 1. close current dialog
    // setOpen(false);

    // 2. open forgot password reset form

    console.log("on forgot password handler");
  };

  const onSignup = () => {
    // 1. close current dialog
    setOpen(false);
    // 2. redirect user to signup page
    router.push("/private-escort-record");
  };
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogOverlay className="bg-white/80" />

        <DialogTrigger>{children}</DialogTrigger>
        <DialogContent
          onInteractOutside={(event: any) => event.preventDefault()}
          className=" border-0 border-green-600 top-[40%]  "
        >
          <DialogClose asChild>
            <button className="absolute -top-6 right-4 p-2 rounded-sm overflow-hidden cursor-pointer z-20 bg-primary text-white">
              <XIcon className="size-8" />
            </button>
          </DialogClose>

          <DialogHeader>
            <DialogTitle className="text-center text-xl text-primary uppercase">
              log
            </DialogTitle>
            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex mt-4 mb-7 w-full flex-col md:flex-row items-center gap-3">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="w-full  lg:w-1/2 border-none">
                        <FormControl className="w-full rounded-lg border border-gray-1/20 text-gray-1">
                          <div className="flex px-3 w-full items-center  text-gray-1/60">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="size-5"
                            >
                              <path
                                fillRule="evenodd"
                                d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                                clipRule="evenodd"
                              />
                            </svg>

                            <Input
                              placeholder="Email"
                              {...field}
                              type="email"
                              className="bg-white  flex-1 flex border-0 text-black  h-14  focus-visible:ring-0 "
                            />
                          </div>
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="w-full  lg:w-1/2 border-none">
                        <FormControl className="w-full rounded-lg border border-gray-1/20 text-gray-1">
                          <div className="flex px-3 w-full items-center  text-gray-1/60">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="size-5"
                            >
                              <path
                                fillRule="evenodd"
                                d="M15.75 1.5a6.75 6.75 0 0 0-6.651 7.906c.067.39-.032.717-.221.906l-6.5 6.499a3 3 0 0 0-.878 2.121v2.818c0 .414.336.75.75.75H6a.75.75 0 0 0 .75-.75v-1.5h1.5A.75.75 0 0 0 9 19.5V18h1.5a.75.75 0 0 0 .53-.22l2.658-2.658c.19-.189.517-.288.906-.22A6.75 6.75 0 1 0 15.75 1.5Zm0 3a.75.75 0 0 0 0 1.5A2.25 2.25 0 0 1 18 8.25a.75.75 0 0 0 1.5 0 3.75 3.75 0 0 0-3.75-3.75Z"
                                clipRule="evenodd"
                              />
                            </svg>

                            <Input
                              placeholder="Password"
                              {...field}
                              type={showPassword ? "text" : "password"}
                              className="bg-white flex-1 flex border-0 text-black  h-14  focus-visible:ring-0 "
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((prev) => !prev)}
                              className="ml-1 cursor-pointer text-gray-1/60 hover:text-black transition-colors"
                              aria-label={
                                showPassword ? "Hide password" : "Show password"
                              }
                              aria-pressed={showPassword}
                            >
                              {showPassword ? (
                                <EyeOff className="size-5" />
                              ) : (
                                <Eye className="size-5" />
                              )}
                            </button>
                          </div>
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* forgot password */}
                <div className="flex justify-end">
                  <EmailResetPasswordSheet>
                    <span
                      onClick={onForgotPassword}
                      className="text-base text-gray-1/70 decoration-gray-1/70 hover:text-black   underline font-semibold cursor-pointer "
                    >
                      Forgot your password?
                    </span>
                  </EmailResetPasswordSheet>
                </div>

                {error && (
                  <p className="font-semibold my-3 text-sm md:text-base text-primary text-center">
                    {error}
                  </p>
                )}
                {/* submit button */}
                {/* <Button className="flex w-full mt-4 cursor-pointer bg-primary text-xl h-16 font-bold uppercase text-white  justify-center items-center gap-3">
                <span>{loading ? "Processing..." : "enrol"}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.72 7.72a.75.75 0 0 1 1.06 0l3.75 3.75a.75.75 0 0 1 0 1.06l-3.75 3.75a.75.75 0 1 1-1.06-1.06l2.47-2.47H3a.75.75 0 0 1 0-1.5h16.19l-2.47-2.47a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </Button> */}
                <Button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "flex w-full mt-4 h-16 text-xl font-bold uppercase justify-center items-center gap-3 transition-colors duration-300",
                    loading
                      ? "bg-primary/60 cursor-not-allowed"
                      : "bg-primary hover:bg-primary/80 cursor-pointer text-white",
                  )}
                >
                  <span>{loading ? "Processing..." : "LOg in"}</span>
                  {!loading && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="size-7"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.72 7.72a.75.75 0 0 1 1.06 0l3.75 3.75a.75.75 0 0 1 0 1.06l-3.75 3.75a.75.75 0 1 1-1.06-1.06l2.47-2.47H3a.75.75 0 0 1 0-1.5h16.19l-2.47-2.47a.75.75 0 0 1 0-1.06Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </Button>
                <p className="my-5 text-sm lg:text-base text-center mx-5 font-semibold text-black ">
                  Don't have an account? Click on{" "}
                  <span
                    onClick={onSignup}
                    className="cursor-pointer text-primary"
                  >
                    Sign Up Now!
                  </span>{" "}
                  and you can start enjoying all the benefits!
                </p>
              </form>
            </Form>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LoginFormSheet;
