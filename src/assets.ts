import { readdirSync, statSync } from 'node:fs';
import { join, extname, basename, relative } from 'node:path';

export type ContentType = 'ARTICLE' | 'ASSET_LIST' | 'LINK_LIST' | 'METRIC_CARD';

export interface ContentLink {
  label: string;
  url: string;
  note?: string;
}

export interface ContentNode {
  id: string;
  title: string;
  type: ContentType;
  category: string;
  content?: string; // HTML or Markdown
  links?: ContentLink[];
  metrics?: Record<string, string>;
  assets?: AssetMetadata[];
}

export interface SocialLink {
  platform: string;
  url: string;
  handle: string;
}

export interface SiteMetadata {
  title: string;
  tagline: string;
  bio: string;
  socials: SocialLink[];
  substackFeed: {
    url: string;
    label: string;
  };
  watchlist: {
    date: string;
    stocks: string[];
    description: string;
  };
  historicalPicks: {
    date: string;
    stocks: string[];
    description: string;
  };
  partnershipTerms: {
    fee: string;
    hurdle: string;
    performanceAllocation: string;
    description: string;
  };
  kolCampaign: {
    url: string;
    label: string;
  };
}

export interface AssetMetadata {
  id: string;
  filename: string;
  name: string;
  extension: 'pdf' | 'epub';
  category: string;
  sizeBytes: number;
  lastModified: number;
  path: string;
}

/**
 * Validates if an object conforms to the AssetMetadata schema.
 * Using a simple check for required properties.
 */
export function validateAsset(asset: any): asset is AssetMetadata {
  return (
    typeof asset?.id === 'string' &&
    typeof asset?.filename === 'string' &&
    typeof asset?.name === 'string' &&
    (asset?.extension === 'pdf' || asset?.extension === 'epub') &&
    typeof asset?.category === 'string' &&
    typeof asset?.sizeBytes === 'number' &&
    typeof asset?.lastModified === 'number' &&
    typeof asset?.path === 'string'
  );
}

/**
 * Scans directories and generates a verified manifest of assets.
 */
export function getManifest(basePath: string, directories: string[]): AssetMetadata[] {
  const manifest: AssetMetadata[] = [];

  for (const dir of directories) {
    const fullPath = join(basePath, dir);
    try {
      const files = readdirSync(fullPath);
      for (const file of files) {
        const ext = extname(file).toLowerCase();
        if (ext === '.pdf' || ext === '.epub') {
          const filePath = join(fullPath, file);
          const stats = statSync(filePath);

          const asset: AssetMetadata = {
            id: relative(basePath, filePath).replace(/\\/g, '/'),
            filename: file,
            name: formatName(basename(file, ext)),
            extension: ext.substring(1) as 'pdf' | 'epub',
            category: dir,
            sizeBytes: stats.size,
            lastModified: stats.mtimeMs,
            path: filePath
          };

          if (validateAsset(asset)) {
            manifest.push(asset);
          }
        }
      }
    } catch (error) {
      // Skip directories that don't exist
    }
  }

  return manifest;
}

/**
 * Formats asset name to be more human-readable.
 */
export function formatName(rawName: string): string {
  return decodeURIComponent(rawName)
    .replace(/%20/g, ' ')
    .replace(/_/g, ' ')
    .replace(/-/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();
}
