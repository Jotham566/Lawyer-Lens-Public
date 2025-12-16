/**
 * Utilities Barrel Export
 */

export {
  parseCitations,
  citationToEId,
  eIdToCitation,
  hasCitations,
  extractUniqueEIds,
  type ParsedCitation,
} from "./citation-parser";

export {
  validateUgandaPhone,
  normalizePhoneNumber,
  detectProvider,
  formatPhoneDisplay,
  getPlaceholder,
  getProviderName,
  type MobileProvider,
  type PhoneValidationResult,
} from "./phone-validation";
