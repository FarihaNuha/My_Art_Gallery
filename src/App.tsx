import { useEffect, useState } from 'react';
import { ArtBook } from './components/ArtBook';
import {
  addNewArtworkPage,
  deleteArtworkFromPage,
  insertArtworkOnPage,
  loadArchiveData,
  removeEmptyArtworkPage,
  replaceArtworkImage,
  updateArtworkTitle,
} from './services/archiveDb';
import type { Artwork, BookPage, ImageDimensions } from './types/archive';

export function App() {
  const [pages, setPages] = useState<BookPage[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    loadArchiveData()
      .then((data) => {
        if (!mounted) return;
        setPages(data.pages);
        setArtworks(data.artworks);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setLoadError(err instanceof Error ? err.message : 'Unable to open local archive.');
        setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleInsertArtwork = async (
    pageId: string,
    title: string,
    file: File,
    dimensions: ImageDimensions
  ) => {
    const { artwork, page } = await insertArtworkOnPage(pageId, title, file, dimensions);
    setPages((prev) => prev.map((p) => (p.id === page.id ? page : p)));
    setArtworks((prev) => {
      const filtered = prev.filter((a) => a.pageNumber !== artwork.pageNumber && a.id !== artwork.id);
      return [...filtered, artwork].sort((a, b) => a.pageNumber - b.pageNumber);
    });
  };

  const handleUpdateTitle = async (artworkId: string, newTitle: string) => {
    const updated = await updateArtworkTitle(artworkId, newTitle);
    setArtworks((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  const handleReplaceImage = async (
    artworkId: string,
    file: File,
    dimensions: ImageDimensions
  ) => {
    const updated = await replaceArtworkImage(artworkId, file, dimensions);
    setArtworks((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  const handleDeleteArtwork = async (pageId: string) => {
    const refreshed = await deleteArtworkFromPage(pageId);
    setPages(refreshed.pages);
    setArtworks(refreshed.artworks);
  };

  const handleAddPage = async () => {
    const { pages: updatedPages, newPageNumber } = await addNewArtworkPage();
    setPages(updatedPages);
    return newPageNumber;
  };

  const handleRemoveEmptyPage = async (pageId: string) => {
    const refreshed = await removeEmptyArtworkPage(pageId);
    setPages(refreshed.pages);
    setArtworks(refreshed.artworks);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full studio-backdrop flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="font-display text-sm tracking-[0.26em] uppercase text-[#B69A64]">
            The Art Archive
          </p>
          <p className="font-serif-title italic text-base text-[#D8C5A3]/75">
            Preparing archival volume...
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen w-full studio-backdrop flex items-center justify-center p-6">
        <div className="max-w-md paper-surface border border-[#B69A64] p-6 text-center">
          <h1 className="font-display text-base tracking-[0.16em] uppercase text-[#35291F] mb-2">
            Archive Unavailable
          </h1>
          <p className="font-serif-body text-sm text-[#795C42]">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <ArtBook
      pages={pages}
      artworks={artworks}
      onInsertArtwork={handleInsertArtwork}
      onUpdateTitle={handleUpdateTitle}
      onReplaceImage={handleReplaceImage}
      onDeleteArtwork={handleDeleteArtwork}
      onAddPage={handleAddPage}
      onRemoveEmptyPage={handleRemoveEmptyPage}
    />
  );
}

export default App;
