import type { ReactNode } from 'react';

// ==============================================
// Table Components
// ==============================================

interface TableProps {
  children: ReactNode;
  striped?: boolean;
  hoverable?: boolean;
}

export function Table({ children, striped = false, hoverable = true }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table
        className="w-full border-collapse"
        data-striped={striped}
        data-hoverable={hoverable}
      >
        {children}
      </table>
      <style>{`
        table[data-hoverable="true"] tbody tr:hover {
          background: #f8fafc;
        }
        table[data-striped="true"] tbody tr:nth-child(even) {
          background: #f8fafc;
        }
      `}</style>
    </div>
  );
}

// ==============================================
// Table Head
// ==============================================

interface TableHeadProps {
  children: ReactNode;
}

export function TableHead({ children }: TableHeadProps) {
  return (
    <thead className="bg-slate-50">
      {children}
    </thead>
  );
}

// ==============================================
// Table Body
// ==============================================

interface TableBodyProps {
  children: ReactNode;
}

export function TableBody({ children }: TableBodyProps) {
  return <tbody>{children}</tbody>;
}

// ==============================================
// Table Row
// ==============================================

interface TableRowProps {
  children: ReactNode;
  onClick?: () => void;
  selected?: boolean;
}

export function TableRow({ children, onClick, selected = false }: TableRowProps) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-slate-100 transition-colors duration-150 ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      } ${selected ? 'bg-blue-50' : ''}`}
    >
      {children}
    </tr>
  );
}

// ==============================================
// Table Header Cell
// ==============================================

interface TableThProps {
  children: ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
  sortable?: boolean;
  sorted?: 'asc' | 'desc' | false;
  onSort?: () => void;
}

export function TableTh({
  children,
  align = 'left',
  width,
  sortable = false,
  sorted = false,
  onSort,
}: TableThProps) {
  return (
    <th
      onClick={sortable ? onSort : undefined}
      className={`px-2 py-2 sm:px-4 sm:py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide ${
        sortable ? 'cursor-pointer select-none' : 'cursor-default'
      }`}
      style={{ textAlign: align, width }}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortable && (
          <span className={sorted ? 'text-blue-600' : 'text-slate-300'}>
            {sorted === 'asc' ? '↑' : sorted === 'desc' ? '↓' : '↕'}
          </span>
        )}
      </span>
    </th>
  );
}

// ==============================================
// Table Data Cell
// ==============================================

interface TableTdProps {
  children: ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
  truncate?: boolean;
  maxWidth?: number;
}

export function TableTd({
  children,
  align = 'left',
  width,
  truncate = false,
  maxWidth,
}: TableTdProps) {
  return (
    <td
      className={`px-2 py-2 sm:px-4 sm:py-3 align-middle text-sm/[normal] ${truncate ? 'overflow-hidden text-ellipsis whitespace-nowrap' : ''}`}
      style={{
        textAlign: align,
        width,
        maxWidth: truncate ? maxWidth || 200 : undefined,
      }}
    >
      {children}
    </td>
  );
}

// ==============================================
// Empty Table State
// ==============================================

interface TableEmptyProps {
  colSpan: number;
  icon?: string;
  message?: string;
}

export function TableEmpty({
  colSpan,
  icon = '📭',
  message = 'No data available'
}: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-10 text-center">
        <div className="text-[40px] mb-3">{icon}</div>
        <div className="text-sm/[normal] text-slate-400">{message}</div>
      </td>
    </tr>
  );
}

// ==============================================
// Loading Table State
// ==============================================

interface TableLoadingProps {
  colSpan: number;
  rows?: number;
}

export function TableLoading({ colSpan, rows = 5 }: TableLoadingProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: colSpan }).map((_, j) => (
            <td key={j} className="px-2 py-2 sm:px-4 sm:py-3">
              <div className="h-4 bg-slate-200 rounded animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
