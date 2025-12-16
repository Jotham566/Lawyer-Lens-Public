"use client";

import { useState, useEffect } from "react";
import { Building2, Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers";
import {
  listOrganizations,
  switchOrganization,
  type Organization,
} from "@/lib/api/organizations";

interface OrgSwitcherProps {
  className?: string;
}

export function OrgSwitcher({ className }: OrgSwitcherProps) {
  const { accessToken, isAuthenticated } = useAuth();

  const [open, setOpen] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Load organizations
  useEffect(() => {
    async function loadOrganizations() {
      if (!accessToken) return;

      setLoading(true);
      try {
        const data = await listOrganizations(accessToken);
        setOrganizations(data.items);
        // Select first org by default if none selected
        if (data.items.length > 0 && !selectedOrg) {
          setSelectedOrg(data.items[0]);
        }
      } catch (err) {
        console.error("Failed to load organizations:", err);
      } finally {
        setLoading(false);
      }
    }

    if (accessToken && isAuthenticated) {
      loadOrganizations();
    }
  }, [accessToken, isAuthenticated, selectedOrg]);

  const handleSelectOrg = async (org: Organization) => {
    if (!accessToken || org.id === selectedOrg?.id) {
      setOpen(false);
      return;
    }

    setSwitching(true);
    try {
      const response = await switchOrganization(accessToken, org.id);
      setSelectedOrg(response.organization);
      setOpen(false);
      // Store in localStorage for persistence
      localStorage.setItem("selected_organization_id", org.id);
      // Reload the page to refresh data with new org context
      window.location.reload();
    } catch (err) {
      console.error("Failed to switch organization:", err);
      // Keep the current org selected on error
      setSwitching(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  // Don't show if only one org
  if (organizations.length <= 1 && !loading) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select organization"
          className={cn("justify-between gap-2", className)}
          disabled={switching}
        >
          {loading || switching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="truncate max-w-[120px]">
                {selectedOrg?.name || "Select organization"}
              </span>
            </>
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search organizations..." />
          <CommandList>
            <CommandEmpty>No organization found.</CommandEmpty>
            <CommandGroup heading="Organizations">
              {organizations.map((org) => (
                <CommandItem
                  key={org.id}
                  onSelect={() => handleSelectOrg(org)}
                  className="cursor-pointer"
                >
                  <Building2 className="mr-2 h-4 w-4 shrink-0" />
                  <div className="flex-1 truncate">
                    <p className="truncate">{org.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {org.subscription_tier}
                    </p>
                  </div>
                  {selectedOrg?.id === org.id && (
                    <Check className="ml-2 h-4 w-4 shrink-0" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  // Navigate to create org page
                  window.location.href = "/settings/organization/new";
                }}
                className="cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Organization
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
