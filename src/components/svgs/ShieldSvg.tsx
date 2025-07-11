import React from "react";

export const ShieldSvg = ({
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
            className={"shield-icon"}
            height="24"
            width="20"
            xmlns="http://www.w3.org/2000/svg"
        >
            <polygon points="0,0 10,6 20,0 20,16 10,24 0,16, 0,0" />
        </svg>
    );
};
