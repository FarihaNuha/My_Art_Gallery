export type PageType = 'toc' | 'artwork' | 'final';

export interface Artwork {
  id: string;
  title: string;
  imageUrl?: string;
  storagePath?: string;
  imageBlob?: Blob;
  originalFileName: string;
  originalWidth: number;
  originalHeight: number;
  aspectRatio: number;
  pageNumber: number;
  createdAt: number;
  updatedAt: number;
}

export interface BookPage {
  id: string;
  pageNumber: number;
  pageType: PageType;
  artworkId?: string;
}

export interface TocEntry {
  index: number;
  artworkId: string;
  title: string;
  pageNumber: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}
