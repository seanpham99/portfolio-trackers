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
import { Lock, ArrowRight, Loader2, Check, AlertCircle } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { type ActionFunctionArgs, redirect, useFetcher } from "react-router";
import { useMemo, useEffect } from "react";
import { toast } from "sonner";

const PASSWORD_MIN_LENGTH = 8;

const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(
        PASSWORD_MIN_LENGTH,
        `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

function validatePasswordStrength(password: string) {
  const checks = {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };
  const strength = Object.values(checks).filter(Boolean).length;
  return { checks, strength };
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { supabase, headers } = createClient(request);
  const formData = await request.formData();
  const password = formData.get("password") as string;

  if (!password) {
    return { error: "Password is required" };
  }

  const { error } = await supabase.auth.updateUser({ password: password });

  if (error) {
    return {
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }

  // Redirect to protected page after successful password update
  return redirect("/protected", { headers });
};

export default function UpdatePassword() {
  const fetcher = useFetcher<typeof action>();
  const prefersReducedMotion = useReducedMotion();

  const form = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onBlur",
  });

  const password = form.watch("password");
  const passwordValidation = useMemo(
    () => validatePasswordStrength(password || ""),
    [password],
  );

  const serverError = fetcher.data?.error;
  const loading = fetcher.state === "submitting";

  useEffect(() => {
    if (serverError) {
      toast.error("Failed to update password", {
        description: serverError,
      });
    }
  }, [serverError]);

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
        <CardHeader className="space-y-1 pb-6 pt-8 text-center">
          <CardTitle className="font-serif text-2xl font-light text-foreground tracking-tight">
            Reset your password
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8 px-8">
          <fetcher.Form
            method="post"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit((data) => {
                const formData = new FormData();
                formData.set("password", data.password);
                fetcher.submit(formData, { method: "post" });
              })(e);
            }}
            className="space-y-4"
          >
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor="new-password"
                    className="text-muted-foreground font-normal"
                  >
                    New Password
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      {...field}
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      aria-invalid={fieldState.invalid}
                      aria-describedby="password-requirements"
                      className="pl-10 h-11 border-border bg-overlay-light text-foreground placeholder:text-muted-foreground focus:bg-surface-elevated focus:border-emerald-500/50"
                    />
                    <Lock
                      className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none"
                      aria-hidden="true"
                    />
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                  {password && (
                    <div id="password-requirements" className="space-y-2 pt-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-colors ${passwordValidation.strength >= level ? (level <= 2 ? "bg-amber-500" : "bg-emerald-500") : "bg-border"}`}
                          />
                        ))}
                      </div>
                      <ul className="text-xs space-y-1">
                        <li
                          className={`flex items-center gap-1.5 ${passwordValidation.checks.minLength ? "text-emerald-400" : "text-muted-foreground"}`}
                        >
                          {passwordValidation.checks.minLength ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          At least {PASSWORD_MIN_LENGTH} characters
                        </li>
                        <li
                          className={`flex items-center gap-1.5 ${passwordValidation.checks.hasUppercase && passwordValidation.checks.hasLowercase ? "text-emerald-400" : "text-muted-foreground"}`}
                        >
                          {passwordValidation.checks.hasUppercase &&
                          passwordValidation.checks.hasLowercase ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          Upper & lowercase letters
                        </li>
                        <li
                          className={`flex items-center gap-1.5 ${passwordValidation.checks.hasNumber ? "text-emerald-400" : "text-muted-foreground"}`}
                        >
                          {passwordValidation.checks.hasNumber ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          At least one number
                        </li>
                      </ul>
                    </div>
                  )}
                </Field>
              )}
            />

            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor="confirm-password"
                    className="text-muted-foreground font-normal"
                  >
                    Confirm Password
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      {...field}
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      aria-invalid={fieldState.invalid}
                      className="pl-10 h-11 border-border bg-overlay-light text-foreground placeholder:text-muted-foreground focus:bg-surface-elevated focus:border-emerald-500/50"
                    />
                    <Lock
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
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <span className="flex items-center justify-center">
                  Save New Password{" "}
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </span>
              )}
            </Button>
          </fetcher.Form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
