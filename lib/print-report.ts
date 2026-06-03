export function printHtmlReport(title: string, html: string): void {
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=960,height=720");
  if (!printWindow) return;

  printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; color: #0f172a; margin: 24px; }
      h1 { font-size: 20px; margin: 0 0 4px; }
      p { margin: 0 0 16px; color: #64748b; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; font-size: 11px; }
      th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
      th { background: #f8fafc; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
      tr:nth-child(even) td { background: #f8fafc; }
      @media print {
        body { margin: 12px; }
      }
    </style>
  </head>
  <body>
    ${html}
  </body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export function buildPrintableTableHtml(
  title: string,
  subtitle: string,
  headers: string[],
  rows: string[][]
): string {
  const head = headers.map((header) => `<th>${header}</th>`).join("");
  const body = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`
    )
    .join("");

  return `
    <h1>${title}</h1>
    <p>${subtitle}</p>
    <table>
      <thead><tr>${head}</tr></thead>
      <tbody>${body}</tbody>
    </table>
  `;
}
