import jsPDF from "jspdf";
import type { Story } from "@shared/schema";

export interface PDFGenerationOptions {
  includeIllustrations?: boolean;
  fontFamily?: string;
  fontSize?: number;
  margin?: number;
}

export function generateStoryPDF(
  story: Story,
  options: PDFGenerationOptions = {},
): Buffer {
  const {
    includeIllustrations = false,
    fontFamily = "Times",
    fontSize = 12,
    margin = 20,
  } = options;

  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;
  let currentY = margin;

  // Set font
  pdf.setFont(fontFamily);

  // Title
  pdf.setFontSize(20);
  pdf.setTextColor(75, 0, 130); // Purple color
  const titleLines = pdf.splitTextToSize(story.title, maxWidth);
  pdf.text(titleLines, margin, currentY);
  currentY += titleLines.length * 12 + 15;

  // Story metadata
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100); // Gray color
  const metadata = `Story for ${story.childName} • Age ${story.childAge} • ${story.tone} tone • ${story.length} length`;
  pdf.text(metadata, margin, currentY);
  currentY += 20;

  // Story content
  pdf.setFontSize(fontSize);
  pdf.setTextColor(0, 0, 0); // Black color

  // Split content into paragraphs
  const paragraphs = story.content.split("\n\n").filter((p) => p.trim());

  for (const paragraph of paragraphs) {
    const lines = pdf.splitTextToSize(paragraph.trim(), maxWidth);

    // Check if we need a new page
    if (currentY + lines.length * fontSize * 0.5 + 10 > pageHeight - margin) {
      pdf.addPage();
      currentY = margin;
    }

    pdf.text(lines, margin, currentY);
    currentY += lines.length * (fontSize * 0.5) + 10;
  }

  // Add bedtime message if present
  if (story.bedtimeMessage && story.bedtimeMessage.trim()) {
    currentY += 10;

    // Check if we need a new page
    if (currentY + 30 > pageHeight - margin) {
      pdf.addPage();
      currentY = margin;
    }

    pdf.setFontSize(fontSize - 1);
    pdf.setTextColor(128, 0, 128); // Purple color
    const messageLines = pdf.splitTextToSize(
      `💝 ${story.bedtimeMessage}`,
      maxWidth,
    );
    pdf.text(messageLines, margin, currentY);
  }

  // Footer
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    const footerText = `Created with Bedtime Stories • Page ${i} of ${totalPages}`;
    const footerWidth = pdf.getTextWidth(footerText);
    pdf.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 10);
  }

  return Buffer.from(pdf.output("arraybuffer"));
}

export function generateEnhancedPDF(story: Story): Buffer {
  return generateStoryPDF(story, {
    includeIllustrations: true,
    fontFamily: "Times",
    fontSize: 13,
    margin: 25,
  });
}
