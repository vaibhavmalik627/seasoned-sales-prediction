import { jsPDF } from "jspdf";

function wrapText(doc, text, maxWidth) {
  return doc.splitTextToSize(text, maxWidth);
}

export function downloadPdfReport(fileName, { title, subtitle, body, bullets = [] }) {
  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;
  let cursorY = 64;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(title || "Retail Forecast Report", margin, cursorY);

  cursorY += 24;
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(90, 104, 112);
    doc.text(subtitle, margin, cursorY);
    cursorY += 28;
  }

  doc.setTextColor(31, 47, 53);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  const bodyLines = wrapText(doc, body || "", maxWidth);
  doc.text(bodyLines, margin, cursorY);
  cursorY += bodyLines.length * 16 + 18;

  if (bullets.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("Key Points", margin, cursorY);
    cursorY += 18;
    doc.setFont("helvetica", "normal");

    bullets.forEach((bullet) => {
      const lines = wrapText(doc, `• ${bullet}`, maxWidth - 10);
      if (cursorY + lines.length * 16 > pageHeight - margin) {
        doc.addPage();
        cursorY = 64;
      }
      doc.text(lines, margin, cursorY);
      cursorY += lines.length * 16 + 8;
    });
  }

  doc.save(fileName);
}
