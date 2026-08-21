import { Box, Typography } from '@mui/material';
import EmptyState from './EmptyState';

/**
 * columns: [{ key, label, align: 'left'|'right'|'center', width: '2fr' }]
 * renderCell(row, column) — defaults to row[column.key] when omitted
 */
const DataTable = ({
    columns,
    rows,
    getRowKey = (row, index) => row.publicId ?? row.id ?? index,
    renderCell,
    onRowClick,
    emptyMessage = 'No data found.',
    maxHeight,
    bodySx = {},
}) => {
    const gridTemplateColumns = columns.map((c) => c.width || '1fr').join(' ');

    return (
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns,
                    px: 2,
                    py: 1.5,
                    bgcolor: 'background.default',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                {columns.map((col) => (
                    <Typography
                        key={col.key}
                        variant="caption"
                        color="text.secondary"
                        fontWeight={600}
                        textAlign={col.align || 'left'}
                    >
                        {col.label}
                    </Typography>
                ))}
            </Box>

            <Box sx={{ ...(maxHeight ? { maxHeight, overflowY: 'auto' } : {}), ...bodySx }}>
                {rows.length === 0 ? (
                    <EmptyState message={emptyMessage} py={3} />
                ) : (
                    rows.map((row, index) => (
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
                                        justifyContent:
                                            col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start',
                                    }}
                                >
                                    {renderCell ? renderCell(row, col) : row[col.key]}
                                </Box>
                            ))}
                        </Box>
                    ))
                )}
            </Box>
        </Box>
    );
};

export default DataTable;
