import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BrandingConfig {
  logo_expanded_url: string;
  logo_collapsed_url: string;
  favicon_url: string;
  site_title: string;
  site_description: string;
  og_image_url: string;
  primary_color: string;
  sidebar_logo_bg: string;
}

const defaultBranding: BrandingConfig = {
  logo_expanded_url: '',
  logo_collapsed_url: '',
  favicon_url: '',
  site_title: 'Meta-INNOVA LMS',
  site_description: 'Meta-Innova Innovation Academy - Empowering Education Through Technology',
  og_image_url: '',
  primary_color: '#051c2d',
  sidebar_logo_bg: '#2d437f',
};

interface BrandingContextType {
  branding: BrandingConfig;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType>({
  branding: defaultBranding,
  isLoading: true,
  refetch: async () => {},
});

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<BrandingConfig>(defaultBranding);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBranding = async () => {
    try {
      const { data, error } = await supabase
        .from('system_configurations')
        .select('value')
        .eq('key', 'site_branding')
        .single();

      if (!error && data?.value) {
        const brandingValue = data.value as unknown as BrandingConfig;
        setBranding({ ...defaultBranding, ...brandingValue });
      }
    } catch (err) {
      console.error('Error fetching branding:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Update document head when branding changes
  useEffect(() => {
    // Update title
    document.title = branding.site_title || defaultBranding.site_title;

    // Update favicon
    const existingFavicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
    if (branding.favicon_url && existingFavicon) {
      existingFavicon.href = branding.favicon_url;
    }

    // Update meta description
    let metaDescription = document.querySelector("meta[name='description']") as HTMLMetaElement;
    if (metaDescription && branding.site_description) {
      metaDescription.content = branding.site_description;
    }

    // Update OG tags
    const ogTitle = document.querySelector("meta[property='og:title']") as HTMLMetaElement;
    if (ogTitle && branding.site_title) {
      ogTitle.content = branding.site_title;
    }

    const ogDescription = document.querySelector("meta[property='og:description']") as HTMLMetaElement;
    if (ogDescription && branding.site_description) {
      ogDescription.content = branding.site_description;
    }

    const ogImage = document.querySelector("meta[property='og:image']") as HTMLMetaElement;
    if (ogImage && branding.og_image_url) {
      ogImage.content = branding.og_image_url;
    }

    // Update Twitter card
    const twitterImage = document.querySelector("meta[name='twitter:image']") as HTMLMetaElement;
    if (twitterImage && branding.og_image_url) {
      twitterImage.content = branding.og_image_url;
    }
  }, [branding]);

  useEffect(() => {
    fetchBranding();
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, isLoading, refetch: fetchBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}
