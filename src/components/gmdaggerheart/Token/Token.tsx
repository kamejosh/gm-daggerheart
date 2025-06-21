import { GMDMetadata } from "../../../helper/types.ts";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import React, { useRef } from "react";
import OBR, { Image, Item } from "@owlbear-rodeo/sdk";
import { itemMetadataKey } from "../../../helper/variables.ts";
import _ from "lodash";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { HP } from "./HP.tsx";
import { TokenIcon } from "./TokenIcon.tsx";
import { useComponentContext } from "../../../context/ComponentContext.tsx";
import { useShallow } from "zustand/react/shallow";
import { Stats } from "./Stats.tsx";
import { Stress } from "./Stress.tsx";
import { Armor } from "./Armor.tsx";
import { Hope } from "./Hope.tsx";
import { Evasion } from "./Evasion.tsx";
import { Spotlight } from "./Spotlight.tsx";
import { Thresholds } from "./Thresholds.tsx";
import { Owner } from "./Owner.tsx";
import { Weapons } from "./Weapons.tsx";

type TokenProps = {
    id: string;
    popover: boolean;
    selected: boolean;
    tokenLists?: Map<string, Array<Item>>;
    isDragging?: boolean;
};

export const Token = (props: TokenProps) => {
    const component = useComponentContext(useShallow((state) => state.component));
    const playerContext = usePlayerContext();
    const containerRef = useRef<HTMLDivElement>(null);
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(props.id)));
    const data = token?.data as GMDMetadata;
    const item = token?.item as Image;
    const hasOwnership = playerContext.role === "GM" || item.createdUserId === playerContext.id;
    const start = useRef<number>(0);

    const getGroupSelectRange = (currentSelection: Array<string>): Array<string> | null => {
        const currentGroup = data.group;

        if (currentGroup || currentGroup === undefined) {
            const groupItems = props.tokenLists?.get(currentGroup || "Default");
            if (groupItems) {
                const index = data.index || groupItems.indexOf(item);
                const selectedGroupItems = groupItems.filter((item) => currentSelection.includes(item.id));

                const sortedByDistance = selectedGroupItems.sort((a, b) => {
                    const aData = a.metadata[itemMetadataKey] as GMDMetadata;
                    const bData = b.metadata[itemMetadataKey] as GMDMetadata;
                    const aDelta = Math.abs(index - aData.index!);
                    const bDelta = Math.abs(index - bData.index!);
                    if (aDelta < bDelta) {
                        return -1;
                    } else if (bDelta < aDelta) {
                        return 1;
                    } else {
                        return 0;
                    }
                });

                if (sortedByDistance.length > 0) {
                    const closestDistance = sortedByDistance[0];
                    const cdData = closestDistance.metadata[itemMetadataKey] as GMDMetadata;

                    const cdIndex = cdData.index || groupItems.indexOf(closestDistance);
                    let indices: Array<number> = [];
                    if (cdIndex < index) {
                        indices = _.range(cdIndex, index);
                    } else {
                        indices = _.range(index, cdIndex);
                    }
                    const toSelect = groupItems.map((item) => {
                        const itemData = item.metadata[itemMetadataKey] as GMDMetadata;
                        if (itemData.index) {
                            if (indices.includes(itemData.index)) {
                                return item.id;
                            }
                        } else {
                            const idx = groupItems.indexOf(item);
                            if (indices.includes(idx)) {
                                return item.id;
                            }
                        }
                    });

                    return toSelect.filter((item): item is string => !!item);
                }
            }
        }

        return null;
    };

    const handleOnPlayerClick = async (e: React.MouseEvent<HTMLDivElement>, force?: boolean) => {
        if (!force && (e.target as HTMLElement).tagName !== "DIV") {
            // we prevent subcomponent clicking triggering this function
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        const currentSelection = (await OBR.player.getSelection()) || [];
        if (currentSelection.length === 0) {
            await OBR.player.select([props.id]);
        } else {
            if (currentSelection.includes(props.id)) {
                currentSelection.splice(currentSelection.indexOf(props.id), 1);
                await OBR.player.select(currentSelection);
            } else {
                if (e.shiftKey) {
                    const toSelect = getGroupSelectRange(currentSelection);
                    if (toSelect) {
                        const extendedSelection = currentSelection.concat(toSelect);
                        extendedSelection.push(props.id);
                        await OBR.player.select(extendedSelection);
                    }
                } else if (e.metaKey || e.ctrlKey) {
                    currentSelection.push(props.id);
                    await OBR.player.select(currentSelection);
                } else {
                    await OBR.player.select([props.id]);
                }
            }
        }
    };

    const handleOnPlayerDoubleClick = async (
        e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
    ) => {
        if ((e.target as HTMLElement).tagName !== "DIV") {
            // we prevent subcomponent clicking triggering this function
            return;
        }
        const bounds = await OBR.scene.items.getItemBounds([props.id]);
        await OBR.player.select([props.id]);
        await OBR.viewport.animateToBounds({
            ...bounds,
            min: { x: bounds.min.x - 1000, y: bounds.min.y - 1000 },
            max: { x: bounds.max.x + 1000, y: bounds.max.y + 1000 },
        });
    };

    const display = (): boolean => {
        return data.active && (playerContext.role === "GM" || item.createdUserId === playerContext.id || data.isPlayer);
    };

    return display() ? (
        <div
            ref={containerRef}
            className={`token ${playerContext.role === "PLAYER" ? "player" : ""} ${
                props.selected ? "selected" : ""
            } ${component} ${data.stress.current === data.stress.max ? "vulnerable" : ""}`}
            onClick={(e) => {
                handleOnPlayerClick(e);
            }}
            onDoubleClick={(e) => {
                handleOnPlayerDoubleClick(e);
            }}
            onTouchStart={(e) => {
                const now = Date.now();
                if (now - start.current < 300) {
                    handleOnPlayerDoubleClick(e);
                } else {
                    start.current = now;
                }
            }}
        >
            <TokenIcon
                id={props.id}
                onClick={async (e) => {
                    handleOnPlayerClick(e, true);
                }}
                hideName={!display()}
                isDragging={props.isDragging}
            />
            <div className={"section"}>
                <HP id={props.id} hasOwnership={hasOwnership} />
                <Stress id={props.id} hasOwnership={hasOwnership} />
                <Armor id={props.id} hasOwnership={hasOwnership} />
            </div>
            <div className={"section"}>
                <Evasion id={props.id} hasOwnership={hasOwnership} />
                <Hope id={props.id} hasOwnership={hasOwnership} />
                <Spotlight id={props.id} hasOwnership={hasOwnership} />
            </div>
            {hasOwnership ? (
                <>
                    <div className={"section"}>
                        <Stats data={data} item={item} />
                        <Thresholds id={props.id} />
                    </div>
                    <div className={"section"}>
                        <Owner id={props.id} />
                    </div>
                </>
            ) : null}
            {hasOwnership && playerContext.role === "PLAYER" ? (
                <>
                    <Weapons id={props.id} />
                </>
            ) : null}
        </div>
    ) : data.showOnMap && item.visible ? (
        <div ref={containerRef} className={`token`}>
            <TokenIcon id={props.id} hideName={!display()} />
        </div>
    ) : (
        <></>
    );
};
