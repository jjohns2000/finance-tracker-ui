import { Box, Typography } from '@mui/material';
import EmptyState from './EmptyState';

/**
 * columns: [{ key, label, align: 'left'|'right'|'center', width: '2fr', mobileHidden: true }]
 * mobileHidden — omit this column's label from the mobile header (e.g. a "Type" column
 * folded into the previous column's mobileRenderRow content instead of shown separately)
 * renderCell(row, column) — defaults to row[column.key] when omitted
 * mobileRenderRow(row) — optional; when given, rows below the `sm` breakpoint render this
 * (wrapped in the same bordered/hover row chrome) instead of the grid columns, for tables
 * whose columns get too cramped on narrow screens. If the mobile content is itself a grid
 * of values (as opposed to a free-form card), set `gridTemplateColumns: mobileColumnWidths(columns)`
 * (exported below) so it lines up with the mobile header — same widths, same column count.
 * hideMobileHeader — set when mobileRenderRow's own content already labels each value
 * (e.g. "Initial opening: $0.00"), making a cramped multi-column header redundant
 */

/** The columns (and their widths) the mobile header/grid uses — labeled, non-mobileHidden ones. */
export const mobileColumns = (columns) => columns.filter((c) => c.label && !c.mobileHidden);
export const mobileColumnWidths = (columns) => mobileColumns(columns).map((c) => c.width || '1fr').join(' ');

const DataTable = ({
    columns,
    rows,
    getRowKey = (row, index) => row.publicId ?? row.id ?? index,
    renderCell,
    mobileRenderRow,
    hideMobileHeader = false,
    onRowClick,
    emptyMessage = 'No data found.',
    maxHeight,
    bodySx = {},
}) => {
    const gridTemplateColumns = columns.map((c) => c.width || '1fr').join(' ');
    const labeledColumns = mobileColumns(columns);
    const mobileGridTemplateColumns = mobileColumnWidths(columns);

    const renderHeaderLabels = (cols) =>
        cols.map((col) => (
            <Typography
                key={col.key}
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                textAlign={col.align || 'left'}
                noWrap
                sx={{ minWidth: 0 }}
            >
                {col.label}
            </Typography>
        ));

    return (
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            <Box
                sx={{
                    display: mobileRenderRow ? { xs: 'none', sm: 'grid' } : 'grid',
                    gridTemplateColumns,
                    px: 2,
                    py: 1.5,
                    bgcolor: 'background.default',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                {renderHeaderLabels(columns)}
            </Box>

            {mobileRenderRow && !hideMobileHeader && (
                <Box
                    sx={{
                        display: { xs: 'grid', sm: 'none' },
                        gridTemplateColumns: mobileGridTemplateColumns,
                        px: 2,
                        py: 1.5,
                        bgcolor: 'background.default',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    {renderHeaderLabels(labeledColumns)}
                </Box>
            )}

            <Box sx={{ ...(maxHeight ? { maxHeight, overflowY: 'auto' } : {}), ...bodySx }}>
                {rows.length === 0 ? (
                    <EmptyState message={emptyMessage} py={3} />
                ) : (
                    <>
                        <Box sx={{ display: mobileRenderRow ? { xs: 'none', sm: 'block' } : 'block' }}>
                            {rows.map((row, index) => (
                                <Box
                                    key={getRowKey(row, index)}
                                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns,
                                        px: 2,
                                        py: 1.5,
                                        alignItems: 'center',
                                        cursor: onRowClick ? 'pointer' : 'default',
                                        borderBottom: index < rows.length - 1 ? '1px solid' : 'none',
                                        borderColor: 'divider',
                                        '&:hover': { bgcolor: 'action.hover' },
                                    }}
                                >
                                    {columns.map((col) => (
                                        <Box
                                            key={col.key}
                                            sx={{
                                                display: 'flex',
                                                minWidth: 0,
                                                overflow: 'hidden',
                                                justifyContent:
                                                    col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start',
                                                '& > *': { minWidth: 0 },
                                            }}
                                        >
                                            {renderCell ? renderCell(row, col) : row[col.key]}
                                        </Box>
                                    ))}
                                </Box>
                            ))}
                        </Box>

                        {mobileRenderRow && (
                            <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                                {rows.map((row, index) => (
                                    <Box
                                        key={getRowKey(row, index)}
                                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                                        sx={{
                                            px: 2,
                                            py: 1.5,
                                            cursor: onRowClick ? 'pointer' : 'default',
                                            borderBottom: index < rows.length - 1 ? '1px solid' : 'none',
                                            borderColor: 'divider',
                                            '&:hover': { bgcolor: 'action.hover' },
                                        }}
                                    >
                                        {mobileRenderRow(row)}
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </>
                )}
            </Box>
        </Box>
    );
};

export default DataTable;
