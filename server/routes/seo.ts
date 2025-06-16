
import type { Express } from "express";

export function registerSEORoutes(app: Express) {
  // Sitemap.xml route
  app.get("/sitemap.xml", (req, res) => {
    const baseUrl = req.protocol + "://" + req.get("host");
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/pricing</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/dashboard</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/story-wizard</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;

    res.set("Content-Type", "application/xml");
    res.send(sitemap);
  });

  // Robots.txt route
  app.get("/robots.txt", (req, res) => {
    const baseUrl = req.protocol + "://" + req.get("host");
    
    const robots = `User-agent: *
Allow: /
Allow: /pricing
Allow: /story-wizard
Disallow: /api/
Disallow: /dashboard
Disallow: /story/

Sitemap: ${baseUrl}/sitemap.xml`;

    res.set("Content-Type", "text/plain");
    res.send(robots);
  });
}
