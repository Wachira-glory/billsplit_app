// utils/unda.config.ts

export const UNDA_CONFIG = {
  // 1. Trust the database! No more hardcoded "Virtual" configs.
  mapChannelConfig: (channel: any) => {
    // Look for the config object first, then fall back to idata
    const cfg = channel?.config || channel?.idata;

    return {
      // Use the actual values from the record you just created
      shortCode: cfg?.short_code || channel?.uid?.split('-')[0], // Fallback to UID prefix if config is missing
      shortcodeType: cfg?.shortcode_type || 'paybill_no',
      crosschargeRef: cfg?.crosscharge_ref,
      crosschargeEnabled: cfg?.crosscharge_enabled ?? false,
    };
  },
  
  platform: {
    id: Number(process.env.NEXT_PUBLIC_UNDA_PLATFORM_ID),
    uid: process.env.NEXT_PUBLIC_UNDA_PLATFORM_UID,
  },
  
  undaUrl: process.env.NEXT_PUBLIC_UNDA_SUPABASE_URL,
};