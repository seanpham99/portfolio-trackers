"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Field, FieldLabel, FieldError } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";

const formSchema = z.object({
  name: z.string().min(1, "Portfolio name is required"),
  description: z.string().optional(),
  baseCurrency: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreatePortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const currencies = [
  { value: "USD", label: "USD ($)" },
  { value: "VND", label: "VND (₫)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "JPY", label: "JPY (¥)" },
];

export function CreatePortfolioModal({ isOpen, onClose }: CreatePortfolioModalProps) {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      baseCurrency: "USD",
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: "",
        description: "",
        baseCurrency: "USD",
      });
      setError(null);
    }
  }, [isOpen, form]);

  const onSubmit = async (values: FormValues) => {
    setError(null);

    try {
      const response = await apiFetch("/portfolios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          description: values.description?.trim() || undefined,
          base_currency: values.baseCurrency,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create portfolio");
      }

      const portfolio = await response.json();

      // Invalidate portfolios query to refetch
      await queryClient.invalidateQueries({ queryKey: ["portfolios"] });

      onClose();
      router.push(`/portfolio/${portfolio.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-white/[0.08] text-white">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-light">Create Portfolio</DialogTitle>
          <DialogDescription className="text-zinc-500">
            Start tracking your investments by creating a new portfolio.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-4 py-2 text-sm text-rose-400">
              {error}
            </div>
          )}

          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name} className="text-zinc-400 font-normal">
                  Portfolio Name
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="e.g., Retirement Fund"
                  className="bg-white/[0.03] border-white/[0.08] focus-visible:ring-emerald-500/50"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="description"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name} className="text-zinc-400 font-normal">
                  Description (Optional)
                </FieldLabel>
                <Textarea
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="Add notes about this portfolio..."
                  className="resize-none bg-white/[0.03] border-white/[0.08] focus-visible:ring-emerald-500/50"
                  rows={3}
                  value={field.value || ""}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="baseCurrency"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name} className="text-zinc-400 font-normal">
                  Base Currency
                </FieldLabel>
                <Select name={field.name} value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    className="bg-white/[0.03] border-white/[0.08] focus:ring-emerald-500/50"
                  >
                    <SelectValue placeholder="Select a currency" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/[0.08] text-white">
                    {currencies.map((currency) => (
                      <SelectItem
                        key={currency.value}
                        value={currency.value}
                        className="focus:bg-white/[0.08] focus:text-white cursor-pointer"
                      >
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-zinc-400 hover:text-white hover:bg-white/[0.05]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="bg-emerald-600 text-white hover:bg-emerald-500 min-w-[100px]"
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Portfolio"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
