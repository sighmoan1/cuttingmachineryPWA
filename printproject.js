const fs = require("fs");
const path = require("path");
const ignore = require("ignore");

// Read .gitignore file
const gitignorePath = path.join(__dirname, ".gitignore");
let ignoredPatterns = [
  "package-lock.json",
  "manifest.json",
  ".git",
  ".gitignore",
  "README.md",
  ".env.local",
  "tailwind.config.ts",
  "tsconfig.json",
  "package.json",
  "postcss.config.mjs",
  "project.zip",
  "zipproject.js",
  "project_contents.md",
  "writeproject.js",
  "printproject.js",
  ".DS_Store",
];
if (fs.existsSync(gitignorePath)) {
  ignoredPatterns = ignoredPatterns.concat(
    fs.readFileSync(gitignorePath, "utf-8").split("\n").filter(Boolean)
  );
}

const ig = ignore().add(ignoredPatterns);

// Function to check if a file is ignored or has an excluded extension
function isIgnored(filePath) {
  const excludedExtensions = [
    ".ico",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".otf",
    ".svg",
    ".css",
    ".zip",
    ".png",
    ".old",
    ".mp3",
  ];
  const fileExtension = path.extname(filePath).toLowerCase();
  return ig.ignores(filePath) || excludedExtensions.includes(fileExtension);
}

// Create or overwrite output file
const outputFilePath = path.join(__dirname, "project_contents.md");
const output = fs.createWriteStream(outputFilePath);

// Recursively read and write the contents of files with headers and code blocks
function writeFilesToOutput(directory) {
  const files = fs.readdirSync(directory);
  files.forEach((file) => {
    const fullPath = path.join(directory, file);
    const relativePath = path.relative(__dirname, fullPath);

    // Skip if it's in the ignore list or is a directory that should be skipped
    if (isIgnored(relativePath) || file === ".git" || file === "node_modules") {
      return;
    }

    if (fs.lstatSync(fullPath).isDirectory()) {
      writeFilesToOutput(fullPath); // Recursively process subdirectories
    } else {
      // Write the file name as a header and its content as a code block
      const extension = path.extname(file).substring(1); // Get file extension without the dot
      output.write(`\n### ${relativePath}\n\n\`\`\`${extension}\n`);
      const fileContent = fs.readFileSync(fullPath, "utf-8");
      output.write(fileContent + `\n\`\`\`\n`);
    }
  });
}

// Start writing from the root of the project
writeFilesToOutput(__dirname);

// Close the output stream when done
output.end(() => {
  console.log(`Contents written to ${outputFilePath}`);
});
