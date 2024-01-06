const sharp = require("sharp");

async function reduceImage(imageBuffer, options) {
  try {
    let processedImage;

    // Check if Instagram format is selected
    if (options.isInstagramFeedFormat) {
      processedImage = await addWhitePadding(imageBuffer, options);
    } else {
      // Reduce the image without white padding
      processedImage = await sharp(imageBuffer).resize(options.maxWidth, options.maxHeight, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: options.quality }).toBuffer();
    }

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
      processedImage = await sharp(imageBuffer).resize(options.maxWidth, options.maxHeight, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: options.quality }).toBuffer();

      // Update the current size
      currentSizeInBytes = processedImage.length;
    }

    if (currentSizeInBytes > maxSizeInBytes) {
      console.warn(`Warning: Could not meet target size constraint. Current size: ${currentSizeInBytes / 1024} KB`);
    }

    return processedImage;
  } catch (error) {
    console.error(`Error reducing image: ${error.message}`);
    throw error;
  }
}

async function addWhitePadding(imageBuffer, options) {
  return new Promise((resolve, reject) => {
    sharp(imageBuffer)
      .resize({ width: options.maxWidth, height: options.maxHeight, fit: "contain", background: "white" })
      .jpeg({ quality: options.quality })
      .toBuffer((err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
  });
}

module.exports = { reduceImage };
