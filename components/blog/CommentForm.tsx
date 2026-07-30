"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";

export const commentFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be under 100 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  content: z
    .string()
    .min(3, "Comment must be at least 3 characters")
    .max(1000, "Comment must be under 1000 characters"),
});

export type CommentFormData = z.infer<typeof commentFormSchema>;

interface Prop {
  postSlug: string;
  className?: string;
}

const CommentForm = ({ postSlug, className }: Prop) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { user } = useUser();

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      name: user?.fullName || "",
      email: user?.primaryEmailAddress?.emailAddress || "",
      content: "",
    },
  });

  async function onSubmit(values: CommentFormData) {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/blog-comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postSlug,
          ...values,
          clerkUserId: user?.id,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to submit comment");
        return;
      }

      setSuccess("Your comment has been submitted and is awaiting review.");
      form.reset();
    } catch (err: any) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={cn("w-full", className)}>
      {success && (
        <p className="p-4 bg-green-100 text-green-800 text-lg rounded-md mb-4">
          {success}
        </p>
      )}

      {!success && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Your name*"
                        type="text"
                        {...field}
                        className="border-0 text-black/70 outline-0 rounded-none placeholder-opacity-90 text-xl   h-15 bg-white"
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
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Your email*"
                        type="email"
                        {...field}
                        className="border-0 text-black/70 outline-0 rounded-none placeholder-opacity-90 text-xl   h-15 bg-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Write your comment..."
                      {...field}
                      // className="border-2 placeholder-opacity-90 text-xl text-white border-white h-14 bg-gray-1"
                      className="border-0 text-black/70 outline-0 rounded-none placeholder-opacity-90 text-xl min-h-32 bg-white"

                      // className="border-2 placeholder-white placeholder-opacity-90 text-xl text-white border-white min-h-32 bg-gray-1"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <p className="p-4 bg-red-100 text-red-600 text-lg rounded-md">
                {error}
              </p>
            )}

            <div className="flex justify-center lg:justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "bg-primary hover:bg-primary/80 cursor-pointer p-7 px-8 rounded-none text-lg font-semibold",
                )}
              >
                {isSubmitting ? "Submitting..." : "Post Comment"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};

export default CommentForm;
