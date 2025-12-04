/**
 * 将 pdfjs-dist 的 worker 文件复制到 public 目录
 * 在构建前运行此脚本
 */
import { copyFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sourcePath = join(__dirname, "../node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
const destDir = join(__dirname, "../public");
const destPath = join(destDir, "pdf.worker.min.mjs");

if (!existsSync(sourcePath)) {
  console.error("❌ Worker 文件不存在:", sourcePath);
  console.log("请先运行: pnpm install");
  process.exit(1);
}

if (!existsSync(destDir)) {
  mkdirSync(destDir, { recursive: true });
}

try {
  copyFileSync(sourcePath, destPath);
  console.log("✅ PDF worker 文件已复制到 public 目录");
} catch (error) {
  console.error("❌ 复制 worker 文件失败:", error);
  process.exit(1);
}

