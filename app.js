const express = require('express');
const multer = require('multer');
const path = require('path');
const { reduceImage } = require('./imageReducer');

const app = express();
const port = 3000;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/upload', upload.array('images'), async (req, res) => {
  try {
    const quality = parseInt(req.body.quality);
    const maxSizeValue = parseInt(req.body.maxSizeValue);
    const maxSizeUnit = req.body.maxSizeUnit; // KB or MB

    let maxSize;
    if (maxSizeUnit === 'MB') {
      maxSize = maxSizeValue * 1024 * 1024; // Convert MB to bytes
    } else {
      maxSize = maxSizeValue * 1024; // Keep it in KB
    }

    const maxWidth = parseInt(req.body.maxWidth);
    const maxHeight = parseInt(req.body.maxHeight);

    const reducedImages = await Promise.all(
      req.files.map(async (file) => {
        const imageBuffer = file.buffer;
        const reductionOptions = { quality, maxSize, maxWidth, maxHeight };
        const reducedBuffer = await reduceImage(imageBuffer, reductionOptions);
        return reducedBuffer;
      })
    );

    // Zip the reduced images into a single downloadable file (optional)
    const zipBuffer = await createZip(reducedImages);

    // Set response headers for automatic download
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
    res.setHeader('Content-Disposition', `attachment; filename=bulk_reduced_images_${timestamp}.zip`);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Length', zipBuffer.length);

    // Send the zip file data directly
    res.send(zipBuffer);
  } catch (error) {
    res.status(500).send(`<h2>Error reducing images: ${error.message}</h2>`);
  }
});

async function createZip(imageBuffers) {
  // Use a library like 'archiver' or 'jszip' to create a zip file
  // Example using 'archiver':
  const archiver = require('archiver');
  const archive = archiver('zip');

  imageBuffers.forEach((buffer, index) => {
    archive.append(buffer, { name: `reduced_image_${index + 1}.jpg` });
  });

  return new Promise((resolve, reject) => {
    const buffers = [];
    archive.on('data', (data) => buffers.push(data));
    archive.on('end', () => resolve(Buffer.concat(buffers)));
    archive.on('error', reject);

    archive.finalize();
  });
}

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

