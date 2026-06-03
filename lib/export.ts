import * as XLSX from "xlsx";

export type ExportColumn<T> = {
  header: string;
  accessor: (row: T, index: number) => string | number | null | undefined;
};

function cellValue(value: string | number | null | undefined): string {
  if (value == null) return "";
  return String(value);
}

function buildRows<T>(data: T[], columns: ExportColumn<T>[]): string[][] {
  const headers = columns.map((column) => column.header);
  const rows = data.map((row, index) =>
    columns.map((column) => cellValue(column.accessor(row, index)))
  );
  return [headers, ...rows];
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob(["\uFEFF", content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportToCsv<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  const rows = buildRows(data, columns);
  const csv = rows
    .map((row) => row.map(escapeCsvField).join(","))
    .join("\r\n");

  downloadBlob(csv, `${filename}.csv`, "text/csv;charset=utf-8;");
}

export function exportToExcel<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  const rows = buildRows(data, columns);
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Export");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
