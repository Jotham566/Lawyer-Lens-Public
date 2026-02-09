"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  Users,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Rocket,
  Mail,
} from "lucide-react";

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
import { useAuth, useRequireAuth } from "@/components/providers";
import {
  createOrganization,
  listOrganizations,
  type Organization,
} from "@/lib/api/organizations";
import { APIError } from "@/lib/api/client";
import { AlertBanner, PageLoading } from "@/components/common";

// Form validation schema
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

type OnboardingStep = "choice" | "create" | "join" | "complete";

export default function OnboardingPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useRequireAuth();
  const { isAuthenticated, user } = useAuth();

  const [step, setStep] = useState<OnboardingStep>("choice");
  const [existingOrgs, setExistingOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createdOrg, setCreatedOrg] = useState<Organization | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrgFormData>({
    resolver: zodResolver(createOrgSchema),
  });

  const orgName = watch("name");

  // Auto-generate slug from name
  useEffect(() => {
    if (orgName) {
      const slug = orgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setValue("slug", slug);
    }
  }, [orgName, setValue]);

  // Check if user already has organizations
  useEffect(() => {
    async function checkOrganizations() {
      if (!isAuthenticated) return;

      try {
        const response = await listOrganizations();
        setExistingOrgs(response.items);

        // If user already has organizations, redirect to dashboard
        if (response.items.length > 0) {
          router.replace("/dashboard");
          return;
        }
      } catch (err) {
        console.error("Failed to check organizations:", err);
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      checkOrganizations();
    }
  }, [isAuthenticated, router]);

  const onCreateOrg = async (data: CreateOrgFormData) => {
    if (!isAuthenticated) return;

    setError(null);

    try {
      const org = await createOrganization({
        name: data.name,
        slug: data.slug,
        description: data.description,
      });
      setCreatedOrg(org);
      setStep("complete");
    } catch (err) {
      if (err instanceof APIError) {
        if (err.message?.includes("slug")) {
          setError("This organization ID is already taken. Please choose another.");
        } else {
          setError(err.message || "Failed to create organization");
        }
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  const handleContinueToDashboard = () => {
    router.push("/dashboard");
  };

  const handleSkip = () => {
    // Skip creates a personal workspace automatically in the backend
    router.push("/dashboard");
  };

  if (authLoading || loading) {
    return <PageLoading message="Loading..." />;
  }

  // If user already has orgs, show loading while redirecting
  if (existingOrgs.length > 0) {
    return <PageLoading message="Redirecting to dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Rocket className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome to Legal Intelligence
          </h1>
          <p className="text-muted-foreground mt-2">
            {user?.full_name && `Hi ${user.full_name.split(" ")[0]}! `}
            Let&apos;s get you set up.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className={`w-3 h-3 rounded-full ${
              step === "choice" ? "bg-primary" : "bg-primary/30"
            }`}
          />
          <div
            className={`w-3 h-3 rounded-full ${
              step === "create" || step === "join" ? "bg-primary" : "bg-primary/30"
            }`}
          />
          <div
            className={`w-3 h-3 rounded-full ${
              step === "complete" ? "bg-primary" : "bg-primary/30"
            }`}
          />
        </div>

        {error && (
          <AlertBanner
            variant="error"
            message={error}
            onDismiss={() => setError(null)}
            className="mb-6"
          />
        )}

        {/* Step: Choice */}
        {step === "choice" && (
          <div className="space-y-4">
            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setStep("create")}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex-shrink-0 p-3 rounded-lg bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Create an Organization</h3>
                  <p className="text-sm text-muted-foreground">
                    Start fresh with your own organization for your team or practice
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setStep("join")}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex-shrink-0 p-3 rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Join an Organization</h3>
                  <p className="text-sm text-muted-foreground">
                    Accept an invitation to join an existing team
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>

            <div className="text-center pt-4">
              <Button variant="ghost" onClick={handleSkip}>
                Skip for now
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                You can create or join an organization later from settings
              </p>
            </div>
          </div>
        )}

        {/* Step: Create Organization */}
        {step === "create" && (
          <Card>
            <CardHeader>
              <CardTitle>Create Your Organization</CardTitle>
              <CardDescription>
                Set up your organization to start collaborating with your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onCreateOrg)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Kampala Law Firm"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Organization ID</Label>
                  <Input
                    id="slug"
                    placeholder="e.g., kampala-law-firm"
                    {...register("slug")}
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be used in URLs and cannot be changed later
                  </p>
                  {errors.slug && (
                    <p className="text-sm text-destructive">{errors.slug.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of your organization"
                    {...register("description")}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("choice")}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
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
        )}

        {/* Step: Join Organization */}
        {step === "join" && (
          <Card>
            <CardHeader>
              <CardTitle>Join an Organization</CardTitle>
              <CardDescription>
                To join an existing organization, you need an invitation from a team administrator
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium">How it works:</h4>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Ask your organization admin to send you an invitation</li>
                  <li>Check your email for the invitation link</li>
                  <li>Click the link to accept and join the organization</li>
                </ol>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Check your inbox</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      If you&apos;ve already been invited, look for an email from{" "}
                      <span className="font-medium">Legal Intelligence</span> with the subject
                      &quot;You&apos;re invited to join...&quot;
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("choice")}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="default"
                  className="flex-1"
                  onClick={handleSkip}
                >
                  Continue to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Complete */}
        {step === "complete" && createdOrg && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">You&apos;re All Set!</h2>
                  <p className="text-muted-foreground mt-2">
                    <strong>{createdOrg.name}</strong> has been created successfully.
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-left">
                  <h3 className="font-medium mb-2">What&apos;s next?</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Explore legal research with AI assistance
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Invite team members to collaborate
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Access thousands of Ugandan legal documents
                    </li>
                  </ul>
                </div>
                <Button
                  onClick={handleContinueToDashboard}
                  size="lg"
                  className="w-full"
                >
                  Go to Dashboard
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
