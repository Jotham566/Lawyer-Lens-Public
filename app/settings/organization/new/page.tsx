"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertBanner, PageHeader, PageLoading } from "@/components/common";
import { useAuth, useRequireAuth } from "@/components/providers";
import { createOrganization } from "@/lib/api/organizations";
import { getUserFriendlyError } from "@/lib/api/client";

const createOrgSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().max(500).optional(),
});

type CreateOrgFormData = z.infer<typeof createOrgSchema>;

export default function NewOrganizationPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useRequireAuth();
  const { isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrgFormData>({
    resolver: zodResolver(createOrgSchema),
  });

  const orgName = useWatch({ control, name: "name" });

  useEffect(() => {
    if (!orgName) return;
    const slug = orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setValue("slug", slug);
  }, [orgName, setValue]);

  const onSubmit = async (data: CreateOrgFormData) => {
    if (!isAuthenticated) return;
    setError(null);
    setSuccess(null);
    try {
      await createOrganization({
        name: data.name,
        slug: data.slug,
        description: data.description,
      });
      setSuccess("Organization created successfully.");
      router.push("/settings/organization");
    } catch (err) {
      setError(getUserFriendlyError(err, "Failed to create organization"));
    }
  };

  if (authLoading) {
    return <PageLoading message="Loading..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/settings/organization" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to organization settings
        </Link>
      </div>

      <PageHeader
        title="Create Organization"
        description="Set up a new organization workspace for your team."
      />

      {error && <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />}
      {success && <AlertBanner variant="success" message={success} onDismiss={() => setSuccess(null)} />}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            New Organization
          </CardTitle>
          <CardDescription>
            Use a unique organization ID. This cannot be changed later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input id="name" placeholder="e.g., Kampala Law Firm" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Organization ID</Label>
              <Input id="slug" placeholder="e.g., kampala-law-firm" {...register("slug")} />
              {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea id="description" placeholder="Brief description of your organization" {...register("description")} />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.push("/settings/organization")}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Organization"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
