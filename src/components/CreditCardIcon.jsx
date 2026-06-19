const CreditCardIcon = ({ color = '#f44336', size = 'md' }) => {
    const sizes = {
        sm: { width: 48, height: 30, rx: 4 },
        md: { width: 72, height: 45, rx: 6 },
        lg: { width: 96, height: 60, rx: 8 }
    };

    const { width, height, rx } = sizes[size] || sizes.md;
    const scale = width / 96;

    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 96 60"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Card background */}
            <rect
                x="0" y="0"
                width="96" height="60"
                rx={rx / scale}
                fill={color}
            />

            {/* Chip */}
            <rect x="10" y="14" width="16" height="12" rx="2"
                fill="rgba(0,0,0,0.25)" />
            <rect x="17" y="14" width="2" height="12"
                fill="rgba(0,0,0,0.15)" />
            <rect x="10" y="19" width="16" height="2"
                fill="rgba(0,0,0,0.15)" />

            {/* Contactless symbol */}
            <path
                d="M72 18 Q78 23 72 28"
                stroke="rgba(0,0,0,0.5)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
            />
            <path
                d="M68 16 Q77 23 68 30"
                stroke="rgba(0,0,0,0.35)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
            />
            <path
                d="M64 14 Q76 23 64 32"
                stroke="rgba(0,0,0,0.2)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
            />

            {/* Bottom lines */}
            <rect x="10" y="44" width="22" height="3" rx="1.5"
                fill="rgba(0,0,0,0.25)" />
            <rect x="36" y="44" width="22" height="3" rx="1.5"
                fill="rgba(0,0,0,0.25)" />
            <rect x="62" y="44" width="22" height="3" rx="1.5"
                fill="rgba(0,0,0,0.25)" />
        </svg>
    );
};

export default CreditCardIcon;