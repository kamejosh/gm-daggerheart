import React from "react";

export const SpotlightSvg = ({
    onClick,
    onContextMenu,
}: {
    onClick: () => void;
    onContextMenu: (e: React.MouseEvent<SVGElement>) => void;
}) => {
    return (
        <svg
            onClick={onClick}
            onContextMenu={(e) => onContextMenu(e)}
            className={"spotlight-icon"}
            height="24"
            viewBox="0 -960 960 960"
            width="24"
            version="1.1"
        >
            <path d="M64.62-450v-60h220v60h-220ZM320-597.85l-77.84-77.84 42.15-42.15L362.15-640 320-597.85Zm130-77.53v-220h60v220h-60Zm190 77.53L597.85-640l77.84-77.84 42.15 42.15L640-597.85ZM675.38-450v-60h220v60h-220ZM480-380q-41.92 0-70.96-29.04Q380-438.08 380-480q0-41.92 29.04-70.96Q438.08-580 480-580q41.92 0 70.96 29.04Q580-521.92 580-480q0 41.92-29.04 70.96Q521.92-380 480-380Zm195.69 137.84L597.85-320 640-362.15l77.84 77.84-42.15 42.15Zm-391.38 0-42.15-42.15L320-362.15 362.15-320l-77.84 77.84ZM450-64.62v-220h60v220h-60Z" />
        </svg>
    );
};
