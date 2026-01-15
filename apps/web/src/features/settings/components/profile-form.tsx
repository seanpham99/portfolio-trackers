"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@workspace/ui/components/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

const profileFormSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      email: "",
      full_name: "",
    },
  });

  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        form.reset({
          email: user.email || "",
          full_name: user.user_metadata?.full_name || "",
        });
      }
      setIsFetching(false);
    }

    fetchUser();
  }, [form]);

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true);
    const supabase = createClient();

    // Update basic user metadata
    const { error } = await supabase.auth.updateUser({
      data: { full_name: data.full_name },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Profile updated successfully");
    }

    setIsLoading(false);
  }

  if (isFetching) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-full animate-pulse rounded-md bg-zinc-900" />
        <div className="h-10 w-full animate-pulse rounded-md bg-zinc-900" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email@example.com" {...field} disabled />
              </FormControl>
              <FormDescription>Your email address cannot be changed here.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormDescription>This is your public display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update profile
        </Button>
      </form>
    </Form>
  );
}
