import { createClient } from "@/lib/supabase/server";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Field, FieldLabel, FieldError } from "@workspace/ui/components/field";
import { motion, useReducedMotion } from "framer-motion";
import { Mail, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  type ActionFunctionArgs,
  Link,
  data,
  redirect,
  useFetcher,
  useSearchParams,
} from "react-router";
import { useEffect } from "react";
import { toast } from "sonner";

const forgotPasswordSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;

  const { supabase, headers } = createClient(request);
  const origin = new URL(request.url).origin;

  // Send the actual reset password email
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/update-password`,
  });

  if (error) {
    return data(
      {
        error: error instanceof Error ? error.message : "An error occurred",
        data: { email },
      },
      { headers },
    );
  }

  return redirect("/forgot-password?success");
};

export default function ForgotPassword() {
  const fetcher = useFetcher<typeof action>();
  const [searchParams] = useSearchParams();
  const prefersReducedMotion = useReducedMotion();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onBlur",
  });

  const success = searchParams.has("success");
  const serverError = fetcher.data?.error;
  const loading = fetcher.state === "submitting";

  useEffect(() => {
    if (serverError) {
      toast.error("Failed to send reset email", {
        description: serverError,
      });
    }
  }, [serverError]);

  useEffect(() => {
    if (success) {
      toast.success("Reset email sent", {
        description: "Please check your email for password reset instructions.",
      });
    }
  }, [success]);

  const cardVariants = prefersReducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
      };

  return (
    <motion.div
      {...cardVariants}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { duration: 0.4, ease: "easeOut" }
      }
      className="w-full"
    >
      <Card className="glass-card overflow-hidden">
        {success ? (
          <div
            className="flex flex-col items-center justify-center p-8 text-center"
            role="status"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/20">
              <CheckCircle2
                className="h-8 w-8 text-emerald-400"
                aria-hidden="true"
              />
            </div>
            <CardHeader className="p-0 mb-4">
              <CardTitle className="font-serif text-2xl font-light text-foreground tracking-tight">
                Check your email
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Password reset instructions sent
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
                If you registered using your email and password, you will
                receive a password reset email.
              </p>
              <Link to="/login">
                <Button
                  variant="outline"
                  className="border-border hover:bg-overlay-light hover:text-foreground"
                >
                  Return to Login
                </Button>
              </Link>
            </CardContent>
          </div>
        ) : (
          <>
            <CardHeader className="space-y-1 pb-6 pt-8 text-center">
              <CardTitle className="font-serif text-2xl font-light text-foreground tracking-tight">
                Reset your password
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Enter your email to receive reset instructions
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8 px-8">
              <fetcher.Form
                method="post"
                onSubmit={(e) => {
                  e.preventDefault();
                  form.handleSubmit((data) => {
                    const formData = new FormData();
                    formData.set("email", data.email);
                    fetcher.submit(formData, { method: "post" });
                  })(e);
                }}
                className="space-y-4"
              >
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel
                        htmlFor="forgot-email"
                        className="text-muted-foreground font-normal"
                      >
                        Email
                      </FieldLabel>
                      <div className="relative">
                        <Input
                          {...field}
                          id="forgot-email"
                          type="email"
                          placeholder="name@example.com"
                          autoComplete="email"
                          aria-invalid={fieldState.invalid}
                          className="pl-10 h-11 border-border bg-overlay-light text-foreground placeholder:text-muted-foreground focus:bg-surface-elevated focus:border-emerald-500/50"
                        />
                        <Mail
                          className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none"
                          aria-hidden="true"
                        />
                      </div>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {serverError && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="rounded-md bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-sm text-rose-400"
                  >
                    {serverError}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-900/20 mt-2"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <span className="flex items-center justify-center">
                      Send Reset Email{" "}
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </span>
                  )}
                </Button>
              </fetcher.Form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link
                  to="/login"
                  className="text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Sign in
                </Link>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </motion.div>
  );
}
