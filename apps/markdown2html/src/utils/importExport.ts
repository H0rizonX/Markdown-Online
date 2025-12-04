/**
 * 导入导出工具模块
 * 支持：导入（PDF、MD）、导出（PDF、MD、HTML）
 */

import type { Editor } from "@tiptap/core";
import { message } from "antd";

// ==================== 类型定义 ====================

export type ImportFormat = "markdown" | "pdf";
export type ExportFormat = "markdown" | "html" | "pdf";

// ==================== 导入功能 ====================

/**
 * 简单的 Markdown 到 HTML 转换器
 * 支持基础语法：标题、加粗、斜体、代码、列表、链接、图片等
 */
function markdownToHTML(markdown: string): string {
  let html = markdown;
  
  // 代码块（需要先处理，避免其他规则影响）
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, lang, code) => {
    const language = lang || '';
    return `<pre><code class="language-${language}">${code.trim()}</code></pre>`;
  });
  
  // 行内代码
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // 标题
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // 加粗和斜体（需要按顺序处理）
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');
  
  // 链接
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // 图片
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
  
  // 水平线
  html = html.replace(/^---$/gim, '<hr />');
  html = html.replace(/^\*\*\*$/gim, '<hr />');
  
  // 无序列表
  html = html.replace(/^[\*\-] (.+)$/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // 有序列表
  html = html.replace(/^\d+\. (.+)$/gim, '<li>$1</li>');
  
  // 引用块
  html = html.replace(/^> (.+)$/gim, '<blockquote>$1</blockquote>');
  
  // 段落（将连续的非空行转换为段落）
  html = html.split('\n\n').map(para => {
    const trimmed = para.trim();
    if (!trimmed) return '';
    // 如果已经是 HTML 标签，不包装
    if (trimmed.startsWith('<')) return trimmed;
    return `<p>${trimmed}</p>`;
  }).join('\n');
  
  return html;
}

/**
 * 导入 Markdown 文件
 */
export async function importMarkdown(
  file: File,
  editor: Editor
): Promise<void> {
  try {
    const text = await file.text();
    // 将 Markdown 转换为 HTML，然后导入到 Tiptap
    const html = markdownToHTML(text);
    editor.commands.setContent(html);
    message.success("Markdown 文件导入成功");
  } catch (error) {
    console.error("导入 Markdown 失败:", error);
    message.error("导入失败，请检查文件格式");
    throw error;
  }
}

/**
 * 导入 PDF 文件（提取文本）
 * 注意：浏览器端 PDF 解析能力有限，这里做基础实现
 */
export async function importPDF(
  file: File,
  _editor: Editor
): Promise<void> {
  try {
    // 使用 FileReader 读取 PDF（基础实现）
    // 实际项目中建议使用 pdf.js 或后端解析
    await file.arrayBuffer();
    
    // 简单提示：PDF 解析需要后端支持或使用 pdf.js
    message.warning("PDF 导入功能需要后端支持，当前仅支持文本提取");
    
    // 这里可以调用后端 API 解析 PDF
    // const formData = new FormData();
    // formData.append('file', file);
    // const response = await fetch('/api/parse-pdf', { method: 'POST', body: formData });
    // const { text } = await response.json();
    // editor.commands.setContent(text);
    
    // 临时方案：提示用户
    message.info("PDF 导入功能开发中，请使用 Markdown 格式");
  } catch (error) {
    console.error("导入 PDF 失败:", error);
    message.error("导入失败，请检查文件格式");
    throw error;
  }
}

/**
 * 处理文件导入
 */
export async function handleImport(
  file: File,
  format: ImportFormat,
  editor: Editor
): Promise<void> {
  if (format === "markdown") {
    await importMarkdown(file, editor);
  } else if (format === "pdf") {
    await importPDF(file, editor);
  }
}

// ==================== 导出功能 ====================

/**
 * 将 Tiptap JSON 转换为 Markdown
 */
function tiptapToMarkdown(json: any): string {
  // 递归处理节点
  function processNode(node: any): string {
    if (!node || !node.type) return "";

    const { type, content, text, marks, attrs } = node;

    // 处理文本节点
    if (type === "text") {
      let textContent = text || "";
      
      // 处理标记（加粗、斜体等）
      if (marks) {
        for (const mark of marks) {
          if (mark.type === "bold") textContent = `**${textContent}**`;
          if (mark.type === "italic") textContent = `*${textContent}*`;
          if (mark.type === "code") textContent = `\`${textContent}\``;
          if (mark.type === "strike") textContent = `~~${textContent}~~`;
        }
      }
      
      return textContent;
    }

    // 处理块级节点
    switch (type) {
      case "paragraph":
        if (content) {
          const paraText = content.map(processNode).join("");
          return paraText ? paraText + "\n\n" : "\n";
        }
        return "\n";
      
      case "heading":
        const level = attrs?.level || 1;
        const headingText = content ? content.map(processNode).join("") : "";
        return `${"#".repeat(level)} ${headingText}\n\n`;
      
      case "bulletList":
      case "orderedList":
        if (content) {
          return content.map((item: any, index: number) => {
            const prefix = type === "orderedList" ? `${index + 1}. ` : "- ";
            const itemText = item.content
              ? item.content.map(processNode).join("")
              : "";
            return `${prefix}${itemText}\n`;
          }).join("") + "\n";
        }
        return "";
      
      case "blockquote":
        if (content) {
          const quoteText = content.map(processNode).join("").trim();
          return quoteText.split("\n").map((line: string) => `> ${line}`).join("\n") + "\n\n";
        }
        return "";
      
      case "codeBlock":
        const code = content ? content.map(processNode).join("") : "";
        const language = attrs?.language || "";
        return `\`\`\`${language}\n${code}\n\`\`\`\n\n`;
      
      case "horizontalRule":
        return "---\n\n";
      
      case "image":
        const src = attrs?.src || "";
        const alt = attrs?.alt || "";
        return `![${alt}](${src})\n\n`;
      
      case "table":
        if (content) {
          // 简化处理：只提取文本
          return content.map(processNode).join("") + "\n\n";
        }
        return "";
      
      default:
        // 递归处理子节点
        if (content && Array.isArray(content)) {
          return content.map(processNode).join("");
        }
        return "";
    }
  }

  // 处理文档根节点
  if (json.content && Array.isArray(json.content)) {
    return json.content.map(processNode).join("").trim();
  }
  
  return "";
}

/**
 * 导出为 Markdown
 */
export async function exportToMarkdown(editor: Editor, filename?: string): Promise<void> {
  try {
    const json = editor.getJSON();
    const markdown = tiptapToMarkdown(json);
    
    // 创建下载链接
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || `document-${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    message.success("Markdown 文件导出成功");
  } catch (error) {
    console.error("导出 Markdown 失败:", error);
    message.error("导出失败，请重试");
    throw error;
  }
}

/**
 * 导出为 HTML
 */
export async function exportToHTML(editor: Editor, filename?: string): Promise<void> {
  try {
    const html = editor.getHTML();
    
    // 创建完整的 HTML 文档
    const fullHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${filename || "Document"}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
      color: #333;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
    }
    h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
    h3 { font-size: 1.25em; }
    p { margin: 16px 0; }
    code {
      background-color: #f6f8fa;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 0.9em;
    }
    pre {
      background-color: #f6f8fa;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
    }
    pre code {
      background-color: transparent;
      padding: 0;
    }
    blockquote {
      border-left: 4px solid #dfe2e5;
      padding-left: 16px;
      color: #6a737d;
      margin: 16px 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 16px 0;
    }
    table th, table td {
      border: 1px solid #dfe2e5;
      padding: 8px 12px;
    }
    table th {
      background-color: #f6f8fa;
      font-weight: 600;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    ul, ol {
      padding-left: 30px;
      margin: 16px 0;
    }
    hr {
      border: none;
      border-top: 2px solid #eaecef;
      margin: 24px 0;
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
    
    // 创建下载链接
    const blob = new Blob([fullHTML], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || `document-${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    message.success("HTML 文件导出成功");
  } catch (error) {
    console.error("导出 HTML 失败:", error);
    message.error("导出失败，请重试");
    throw error;
  }
}

/**
 * 导出为 PDF
 * 使用 html2canvas + jspdf（需要安装依赖）
 */
export async function exportToPDF(editor: Editor, filename?: string): Promise<void> {
  try {
    // 动态导入，避免打包时出错
    // @ts-ignore - 动态导入，类型可能不存在
    const html2canvas = (await import("html2canvas")).default;
    // @ts-ignore - 动态导入，类型可能不存在
    const { jsPDF } = await import("jspdf");
    
    // 获取编辑器 DOM 元素
    const editorElement = editor.view.dom;
    if (!editorElement) {
      throw new Error("编辑器元素未找到");
    }
    
    message.loading({ content: "正在生成 PDF...", key: "pdf-export", duration: 0 });
    
    // 将编辑器内容转换为 canvas
    const canvas = await html2canvas(editorElement, {
      scale: 2,
      useCORS: true,
      logging: false,
    });
    
    const imgData = canvas.toDataURL("image/png");
    
    // 创建 PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    
    const imgWidth = 210; // A4 宽度（mm）
    const pageHeight = 297; // A4 高度（mm）
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    // 添加第一页
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    // 如果内容超过一页，添加多页
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    // 下载 PDF
    pdf.save(filename || `document-${Date.now()}.pdf`);
    
    message.success({ content: "PDF 文件导出成功", key: "pdf-export" });
  } catch (error) {
    console.error("导出 PDF 失败:", error);
    message.error({ content: "导出失败，请重试", key: "pdf-export" });
    
    // 如果依赖未安装，提示用户
    if (error instanceof Error && error.message.includes("Cannot find module")) {
      message.warning("PDF 导出功能需要安装 html2canvas 和 jspdf 依赖");
    }
    
    throw error;
  }
}

/**
 * 处理文件导出
 */
export async function handleExport(
  format: ExportFormat,
  editor: Editor,
  filename?: string
): Promise<void> {
  if (format === "markdown") {
    await exportToMarkdown(editor, filename);
  } else if (format === "html") {
    await exportToHTML(editor, filename);
  } else if (format === "pdf") {
    await exportToPDF(editor, filename);
  }
}

