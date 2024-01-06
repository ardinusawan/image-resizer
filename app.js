const express = require("express");
const multer = require("multer");
const path = require("path");
const sharp = require("sharp");
const { reduceImage } = require("./imageReducer");

const app = express();
const port = 3000;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/upload", upload.array("images"), async (req, res) => {
  const now = new Date();
  const timestamp = now
    .toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
    .replace(/[-: ]/g, "_");

  try {
    const quality = parseInt(req.body.quality);
    const maxSizeValue = parseInt(req.body.maxSizeValue);
    const maxSizeUnit = req.body.maxSizeUnit; // KB or MB

    let maxSize;
    if (maxSizeUnit === "MB") {
      maxSize = maxSizeValue * 1024 * 1024; // Convert MB to bytes
    } else {
      maxSize = maxSizeValue * 1024; // Keep it in KB
    }

    const maxWidth = parseInt(req.body.maxWidth);
    const maxHeight = parseInt(req.body.maxHeight);

    const addWhitePaddingIfNeeded = async (file) => {
      const imageBuffer = file.buffer;
      const reductionOptions = { quality, maxSize, maxWidth, maxHeight, isInstagramFeedFormat: req.body.isInstagramFeedFormat === "on" };
      return reduceImage(imageBuffer, reductionOptions);
    };

    const reducedImages = await Promise.all(req.files.map(addWhitePaddingIfNeeded));

    // Zip the reduced images into a single downloadable file (optional)
    const zipBuffer = await createZip(reducedImages);

    // Set response headers for automatic download
    res.setHeader("Content-Disposition", `attachment; filename=bulk_reduced_images_${timestamp}.zip`);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Length", zipBuffer.length);

    // Send the zip file data directly
    res.send(zipBuffer);
  } catch (error) {
    res.status(500).send(`<h2>Error reducing images: ${error.message}</h2>`);
  }
});

async function createZip(imageBuffers) {
  const archiver = require("archiver");
  const archive = archiver("zip");

  imageBuffers.forEach((buffer, index) => {
    archive.append(buffer, { name: `reduced_image_${index + 1}.jpg` });
  });

  return new Promise((resolve, reject) => {
    const buffers = [];
    archive.on("data", (data) => buffers.push(data));
    archive.on("end", () => resolve(Buffer.concat(buffers)));
    archive.on("error", reject);

    archive.finalize();
  });
}

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
