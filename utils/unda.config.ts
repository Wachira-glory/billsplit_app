export const UNDA_CONFIG = {
  mapChannelConfig: (channel: any) => {
    const cfg = channel?.config || {};

    return {
      shortCode: cfg.short_code,
      shortcodeType: cfg.shortcode_type,
      crosschargeRef: cfg.crosscharge_ref,
      crosschargeEnabled: cfg.crosscharge_enabled
    };
  },
  
  platformId: process.env.NEXT_PUBLIC_UNDA_PLATFORM_ID,
  undaUrl: process.env.NEXT_PUBLIC_UNDA_SUPABASE_URL
};                    