import { type TocItem } from "../../src";

export function formatTocAsTable(toc: TocItem[]): string[] {
  const columnOrder = ["depth", "numbering", "parent", "value", "href"] as Array<keyof TocItem>;

  const joinWithDot = (numbering: number[]): string => numbering.join(".") + ".";

  // Create rows
  const rows = toc.map((item) => {
    return columnOrder
      .map((key) => (key === "numbering" ? joinWithDot(item[key]) : String(item[key])))
      .join("\t");
  });

  // Calculate maximum width for each column
  const maxWidths = columnOrder.map((key, index) =>
    Math.max(...rows.map((row) => row.split("\t")[index].length)),
  );

  // Pad each cell to match the maximum width of its column
  const paddedRows = rows.map((row) =>
    row
      .split("\t")
      .map((cell, index) => cell.padEnd(maxWidths[index]))
      .join("\t\t"),
  );

  // give extra space in the beginnig and end
  return paddedRows.map((row) => " " + row + " ");
}
