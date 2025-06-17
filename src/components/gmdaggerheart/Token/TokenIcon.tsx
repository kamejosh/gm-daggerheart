import React, { useEffect, useState } from "react";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { GMDMetadata } from "../../../helper/types.ts";
import OBR, { Image } from "@owlbear-rodeo/sdk";
import "./token-icon.scss";
import Tippy from "@tippyjs/react";
import { getTokenName } from "../../../helper/helpers.ts";
import { useShallow } from "zustand/react/shallow";
import { ContextPopover } from "../../general/ContextPopover.tsx";
import { GroupSelect } from "./GroupSelect.tsx";

let timeout: number | undefined = undefined;

export const TokenIcon = ({
    id,
    onClick,
    hideName,
    isDragging,
}: {
    id: string;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => Promise<void>;
    hideName?: boolean;
    isDragging?: boolean;
}) => {
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(id)));
    const data = token?.data as GMDMetadata;
    const item = token?.item as Image;
    const [mouseDown, setMouseDown] = useState<boolean>(false);
    const [contextEvent, setContextEvent] = useState<MouseEvent | null>(null);

    const handleOnPlayerDoubleClick = async () => {
        const bounds = await OBR.scene.items.getItemBounds([id]);
        await OBR.player.select([id]);
        await OBR.viewport.animateToBounds({
            ...bounds,
            min: { x: bounds.min.x - 1000, y: bounds.min.y - 1000 },
            max: { x: bounds.max.x + 1000, y: bounds.max.y + 1000 },
        });
    };

    useEffect(() => {
        if (isDragging) {
            setMouseDown(false);
            clearTimeout(timeout);
        }
    }, [isDragging]);

    return (
        <>
            <ContextPopover context={contextEvent}>
                <>
                    <GroupSelect
                        id={id}
                        onSelect={() => {
                            setContextEvent(null);
                        }}
                        data={data}
                    />
                </>
            </ContextPopover>
            <Tippy
                content={mouseDown ? "Resyncing Statblock..." : getTokenName(item)}
                hideOnClick={!mouseDown}
                className={"token-name-tooltip"}
                disabled={hideName}
            >
                <div
                    className={`token-icon ${mouseDown ? "mouse-down" : ""}`}
                    onDoubleClick={handleOnPlayerDoubleClick}
                    onClick={onClick}
                    onPointerUp={() => {
                        setMouseDown(false);
                        clearTimeout(timeout);
                    }}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        setMouseDown(false);
                        clearTimeout(timeout);
                        setContextEvent(e.nativeEvent);
                    }}
                >
                    <img
                        src={item.image.url}
                        alt={""}
                        className={`${item.scale.x < 0 ? "flipped" : ""}`}
                        style={{ rotate: `${item.rotation + "deg"}` }}
                    />
                </div>
            </Tippy>
        </>
    );
};
