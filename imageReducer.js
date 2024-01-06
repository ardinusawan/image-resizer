const sharp = require('sharp');

async function reduceImage(imageBuffer, options) {
  try {
    let processedImage = await sharp(imageBuffer)
      .resize(options.maxWidth, options.maxHeight, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: options.quality })
      .toBuffer();

    // Check and reduce the file size if it exceeds the specified max size
    const maxSizeInBytes = options.maxSize;
    let currentSizeInBytes = processedImage.length;

    while (currentSizeInBytes > maxSizeInBytes && options.quality > 1) {
      // Reduce the quality to achieve a smaller size
      options.quality -= 5;

      // Ensure the quality is within the valid range
      if (options.quality < 1) {
        options.quality = 1;
      }

      // Process the image again with the updated quality setting
      processedImage = await sharp(imageBuffer)
        .resize(options.maxWidth, options.maxHeight, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: options.quality })
        .toBuffer();

      // Update the current size
      currentSizeInBytes = processedImage.length;
    }

    if (currentSizeInBytes > maxSizeInBytes) {
      console.warn(`Warning: Could not meet target size constraint. Current size: ${currentSizeInBytes/1024} KB`);
    }

    return processedImage;
  } catch (error) {
    console.error(`Error reducing image: ${error.message}`);
    throw error;
  }
}

module.exports = { reduceImage };

