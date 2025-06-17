import React from "react";

export const DiamondSvg = ({
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
            className={"diamond-icon"}
            height="24"
            viewBox="0 -960 960 960"
            width="24"
            version="1.1"
        >
            <path d="M480-80 240-480l240-400 240 400L480-80Zm0-156 147-244-147-244-147 244 147 244Zm0-244Z" />
        </svg>
    );
};
