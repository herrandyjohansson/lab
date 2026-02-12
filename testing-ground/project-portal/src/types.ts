export type ProductSummary = {
  // New fields (recommended)
  productId?: number;
  productName?: string;
  productUrl?: string;
  seriesName?: string | null;
  categories?: string | null;
  metadata?: ProductMetadataDto | null;
  // Legacy fields (deprecated, but supported for backward compatibility)
  id?: number;
  name?: string;
  url?: string;
  series?: string | null;
  officialCategories?: string;
  // Common fields
  category: string;
};

export type CategoryTreeNode = {
  // New fields (recommended)
  nodeId?: string;
  displayName?: string;
  nodeType?: "Category" | "Subcategory" | "Series";
  subNodes?: CategoryTreeNode[] | null;
  products?: ProductSummary[] | null;
  productCount?: number;
  path?: string[];
  // Legacy fields (deprecated, but supported for backward compatibility)
  id?: string;
  name?: string;
  children?: CategoryTreeNode[] | null;
  items?: ProductSummary[];
  count?: number;
};

export type ResponseMetadata = {
  totalProducts: number;
  totalCategories: number;
  fetchTimeMs: number;
  timestamp: string;
  apiVersion: string;
};

export type CategoryTreeResponse = {
  // New fields (recommended)
  categories?: CategoryTreeNode[];
  meta?: ResponseMetadata;
  // Legacy fields (deprecated, but supported for backward compatibility)
  structure?: CategoryTreeNode[];
  timeToFetchData?: number;
};

export type ProductPropertiesDto = {
  officialCategories?: string;
  productCategories?: string;
  piaCategory?: string;
  productFamily?: string;
  shortName?: string;
  cnProdName?: string;
  officialFullName?: string;
  productType?: string;
  productGroup?: string;
  productSegment?: string;
  productLine?: string;
  psLine?: string;
  formFactor?: string;
  boxWidth?: string;
  boxHeight?: string;
  boxDepth?: string;
  outdoorReady?: string;
  externalReleaseDate?: string;
  endOfLifeDate?: string;
  endOfSupportDate?: string;
  vendor?: string;
  vendorType?: string;
  manufacturerId?: string;
  series?: string;
  catalogGroup?: string;
  spriteId?: string;
  hwId?: string;
  competitorCode?: string;
  active?: string;
  supportalIncluded?: string;
  stdWarranty?: string;
  newProductNumberOfDays?: string;
  channels?: string;
  compare?: string;
  scaleQuantity?: string;
  projectURL?: string;
  projectName?: string;
  docmanId?: string;
  compNewsAxisCategory?: string;
};

export type ProductDetailsDto = {
  id: number;
  name: string;
  type: string;
  url: string;
  category: string;
  categories: string;
  external: boolean;
  state: number;
  parentId: number | null;
  properties: ProductPropertiesDto | null;
};

export type ProductLinkDto = {
  title: string;
  url: string;
  type?: string | null;
};

export type ProductMetadataRequestDto = {
  links?: ProductLinkDto[] | null;
  extraDescription?: string | null;
  responsible?: string | null;
  image?: string | null;
};

export type ProductMetadataDto = {
  productId: number;
  links: ProductLinkDto[];
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  lastAccessed: string | null;
  extraDescription: string | null;
  responsible: string | null;
  image: string | null;
};
