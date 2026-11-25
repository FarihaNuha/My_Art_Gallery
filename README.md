# The Art Archive

An interactive vintage digital art book & personal gallery built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Physical Hardcover Book**: Deep forest green leather cover (`#34483A`), gold-embossed typography (`#B69A64`), raised spine, and layered page edges.
- **3D Page-Turning & Back Cover**: Realistic CSS 3D `rotateY` page flips, touch swipe support on mobile, and a connected closing animation onto the Back Cover when finishing the book.
- **Dynamic Table of Contents**: Automatically synchronized with inserted, edited, or deleted artworks.
- **Strict Artwork Preservation**: Original images are stored in Supabase Storage without cropping or compression and rendered with `object-fit: contain`.
- **Cloud Persistence (Supabase)**:
  - `public.book_pages` — Tracks Table of Contents, Artwork pages, and Final page order.
  - `public.artworks` — Stores artwork titles, original dimensions, aspect ratios, and public image URLs.
  - `artworks` Storage Bucket — Stores the original uploaded artwork files.

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env` (see `.env.example`):
   ```env
   VITE_SUPABASE_URL=https://fodbcogpenijknjgyjhb.supabase.co
   VITE_SUPABASE_ANON_KEY=your-publishable-key
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

## Database Schema

The Supabase schema and storage bucket setup are tracked in [supabase/migrations/001_art_archive_schema.sql](supabase/migrations/001_art_archive_schema.sql).
