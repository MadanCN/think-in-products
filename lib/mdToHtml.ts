// Minimal markdown-to-HTML converter for newsletter emails and previews.
// Handles headings, bold, italic, links, code, lists, blockquotes, hr, paragraphs.
export function mdToHtml(md: string): string {
  if (!md.trim()) return "";

  const lines = md.split("\n");
  const output: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Headings
    const h3 = line.match(/^### (.+)$/);
    if (h3) {
      output.push(
        `<h3 style="font-size:18px;font-weight:600;color:#0F172A;margin:24px 0 8px 0">${inline(h3[1])}</h3>`
      );
      i++;
      continue;
    }
    const h2 = line.match(/^## (.+)$/);
    if (h2) {
      output.push(
        `<h2 style="font-size:22px;font-weight:700;color:#0F172A;margin:28px 0 10px 0">${inline(h2[1])}</h2>`
      );
      i++;
      continue;
    }
    const h1 = line.match(/^# (.+)$/);
    if (h1) {
      output.push(
        `<h1 style="font-size:28px;font-weight:800;color:#0F172A;margin:32px 0 12px 0">${inline(h1[1])}</h1>`
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      output.push(
        `<hr style="border:none;border-top:1px solid #E2E8F0;margin:32px 0" />`
      );
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      const content = line.slice(2);
      output.push(
        `<blockquote style="border-left:3px solid #00A896;padding:8px 16px;margin:16px 0;color:#475569;font-style:italic">${inline(content)}</blockquote>`
      );
      i++;
      continue;
    }

    // Unordered list — collect consecutive items
    if (line.match(/^[\-\*] /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[\-\*] /)) {
        items.push(
          `<li style="margin:5px 0;color:#334155">${inline(lines[i].slice(2))}</li>`
        );
        i++;
      }
      output.push(
        `<ul style="padding-left:24px;margin:12px 0">${items.join("")}</ul>`
      );
      continue;
    }

    // Ordered list — collect consecutive items
    if (line.match(/^\d+\. /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(
          `<li style="margin:5px 0;color:#334155">${inline(lines[i].replace(/^\d+\. /, ""))}</li>`
        );
        i++;
      }
      output.push(
        `<ol style="padding-left:24px;margin:12px 0">${items.join("")}</ol>`
      );
      continue;
    }

    // Regular paragraph — collect until blank line or block element
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].match(/^#{1,3} /) &&
      !lines[i].match(/^---+$/) &&
      !lines[i].startsWith("> ") &&
      !lines[i].match(/^[\-\*] /) &&
      !lines[i].match(/^\d+\. /)
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      output.push(
        `<p style="margin:0 0 16px;color:#334155;line-height:1.75">${paraLines.map(inline).join("<br>")}</p>`
      );
    }
  }

  return output.join("\n");
}

function inline(text: string): string {
  return text
    // Bold+italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Links
    .replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" style="color:#00E5CC;text-decoration:none">$1</a>'
    )
    // Inline code
    .replace(
      /`(.+?)`/g,
      '<code style="background:#F1F5F9;color:#0891B2;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:13px;border:1px solid #E2E8F0">$1</code>'
    );
}
