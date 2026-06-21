"use client";
import React, {useState} from "react";
import {Form, FormControl, FormField, FormItem, FormMessage,} from "@/components/ui/form";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {cn} from "@/lib/utils";
import {useUser} from "@clerk/nextjs";

export const contactFormSchema = z.object({
    email: z.string().min(1, "Email is required").email("Invalid email format"),
    name: z
        .string()
        .min(1, "Name is required")
        .max(100, "Name must be under 100 characters"),
    message: z
        .string()
        .min(10, "Message must be at least 10 characters")
        .max(1000, "Message must be under 1000 characters"),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

const ContactForm = () => {
    const [loading, setLoader] = useState(false);
    const [error, setError] = useState<any>(null);
    const [message, setMessage] = useState<any>(null);

    // 1. Define your form.
    const form = useForm<z.infer<typeof contactFormSchema>>({
        resolver: zodResolver(contactFormSchema),
        defaultValues: {
            email: "",
            name: "",
            message: "",
        },
    });

    const {isSubmitting} = form.formState;

    const {user} = useUser();

    async function onSubmit(values: z.infer<typeof contactFormSchema>) {
        // Do something with the form values.
        // ✅ This will be type-safe and validated.
        console.log(values);

        setError(null);
        setMessage(null);
        const {email, message, name} = values;

        try {
            const formData = {
                email,
                message,
                name,
            };
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    clerkUserId: user?.id, // optional: if using Clerk
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                console.error("Submission failed:", result.error);
                setError("Submission Failed");
                // Show toast or error message
                return;
            }

            setMessage("Message sent successfully . You will be contacted shortly ");
        } catch (err: any) {
            setError(err.errors[0]?.message || "Error sending message");
            console.log(err);
        } finally {
            setLoader(false);
        }

        // upon successful registration user should be redirected to /new profile
        // router.push("/new-profile");
    }

    return (
        <div className="w-full my-12">
            <Form {...form}>
                {message && (
                    <p className="p-6 py-8 bg-green-100 text-green-800 text-lg">
                        {message}
                    </p>
                )}

                {!message && (
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({field}) => (
                                <FormItem className="w-full  border-none">
                                    <FormControl className="">
                                        <Input
                                            placeholder="Name"
                                            type="text"
                                            {...field}
                                            className="border-2 placeholder-white text-xl text-white border-white h-14 bg-gray-1 "
                                        />
                                    </FormControl>

                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({field}) => (
                                <FormItem className="w-full  border-none">
                                    <FormControl className="">
                                        <Input
                                            placeholder="Email"
                                            type="email"
                                            {...field}
                                            className="border-2 text-xl text-white border-white h-14 bg-gray-1 "
                                        />
                                    </FormControl>

                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="message"
                            render={({field}) => (
                                <FormItem className="w-full  border-none">
                                    <FormControl className="">
                                        <Textarea
                                            // rows={12}
                                            placeholder="Message - If you have any question about advertising, always state the number under which you are advertising"
                                            {...field}
                                            className="border-2 text-xl text-white border-white min-h-32 bg-gray-1 "
                                        />
                                    </FormControl>

                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        {error && (
                            <p className="p-6 bg-red-100 text-red-600 text-lg">{error}</p>
                        )}
                        <Button
                            type="submit"
                            className={cn(
                                "bg-gray-1 hover:bg-gray-1/70 cursor-pointer p-8 px-16 rounded-md inline-flex text-2xl font-semibold items-center justify-center w-full md:w-auto"
                            )}
                        >
                            {isSubmitting ? "Submitting..." : "Send"}
                        </Button>
                    </form>
                )}
            </Form>
        </div>
    );
};

export default ContactForm;
