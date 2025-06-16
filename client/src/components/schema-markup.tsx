
import { useEffect } from "react";

interface SchemaMarkupProps {
  schema: Record<string, any>;
}

export function SchemaMarkup({ schema }: SchemaMarkupProps) {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(schema);
    script.id = "schema-markup";

    // Remove existing schema markup
    const existing = document.getElementById("schema-markup");
    if (existing) {
      document.head.removeChild(existing);
    }

    document.head.appendChild(script);

    return () => {
      const currentScript = document.getElementById("schema-markup");
      if (currentScript) {
        document.head.removeChild(currentScript);
      }
    };
  }, [schema]);

  return null;
}

// Predefined schema templates
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Step Into Storytime",
  "description": "AI-powered personalized bedtime stories for children",
  "url": "https://stepintostorytime.com",
  "logo": "https://stepintostorytime.com/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "availableLanguage": "English"
  },
  "sameAs": []
};

export const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Step Into Storytime",
  "description": "Create magical, personalized bedtime stories for children using AI",
  "applicationCategory": "LifestyleApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "150"
  }
};
