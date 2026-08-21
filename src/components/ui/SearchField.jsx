import { TextField } from '@mui/material';

const SearchField = ({ value, onChange, placeholder = 'Search...', sx = {} }) => (
    <TextField
        placeholder={placeholder}
        size="small"
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputProps={{ style: { fontSize: 13 } }}
        sx={{ mb: 1, ...sx }}
    />
);

export default SearchField;
