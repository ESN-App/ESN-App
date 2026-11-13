import { useEffect, useRef } from 'react';

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Returns an error message for an unsupported upload, or null when the file is fine. */
export function imageFileError(file: File, maxMegabytes = 8, types = IMAGE_TYPES): string | null {
  if (!types.includes(file.type)) {
    return 'Choose a JPEG, PNG, or WebP image.';
  }
  if (file.size > maxMegabytes * 1024 * 1024) {
    return `The image must be no larger than ${maxMegabytes} MB.`;
  }
  return null;
}

/** Creates object URLs for local previews and revokes the previous one (and on unmount). */
export function useObjectUrl() {
  const urlRef = useRef<string | null>(null);

  const revoke = () => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  };

  useEffect(() => revoke, []);

  return {
    create(file: File): string {
      revoke();
      urlRef.current = URL.createObjectURL(file);
      return urlRef.current;
    },
    revoke,
  };
}
