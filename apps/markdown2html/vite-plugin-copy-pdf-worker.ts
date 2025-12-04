/**
 * Vite 插件：自动复制 PDF worker 文件到 public 目录
 */
import { copyFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { Plugin } from "vite";

export function copyPdfWorker(): Plugin {
  return {
    name: "copy-pdf-worker",
    buildStart() {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);

      const sourcePath = join(
        __dirname,
        "../node_modules/pdfjs-dist/build/pdf.worker.min.mjs"
      );
      const destDir = join(__dirname, "../public");
      const destPath = join(destDir, "pdf.worker.min.mjs");

      if (!existsSync(sourcePath)) {
        console.warn(
          "⚠️  PDF worker 文件不存在，请先运行: pnpm install"
        );
        return;
      }

      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
      }

      try {
        copyFileSync(sourcePath, destPath);
        console.log("✅ PDF worker 文件已自动复制到 public 目录");
      } catch (error) {
        console.error("❌ 复制 worker 文件失败:", error);
      }
    },
  };
}

