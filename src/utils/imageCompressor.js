/**
 * Compresses and resizes an image file or base64 string to be within a max dimension and target file size (<= 1MB).
 * @param {File | string} input - File object or base64 Data URL
 * @param {Object} options
 * @param {number} options.maxWidth - Maximum width (default: 500)
 * @param {number} options.maxHeight - Maximum height (default: 500)
 * @param {number} options.maxSizeMB - Maximum file size in MB (default: 1.0)
 * @param {string} options.mimeType - Output mime type (default: 'image/jpeg')
 * @returns {Promise<string>} - Resolves to compressed base64 data URL
 */
export async function compressAndResizeImage(input, options = {}) {
  const {
    maxWidth = 500,
    maxHeight = 500,
    maxSizeMB = 1.0,
    mimeType = "image/jpeg",
  } = options;

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Fill white background for transparent images when converting to JPEG
      if (mimeType === "image/jpeg") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Iteratively compress quality until size is under maxSizeBytes
      let quality = 0.9;
      let dataUrl = canvas.toDataURL(mimeType, quality);

      while (dataUrl.length * 0.75 > maxSizeBytes && quality > 0.1) {
        quality -= 0.1;
        dataUrl = canvas.toDataURL(mimeType, quality);
      }

      resolve(dataUrl);
    };

    img.onerror = (err) => {
      reject(new Error("Failed to load image for compression"));
    };

    if (input instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(input);
    } else if (typeof input === "string") {
      img.src = input;
    } else {
      reject(new Error("Invalid input type for image compression"));
    }
  });
}
