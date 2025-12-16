/**
 * Uganda Phone Number Validation Utilities
 *
 * Validates and formats Ugandan phone numbers for mobile money payments.
 *
 * Uganda phone number formats:
 * - MTN: 077x, 078x (e.g., 0772123456, 0782123456)
 * - Airtel: 070x, 075x (e.g., 0701234567, 0752345678)
 *
 * International format: +256 or 256 prefix
 */

export type MobileProvider = "mtn" | "airtel" | "unknown";

export interface PhoneValidationResult {
  isValid: boolean;
  provider: MobileProvider;
  formatted: string;
  error?: string;
}

// MTN Uganda prefixes (after removing country code)
const MTN_PREFIXES = ["77", "78"];

// Airtel Uganda prefixes (after removing country code)
const AIRTEL_PREFIXES = ["70", "75"];

/**
 * Normalize a phone number by removing spaces, dashes, and standardizing format
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let normalized = phone.replace(/\D/g, "");

  // Handle +256 prefix
  if (normalized.startsWith("256")) {
    normalized = normalized.slice(3);
  }

  // Handle leading 0
  if (normalized.startsWith("0")) {
    normalized = normalized.slice(1);
  }

  return normalized;
}

/**
 * Detect the mobile provider based on phone number prefix
 */
export function detectProvider(phone: string): MobileProvider {
  const normalized = normalizePhoneNumber(phone);

  if (normalized.length < 2) return "unknown";

  const prefix = normalized.slice(0, 2);

  if (MTN_PREFIXES.includes(prefix)) {
    return "mtn";
  }

  if (AIRTEL_PREFIXES.includes(prefix)) {
    return "airtel";
  }

  return "unknown";
}

/**
 * Validate a Uganda phone number
 */
export function validateUgandaPhone(phone: string): PhoneValidationResult {
  const normalized = normalizePhoneNumber(phone);

  // Check length (9 digits after country code)
  if (normalized.length !== 9) {
    return {
      isValid: false,
      provider: "unknown",
      formatted: phone,
      error: normalized.length < 9
        ? "Phone number is too short. Enter 9 digits (e.g., 772123456)"
        : "Phone number is too long. Enter 9 digits (e.g., 772123456)",
    };
  }

  const provider = detectProvider(phone);

  if (provider === "unknown") {
    const prefix = normalized.slice(0, 2);
    return {
      isValid: false,
      provider: "unknown",
      formatted: phone,
      error: `Invalid prefix "${prefix}". MTN numbers start with 77 or 78. Airtel numbers start with 70 or 75.`,
    };
  }

  // Format to international format
  const formatted = `256${normalized}`;

  return {
    isValid: true,
    provider,
    formatted,
  };
}

/**
 * Format phone number for display
 */
export function formatPhoneDisplay(phone: string): string {
  const normalized = normalizePhoneNumber(phone);

  if (normalized.length !== 9) {
    return phone;
  }

  // Format as +256 7XX XXX XXX
  return `+256 ${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6)}`;
}

/**
 * Get placeholder text based on provider
 */
export function getPlaceholder(provider: MobileProvider): string {
  switch (provider) {
    case "mtn":
      return "e.g., 772123456 or 0772123456";
    case "airtel":
      return "e.g., 701234567 or 0701234567";
    default:
      return "e.g., 772123456";
  }
}

/**
 * Get provider display name
 */
export function getProviderName(provider: MobileProvider): string {
  switch (provider) {
    case "mtn":
      return "MTN Mobile Money";
    case "airtel":
      return "Airtel Money";
    default:
      return "Mobile Money";
  }
}
