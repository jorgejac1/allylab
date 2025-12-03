import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableTh,
  TableTd,
  TableEmpty,
  TableLoading,
} from "../../../components/ui/Table";

describe("ui/Table", () => {
  it("renders striped and hoverable table", () => {
    render(
      <Table striped hoverable>
        <TableHead>
          <tr>
            <TableTh>Head</TableTh>
          </tr>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableTd>Cell</TableTd>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByText("Head")).toBeInTheDocument();
    expect(screen.getByText("Cell")).toBeInTheDocument();
  });

  it("handles sortable headers and selected rows", () => {
    const onSort = vi.fn();
    render(
      <Table>
        <TableHead>
          <tr>
            <TableTh sortable sorted="asc" onSort={onSort}>
              Name
            </TableTh>
            <TableTh sortable sorted="desc">
              Desc
            </TableTh>
            <TableTh sortable sorted={false}>
              None
            </TableTh>
          </tr>
        </TableHead>
        <TableBody>
          <TableRow selected onClick={onSort}>
            <TableTd>Row</TableTd>
          </TableRow>
        </TableBody>
      </Table>
    );

    fireEvent.click(screen.getByText("Name"));
    fireEvent.click(screen.getByText("Row"));
    expect(onSort).toHaveBeenCalledTimes(2);

    const arrows = screen.getAllByText(/↑|↓|↕/);
    expect(arrows[0]).toHaveStyle({ color: "#2563eb" });
    expect(arrows[1]).toHaveTextContent("↓");
    expect(arrows[1]).toHaveStyle({ color: "#2563eb" });
    expect(arrows[2]).toHaveTextContent("↕");
    expect(arrows[2]).toHaveStyle({ color: "#cbd5e1" });
  });

  it("renders empty and loading states", () => {
    const { container } = render(
      <Table>
        <TableBody>
          <TableEmpty colSpan={2} icon="❗" message="Nothing here" />
          <TableLoading colSpan={2} rows={2} />
          <TableRow>
            <TableTd truncate maxWidth={180}>
              Very long content that should be truncated
            </TableTd>
            <TableTd truncate>
              Uses default max width
            </TableTd>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(4); // 1 empty + 2 loading + 1 truncate row
    const skeletonCell = within(rows[1] as HTMLElement).getAllByRole("cell")[0];
    expect((skeletonCell.firstChild as HTMLElement)).toHaveStyle({ animation: "pulse 1.5s infinite" });

    const [truncateCell, defaultCell] = within(rows[3] as HTMLElement).getAllByRole("cell");
    expect(truncateCell).toHaveStyle({
      maxWidth: "180px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    });
    expect(defaultCell).toHaveStyle({ maxWidth: "200px" });
  });
});
