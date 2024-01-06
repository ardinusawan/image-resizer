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

    // Prepare an array to store data URIs
    const dataURIs = [];

    // Convert each image buffer to a data URI and push to the array
    reducedImages.forEach((buffer, index) => {
      const mimeType = "image/jpeg";
      const base64Image = buffer.toString("base64");
      const dataURI = `data:${mimeType};base64,${base64Image}`;
      dataURIs.push(dataURI);
    });

    // Send HTML response with embedded data URIs
    res.send(`
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bulk Image Size Reducer</title>
      <!-- Include Tailwind CSS -->
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    </head>
    <body class="font-sans text-center bg-gray-100 py-10">
      <h1 class="text-4xl mb-6">Bulk Image Size Reducer</h1>

      <div class="mb-8">
        ${dataURIs.map((dataURI, index) => `
          <div class="mb-4">
            <span class="text-lg font-semibold">Image ${index + 1}:</span>
            <a href="${dataURI}" download="reduced_image_${index + 1}.jpg" class="ml-2 inline-block px-3 py-1 bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-200 focus:ring-opacity-50">Download</a>
          </div>`).join("")}
      </div>

      <button onclick="resetForm()" class="bg-red-500 text-white font-semibold px-4 py-2 rounded-full hover:bg-red-600 focus:outline-none focus:ring focus:ring-red-200 focus:ring-opacity-50">Reset Form</button>

      <script>
        function resetForm() {
          location.href = "/";
        }
      </script>
    </body>
  </html>
`);
  } catch (error) {
    res.status(500).send(`<h2>Error reducing images: ${error.message}</h2>`);
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
