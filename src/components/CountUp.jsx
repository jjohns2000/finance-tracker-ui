import { useState, useEffect, useRef } from 'react';

const CountUp = ({
    value = 0,
    duration = 1200,
    prefix = '',
    suffix = '',
    decimals = 2,
    style = {},
    className = ''
}) => {
    const [displayValue, setDisplayValue] = useState(0);
    const startTimeRef = useRef(null);
    const startValueRef = useRef(0);
    const frameRef = useRef(null);

    useEffect(() => {
        const target = parseFloat(value) || 0;
        const start = startValueRef.current;

        // Cancel any running animation
        if (frameRef.current) {
            cancelAnimationFrame(frameRef.current);
        }

        startTimeRef.current = null;

        const animate = (timestamp) => {
            if (!startTimeRef.current) {
                startTimeRef.current = timestamp;
            }

            const elapsed = timestamp - startTimeRef.current;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = start + (target - start) * eased;

            setDisplayValue(current);

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(animate);
            } else {
                setDisplayValue(target);
                startValueRef.current = target;
            }
        };

        frameRef.current = requestAnimationFrame(animate);

        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, [value, duration]);

    const formatted = displayValue.toLocaleString('en-CA', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });

    return (
        <span style={style} className={className}>
            {prefix}{formatted}{suffix}
        </span>
    );
};

export default CountUp;