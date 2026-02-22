
import { useEffect } from "react";

interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  canonical?: string;
}

export function useSEO(data: SEOData) {
  useEffect(() => {
    // Update document title
    if (data.title) {
      document.title = data.title;
    }

    // Update meta description
    if (data.description) {
      updateMetaTag("description", data.description);
    }

    // Update meta keywords
    if (data.keywords) {
      updateMetaTag("keywords", data.keywords);
    }

    // Update Open Graph tags
    if (data.title) {
      updateMetaProperty("og:title", data.title);
    }
    if (data.description) {
      updateMetaProperty("og:description", data.description);
    }
    if (data.image) {
      updateMetaProperty("og:image", data.image);
    }
    if (data.url) {
      updateMetaProperty("og:url", data.url);
    }
    if (data.type) {
      updateMetaProperty("og:type", data.type);
    }

    // Update Twitter Card tags
    if (data.title) {
      updateMetaName("twitter:title", data.title);
    }
    if (data.description) {
      updateMetaName("twitter:description", data.description);
    }
    if (data.image) {
      updateMetaName("twitter:image", data.image);
    }

    // Update canonical URL
    if (data.canonical || data.url) {
      updateCanonicalUrl(data.canonical || data.url!);
    }
  }, [data]);
}

function updateMetaTag(name: string, content: string) {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", name);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

function updateMetaProperty(property: string, content: string) {
  let meta = document.querySelector(`meta[property="${property}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("property", property);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

function updateMetaName(name: string, content: string) {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", name);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

function updateCanonicalUrl(url: string) {
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", url);
}
