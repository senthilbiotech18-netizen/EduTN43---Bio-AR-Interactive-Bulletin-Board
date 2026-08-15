/**
 * Optimizes biology diagrams and images uploaded from desktop
 * Resizes large dimensions to crisp, high-detail display resolution (max 1600px)
 * ensuring fast 3D WebGL rendering and instant loading.
 */

export async function optimizeUploadedImage(file: File, maxDimension = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it's an SVG, load as text data URL directly
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // If within bounds and not overly massive, return original
        if (width <= maxDimension && height <= maxDimension && file.size < 1024 * 1024) {
          resolve(e.target?.result as string);
          return;
        }

        // Calculate aspect ratio scaled dimensions
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // High quality bicubic rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as WebP or JPEG for optimal compression with biological crispness
        const outputFormat = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(outputFormat, 0.90);
        resolve(dataUrl);
      };

      img.onerror = () => {
        // Fallback to raw data url if canvas decode fails
        resolve(e.target?.result as string);
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
