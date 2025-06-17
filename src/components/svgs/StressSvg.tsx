import React from "react";

export const StressSvg = ({
    percent,
    name,
    className,
    color,
    onClick,
    onContextMenu,
}: {
    percent: number;
    name: string;
    className?: string;
    color?: string;
    onClick?: () => void;
    onContextMenu?: (e: React.MouseEvent<SVGElement>) => void;
}) => {
    return (
        <svg
            onClick={onClick}
            onContextMenu={(e) => (onContextMenu ? onContextMenu(e) : undefined)}
            className={`hp-icon ${className ?? ""}`}
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
        >
            <defs>
                <linearGradient id={name} x1="0" x2="0" y1="1" y2="0">
                    <stop stopColor={color ?? "#FDED00"} offset="0%" />
                    <stop stopColor={color ?? "#FDED00"} offset={`${isNaN(percent) ? 0 : percent}%`} />
                    <stop stopColor={"black"} offset={`${Math.min(100, isNaN(percent) ? 0 : percent + 40)}%`} />
                    <stop stopColor="black" offset="100%" />
                </linearGradient>
            </defs>
            <path
                d="m298.31-107.39 158.84-285.53-309.38-37.27 456.42-422.62h58.27L501.88-566.88 812.42-530 355.81-107.39h-57.5ZM455.27-278.8l231.35-209.55-273.5-32.54 92.27-160.65-231.81 210.12 272.5 32.88-90.81 159.74ZM480-480.38Z"
                fill={color ?? "#FDED00"}
            />
        </svg>
    );
};
