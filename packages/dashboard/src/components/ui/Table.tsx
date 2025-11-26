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
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{ width: '100%', borderCollapse: 'collapse' }}
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
    <thead style={{ background: '#f8fafc' }}>
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
      style={{
        borderBottom: '1px solid #f1f5f9',
        cursor: onClick ? 'pointer' : 'default',
        background: selected ? '#eff6ff' : undefined,
        transition: 'background 0.15s ease',
      }}
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
      style={{
        padding: '12px 16px',
        textAlign: align,
        fontSize: 11,
        fontWeight: 600,
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        width,
        cursor: sortable ? 'pointer' : 'default',
        userSelect: sortable ? 'none' : undefined,
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {children}
        {sortable && (
          <span style={{ color: sorted ? '#2563eb' : '#cbd5e1' }}>
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
      style={{
        padding: '12px 16px',
        textAlign: align,
        verticalAlign: 'middle',
        fontSize: 14,
        width,
        maxWidth: truncate ? maxWidth || 200 : undefined,
        overflow: truncate ? 'hidden' : undefined,
        textOverflow: truncate ? 'ellipsis' : undefined,
        whiteSpace: truncate ? 'nowrap' : undefined,
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
      <td colSpan={colSpan} style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
        <div style={{ fontSize: 14, color: '#94a3b8' }}>{message}</div>
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
            <td key={j} style={{ padding: '12px 16px' }}>
              <div
                style={{
                  height: 16,
                  background: '#e2e8f0',
                  borderRadius: 4,
                  animation: 'pulse 1.5s infinite',
                }}
              />
            </td>
          ))}
        </tr>
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
}