import React from "react";

export const HPSvg = ({
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
                    <stop stopColor={color ?? "#AA1404"} offset="0%" />
                    <stop stopColor={color ?? "#AA1404"} offset={`${isNaN(percent) ? 0 : percent}%`} />
                    <stop stopColor={"black"} offset={`${Math.min(100, isNaN(percent) ? 0 : percent + 40)}%`} />
                    <stop stopColor="black" offset="100%" />
                </linearGradient>
            </defs>
            <path
                d="m480-120-58-52q-101-91-167-157T150-447.5Q111-500 95.5-544T80-634q0-94 63-157t157-63q52 0 99 22t81 62q34-40 81-62t99-22q94 0 157 63t63 157q0 46-15.5 90T810-447.5Q771-395 705-329T538-172l-58 52Z"
                fill={`url(#${name})`}
            />
            <path
                d="m480-155.81-40.92-36.96q-98.06-89.04-162.19-153.02-64.12-63.98-101.63-113.65-37.52-49.67-52.35-90.63-14.83-40.96-14.83-83.12 0-82.74 55.8-138.54 55.81-55.81 138.54-55.81 51.74 0 97.78 24.5 46.03 24.5 79.8 71.08 34.88-46.58 80.29-71.08 45.4-24.5 97.29-24.5 82.73 0 138.54 55.79 55.8 55.78 55.8 138.48 0 42.23-14.83 83.19-14.83 40.97-52.33 90.62-37.5 49.65-101.52 113.67-64.01 64.03-162.32 153.02L480-155.81Zm0-75.42q94.32-85.61 155.52-146.46 61.2-60.85 96.82-105.96 35.62-45.12 49.62-80.15 14-35.03 14-69.36 0-59.53-39.55-98.97-39.55-39.45-98.59-39.45-47.01 0-86.95 26.89-39.95 26.88-64.52 75.92h-52.7q-24.96-49.42-64.71-76.11-39.75-26.7-86.76-26.7-58.66 0-98.4 39.45-39.74 39.44-39.74 98.99 0 34.35 14.03 69.39 14.02 35.04 49.59 80.1 35.57 45.07 96.76 105.86Q385.62-317 480-231.23Zm0-270.27Z"
                fill={color ?? "#AA1404"}
            />
        </svg>
    );
};
