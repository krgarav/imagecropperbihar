const { parentPort } = require("worker_threads");
const path = require("path");
const fs = require("fs");
const { createCanvas } = require("canvas");

async function loadPdfJs() {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs"); // Dynamically import ES module
  return pdfjsLib;
}

// parentPort.on("message", async ({ buffer, name, documentsDir }) => {
//   try {
//     const pdfjsLib = await loadPdfJs();
//     // Convert Buffer to Uint8Array
//     const pdfBuffer = new Uint8Array(buffer);

//     // Load the PDF document using pdf.js
//     const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
//     const pdf = await loadingTask.promise;

//     const pdfBaseName = path.parse(name).name;
//     const outputDir = path.join(documentsDir, "images", pdfBaseName);
//     fs.mkdirSync(outputDir, { recursive: true });

//     const imageNames = [];

//     // Loop through the pages and render them
//     for (let i = 0; i < pdf.numPages; i++) {
//       const page = await pdf.getPage(i + 1); // Get the page
//       const viewport = page.getViewport({ scale: 2 }); // Set the scale to render it larger

//       const canvas = createCanvas(viewport.width, viewport.height);
//       const context = canvas.getContext("2d");

//       // Render the page to the canvas
//       const renderContext = {
//         canvasContext: context,
//         viewport: viewport,
//       };
//       await page.render(renderContext).promise;

//       // Save the canvas as an image (PNG format)
//       const imageBuffer = canvas.toBuffer("image/png");
//       const imageName = `${pdfBaseName}-${i + 1}.png`;
//       const imagePath = path.join(outputDir, imageName);

//       fs.writeFileSync(imagePath, imageBuffer);

//       imageNames.push(imageName);

//       // Send the result after each image is processed
//       parentPort.postMessage({
//         success: true,
//         folderName: pdfBaseName,
//         imageName: imageName,
//         imageIndex: i + 1,
//         totalImages: pdf.numPages,
//       });
//     }

//     // Send the final result once all images are processed
//     parentPort.postMessage({
//       success: true,
//       folderName: pdfBaseName,
//       images: imageNames,
//     });
//   } catch (err) {
//     console.error("Failed to process PDF:", err);
//     parentPort.postMessage({ success: false, folderName: null, images: [] });
//   }
// });



parentPort.on("message", async ({ buffer, name, documentsDir }) => {
  try {
    const pdfjsLib = await loadPdfJs();
    const pdfBuffer = new Uint8Array(buffer);

    const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
    const pdf = await loadingTask.promise;

    const pdfBaseName = path.parse(name).name;
    const outputDir = path.join(documentsDir, "images", pdfBaseName);
    fs.mkdirSync(outputDir, { recursive: true });

    const imageNames = [];

    for (let i = 0; i < pdf.numPages; i++) {
      const page = await pdf.getPage(i + 1);
      const viewport = page.getViewport({ scale: 2 });

      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext("2d");

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      const imageBuffer = canvas.toBuffer("image/png");
      const imageName = `${pdfBaseName}-${i + 1}.png`;
      const imagePath = path.join(outputDir, imageName);

      fs.writeFileSync(imagePath, imageBuffer);
      imageNames.push(imageName);

      // Explicit cleanup and manual GC hint
      try {
        canvas.width = 0;
        canvas.height = 0;
      } catch (_) {}

      global.gc?.(); // Force GC if --expose-gc is enabled in node
      await new Promise((r) => setImmediate(r)); // Yield to allow cleanup

      parentPort.postMessage({
        success: true,
        folderName: pdfBaseName,
        imageName: imageName,
        imageIndex: i + 1,
        totalImages: pdf.numPages,
      });
    }

    parentPort.postMessage({
      success: true,
      folderName: pdfBaseName,
      images: imageNames,
    });
  } catch (err) {
    console.error("Failed to process PDF:", err);
    parentPort.postMessage({ success: false, folderName: null, images: [] });
  }
});