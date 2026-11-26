import type { Artwork, BookPage, ImageDimensions, PageType } from '../types/archive';
import { ARTWORKS_BUCKET, supabase, supabaseConfigError } from './supabaseClient';

function getClient() {
  if (!supabase || supabaseConfigError) {
    throw new Error(supabaseConfigError ?? 'Supabase client is not configured.');
  }
  return supabase;
}

interface DbArtworkRow {
  id: string;
  title: string;
  storage_path: string;
  image_url: string;
  original_file_name: string;
  original_width: number;
  original_height: number;
  aspect_ratio: number;
  page_number: number;
  created_at: number;
  updated_at: number;
}

interface DbPageRow {
  id: string;
  page_number: number;
  page_type: PageType;
  artwork_id: string | null;
}

function mapArtworkRow(row: DbArtworkRow): Artwork {
  return {
    id: row.id,
    title: row.title,
    storagePath: row.storage_path,
    imageUrl: row.image_url,
    originalFileName: row.original_file_name,
    originalWidth: row.original_width,
    originalHeight: row.original_height,
    aspectRatio: row.aspect_ratio,
    pageNumber: row.page_number,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPageRow(row: DbPageRow): BookPage {
  return {
    id: row.id,
    pageNumber: row.page_number,
    pageType: row.page_type,
    artworkId: row.artwork_id ?? undefined,
  };
}

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function readImageDimensions(file: Blob): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || 1;
      const height = img.naturalHeight || 1;
      URL.revokeObjectURL(url);
      resolve({ width, height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read the selected image file.'));
    };
    img.src = url;
  });
}

async function uploadOriginalImage(file: File, artworkId: string): Promise<{ storagePath: string; imageUrl: string }> {
  const client = getClient();
  const safeName = sanitizeFileName(file.name);
  const storagePath = `${artworkId}/${Date.now()}_${safeName}`;

  const { error: uploadError } = await client.storage
    .from(ARTWORKS_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '31536000',
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Image upload failed: ${uploadError.message}`);
  }

  const { data } = client.storage.from(ARTWORKS_BUCKET).getPublicUrl(storagePath);
  return {
    storagePath,
    imageUrl: data.publicUrl,
  };
}

export async function loadArchiveData(): Promise<{ pages: BookPage[]; artworks: Artwork[] }> {
  const client = getClient();
  const [pagesRes, artworksRes] = await Promise.all([
    client.from('book_pages').select('*').order('page_number', { ascending: true }),
    client.from('artworks').select('*').order('page_number', { ascending: true }),
  ]);

  if (pagesRes.error) {
    throw new Error(`Failed to load pages: ${pagesRes.error.message}`);
  }
  if (artworksRes.error) {
    throw new Error(`Failed to load artworks: ${artworksRes.error.message}`);
  }

  const pages = ((pagesRes.data ?? []) as DbPageRow[]).map(mapPageRow);
  const artworks = ((artworksRes.data ?? []) as DbArtworkRow[]).map(mapArtworkRow);

  return { pages, artworks };
}

export async function insertArtworkOnPage(
  pageId: string,
  title: string,
  file: File,
  dimensions: ImageDimensions
): Promise<{ artwork: Artwork; page: BookPage }> {
  const client = getClient();
  const { data: pageData, error: pageError } = await client
    .from('book_pages')
    .select('*')
    .eq('id', pageId)
    .single();

  if (pageError || !pageData) {
    throw new Error('Target artwork page not found.');
  }

  const pageRow = pageData as DbPageRow;
  if (pageRow.page_type !== 'artwork') {
    throw new Error('Artworks can only be inserted on artwork pages.');
  }

  // If replacing an existing artwork on this page, clean up the old one
  if (pageRow.artwork_id) {
    const { data: oldArt } = await client
      .from('artworks')
      .select('storage_path')
      .eq('id', pageRow.artwork_id)
      .single();

    if (oldArt?.storage_path) {
      await client.storage.from(ARTWORKS_BUCKET).remove([oldArt.storage_path]);
    }
    await client.from('artworks').delete().eq('id', pageRow.artwork_id);
  }

  const artworkId = createId('art');
  const { storagePath, imageUrl } = await uploadOriginalImage(file, artworkId);
  const now = Date.now();

  const newArtworkRow: DbArtworkRow = {
    id: artworkId,
    title: title.trim(),
    storage_path: storagePath,
    image_url: imageUrl,
    original_file_name: file.name,
    original_width: dimensions.width,
    original_height: dimensions.height,
    aspect_ratio: Number((dimensions.width / dimensions.height).toFixed(4)),
    page_number: pageRow.page_number,
    created_at: now,
    updated_at: now,
  };

  const { error: insertError } = await client.from('artworks').insert(newArtworkRow);
  if (insertError) {
    await client.storage.from(ARTWORKS_BUCKET).remove([storagePath]);
    throw new Error(`Failed to save artwork metadata: ${insertError.message}`);
  }

  const { data: updatedPageData, error: updatePageError } = await client
    .from('book_pages')
    .update({ artwork_id: artworkId })
    .eq('id', pageId)
    .select('*')
    .single();

  if (updatePageError || !updatedPageData) {
    throw new Error(`Failed to link artwork to page: ${updatePageError?.message ?? 'Unknown error'}`);
  }

  return {
    artwork: mapArtworkRow(newArtworkRow),
    page: mapPageRow(updatedPageData as DbPageRow),
  };
}

export async function updateArtworkTitle(artworkId: string, newTitle: string): Promise<Artwork> {
  const client = getClient();
  const { data, error } = await client
    .from('artworks')
    .update({ title: newTitle.trim(), updated_at: Date.now() })
    .eq('id', artworkId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to update artwork title: ${error?.message ?? 'Not found'}`);
  }

  return mapArtworkRow(data as DbArtworkRow);
}

export async function replaceArtworkImage(
  artworkId: string,
  file: File,
  dimensions: ImageDimensions
): Promise<Artwork> {
  const client = getClient();
  const { data: existingData, error: fetchError } = await client
    .from('artworks')
    .select('*')
    .eq('id', artworkId)
    .single();

  if (fetchError || !existingData) {
    throw new Error('Artwork not found.');
  }

  const existing = existingData as DbArtworkRow;
  const { storagePath, imageUrl } = await uploadOriginalImage(file, artworkId);

  const { data: updatedData, error: updateError } = await client
    .from('artworks')
    .update({
      storage_path: storagePath,
      image_url: imageUrl,
      original_file_name: file.name,
      original_width: dimensions.width,
      original_height: dimensions.height,
      aspect_ratio: Number((dimensions.width / dimensions.height).toFixed(4)),
      updated_at: Date.now(),
    })
    .eq('id', artworkId)
    .select('*')
    .single();

  if (updateError || !updatedData) {
    await client.storage.from(ARTWORKS_BUCKET).remove([storagePath]);
    throw new Error(`Failed to replace artwork image: ${updateError?.message ?? 'Unknown error'}`);
  }

  if (existing.storage_path) {
    await client.storage.from(ARTWORKS_BUCKET).remove([existing.storage_path]);
  }

  return mapArtworkRow(updatedData as DbArtworkRow);
}

export async function deleteArtworkFromPage(
  pageId: string
): Promise<{ pages: BookPage[]; artworks: Artwork[] }> {
  const client = getClient();
  const { data: pageData, error: pageError } = await client
    .from('book_pages')
    .select('*')
    .eq('id', pageId)
    .single();

  if (pageError || !pageData) {
    throw new Error('Page not found.');
  }

  const pageRow = pageData as DbPageRow;
  const artworkId = pageRow.artwork_id;

  const { error: clearError } = await client
    .from('book_pages')
    .update({ artwork_id: null })
    .eq('id', pageId);

  if (clearError) {
    throw new Error(`Failed to clear page: ${clearError.message}`);
  }

  if (artworkId) {
    const { data: artData } = await client
      .from('artworks')
      .select('storage_path')
      .eq('id', artworkId)
      .single();

    if (artData?.storage_path) {
      await client.storage.from(ARTWORKS_BUCKET).remove([artData.storage_path]);
    }
    await client.from('artworks').delete().eq('id', artworkId);
  }

  return loadArchiveData();
}

export async function addNewArtworkPage(): Promise<{ pages: BookPage[]; newPageNumber: number }> {
  const client = getClient();
  const { data: allPagesData, error: fetchError } = await client
    .from('book_pages')
    .select('*')
    .order('page_number', { ascending: true });

  if (fetchError) {
    throw new Error(`Failed to load pages: ${fetchError.message}`);
  }

  const allPages = (allPagesData ?? []) as DbPageRow[];
  const finalPage = allPages.find((p) => p.page_type === 'final');
  const insertedPageNumber = finalPage ? finalPage.page_number : allPages.length + 1;

  if (finalPage) {
    const { error: shiftError } = await client
      .from('book_pages')
      .update({ page_number: insertedPageNumber + 1 })
      .eq('id', finalPage.id);

    if (shiftError) {
      throw new Error(`Failed to shift final page: ${shiftError.message}`);
    }
  }

  const newPage: DbPageRow = {
    id: createId('page_art'),
    page_number: insertedPageNumber,
    page_type: 'artwork',
    artwork_id: null,
  };

  const { error: insertError } = await client.from('book_pages').insert(newPage);
  if (insertError) {
    throw new Error(`Failed to add new page: ${insertError.message}`);
  }

  const refreshed = await loadArchiveData();
  return { pages: refreshed.pages, newPageNumber: insertedPageNumber };
}

export async function removeEmptyArtworkPage(
  pageId: string
): Promise<{ pages: BookPage[]; artworks: Artwork[] }> {
  const client = getClient();
  const { data: allPagesData, error: fetchError } = await client
    .from('book_pages')
    .select('*')
    .order('page_number', { ascending: true });

  if (fetchError) {
    throw new Error(`Failed to load pages: ${fetchError.message}`);
  }

  const allPages = (allPagesData ?? []) as DbPageRow[];
  const target = allPages.find((p) => p.id === pageId);

  if (!target || target.page_type !== 'artwork' || target.artwork_id) {
    throw new Error('Only empty artwork pages can be removed.');
  }

  const artworkPagesCount = allPages.filter((p) => p.page_type === 'artwork').length;
  if (artworkPagesCount <= 1) {
    throw new Error('At least one artwork page must remain in the book.');
  }

  const { error: deleteError } = await client.from('book_pages').delete().eq('id', pageId);
  if (deleteError) {
    throw new Error(`Failed to remove page: ${deleteError.message}`);
  }

  const remaining = allPages.filter((p) => p.id !== pageId);
  for (let i = 0; i < remaining.length; i++) {
    const expectedNum = i + 1;
    const p = remaining[i];
    if (p.page_number !== expectedNum) {
      await client
        .from('book_pages')
        .update({ page_number: expectedNum })
        .eq('id', p.id);

      if (p.artwork_id) {
        await client
          .from('artworks')
          .update({ page_number: expectedNum })
          .eq('id', p.artwork_id);
      }
    }
  }

  return loadArchiveData();
}
