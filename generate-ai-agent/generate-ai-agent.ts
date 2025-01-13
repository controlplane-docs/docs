import fs from "fs";
import path from "path";

interface Config {
  rootDir: string;
  outputFile: string;
  excludeFolders: string[];
  excludeFiles: string[];
  fileExtension: string;
}

const config: Config = {
  rootDir: "./../", // Root directory of the project
  outputFile: "./../ai-agent.mdx", // Name of the generated file
  excludeFolders: ["node_modules", ".git", "generate-ai-agent", "api-reference", "references"], // Folders to exclude
  excludeFiles: ["ai-agent.mdx", "exclude-this-file.mdx"], // Files to exclude
  fileExtension: ".mdx", // Target file extension
};

/**
 * Recursively collect files from a directory while respecting exclusions.
 */
function collectFiles(dir: string, excludeFolders: string[], excludeFiles: string[], extension: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!excludeFolders.includes(entry.name)) {
        files.push(...collectFiles(fullPath, excludeFolders, excludeFiles, extension));
      }
    } else if (entry.isFile() && fullPath.endsWith(extension) && !excludeFiles.includes(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Extract metadata and content from the MDX file.
 */
function extractFileData(filePath: string): { title: string; content: string } {
  const content = fs.readFileSync(filePath, "utf-8");
  const titleMatch = content.match(/title:\s*(.+)/); // Simple regex to extract the title
  const title = titleMatch ? titleMatch[1].trim() : path.basename(filePath, config.fileExtension);
  return { title, content };
}

/**
 * Group files by folder structure for generating sections.
 */
function groupFilesByFolder(files: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};

  files.forEach((file) => {
    const folder = path.dirname(file);
    if (!grouped[folder]) {
      grouped[folder] = [];
    }
    grouped[folder].push(file);
  });

  return grouped;
}

/**
 * Generate the `ai-agent.mdx` file with the collected pages.
 */
function generateAiAgentFile() {
  const { rootDir, outputFile, excludeFolders, excludeFiles, fileExtension } = config;

  // Collect all .mdx files
  const files = collectFiles(rootDir, excludeFolders, excludeFiles, fileExtension);

  // Group files by folder
  const groupedFiles = groupFilesByFolder(files);

  // Create content for the ai-agent.mdx file
  const fileContent = `
---
title: AI Agent Helper
---

This file aggregates all pages in the project to assist AI agents.

## Sections
${Object.entries(groupedFiles)
  .map(([folder, files]) => {
    const sectionName = path.relative(rootDir, folder) || "Root";
    const sectionContent = files
      .map((file) => {
        const relativePath = path.relative(rootDir, file);
        const { title, content } = extractFileData(file);
        return `
### ${title}
**Path**: \`${relativePath}\`

${content.trim()}
`;
      })
      .join("\n");
    return `## ${sectionName}\n\n${sectionContent}`;
  })
  .join("\n\n")}
`;

  // Write the content to the output file
  fs.writeFileSync(outputFile, fileContent.trim(), "utf-8");
  console.log(`File "${outputFile}" has been generated successfully.`);
}

// Run the script
generateAiAgentFile();
