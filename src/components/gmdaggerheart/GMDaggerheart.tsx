import { useEffect, useMemo, useState } from "react";
import { ContextWrapper } from "../ContextWrapper.tsx";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import OBR, { Image, Item } from "@owlbear-rodeo/sdk";
import { changelogModal, itemMetadataKey, version } from "../../helper/variables.ts";
import { GMDMetadata } from "../../helper/types.ts";
import { PlayerTokenList } from "./TokenList.tsx";
import { SceneReadyContext } from "../../context/SceneReadyContext.ts";
import { DropGroup } from "./DropGroup.tsx";
import { reorderMetadataIndex, sortItems } from "../../helper/helpers.ts";
import { compare } from "compare-versions";
import { Helpbuttons } from "../general/Helpbuttons/Helpbuttons.tsx";
import { DiceTray } from "../general/DiceRoller/DiceTray.tsx";
import { useMetadataContext } from "../../context/MetadataContext.ts";
import { TokenContextWrapper } from "../TokenContextWrapper.tsx";
import { useTokenListContext } from "../../context/TokenContext.tsx";
import { DraggableLocation, DropResult, DragDropContext } from "@hello-pangea/dnd";
import { updateItems } from "../../helper/obrHelper.ts";
import { useShallow } from "zustand/react/shallow";
import { Fear } from "./Fear.tsx";

export const GMDaggerheart = () => {
    return (
        <ContextWrapper component={"action_window"}>
            <TokenContextWrapper>
                <Content />
                <DiceTray classes={"hp-tracker-dice-tray"} />
            </TokenContextWrapper>
        </ContextWrapper>
    );
};

const Content = () => {
    const playerContext = usePlayerContext();
    const tokens = useTokenListContext(useShallow((state) => state.tokens));

    const [selectedTokens, setSelectedTokens] = useState<Array<string>>([]);
    const [ignoredChanges, setIgnoredChanges] = useState<boolean>(false);
    const [scene, room] = useMetadataContext(useShallow((state) => [state.scene, state.room]));
    const { isReady } = SceneReadyContext();

    useEffect(() => {
        const initGrimoire = async () => {
            if (
                playerContext.role === "GM" &&
                !room?.ignoreUpdateNotification &&
                scene?.version &&
                compare(scene.version, version, "<")
            ) {
                const width = await OBR.viewport.getWidth();
                await OBR.modal.open({
                    ...changelogModal,
                    fullScreen: false,
                    height: 600,
                    width: Math.min(width * 0.9, 600),
                });
            } else if (playerContext.role === "GM" && scene?.version && compare(scene.version, version, "<")) {
                setIgnoredChanges(true);
                await OBR.notification.show(`GM's Daggerheart has been updated to version ${version}`, "SUCCESS");
            }
        };

        if (isReady) {
            void initGrimoire();
        }
    }, [isReady]);

    useEffect(() => {
        return OBR.player.onChange((player) => {
            setSelectedTokens(player.selection ?? []);
        });
    }, []);

    const items = useMemo(() => (tokens ? [...tokens].map((t) => t[1].item) : []), [tokens]);
    const playerTokens = tokens ? [...tokens].filter((t) => t[1].data.isPlayer).map((t) => t[1].item) : [];

    const tokenLists = useMemo(() => {
        const tokenMap = new Map<string, Array<Image>>();

        if (isReady && scene?.groups) {
            for (const group of scene?.groups) {
                const groupItems = items?.filter((item) => {
                    const metadata = item.metadata[itemMetadataKey] as GMDMetadata;
                    return (
                        (!metadata.group && group === "Default") ||
                        metadata.group === group ||
                        (!scene?.groups?.includes(metadata.group ?? "") && group === "Default")
                    );
                });
                tokenMap.set(group, groupItems ?? []);
            }
        }
        return tokenMap;
    }, [scene?.groups, items, isReady]);

    const reorderMetadataIndexMulti = async (destList: Array<Item>, group: string, sourceList: Array<Item>) => {
        const combinedList = destList.concat(sourceList);
        const destinationIds = destList.map((d) => d.id);
        await updateItems(
            combinedList.map((i) => i.id),
            (items) => {
                let destIndex = 0;
                let sourceIndex = 0;
                items.forEach((item) => {
                    const data = item.metadata[itemMetadataKey] as GMDMetadata;
                    if (destinationIds.includes(item.id)) {
                        data.index = destIndex;
                        destIndex += 1;
                        data.group = group;
                    } else {
                        data.index = sourceIndex;
                        sourceIndex += 1;
                    }
                    item.metadata[itemMetadataKey] = { ...data };
                });
            },
        );
    };

    const reorder = async (
        list: Array<Image>,
        startIndex: number,
        endIndex: number,
        dragItem: DropResult,
        multiMove: boolean = false,
    ) => {
        const result = Array.from(list);
        result.sort(sortItems);
        const [removed] = result.splice(startIndex, 1);
        const multiRemove: Array<Image> = [removed];

        if (multiMove) {
            const alsoSelected = result.filter(
                (item) => selectedTokens.includes(item.id) && item.id != dragItem.draggableId,
            );

            let localRemove: Array<Image> = [];

            alsoSelected.forEach((item) => {
                localRemove = localRemove.concat(
                    result.splice(
                        result.findIndex((sourceItem) => sourceItem.id === item.id),
                        1,
                    ),
                );
            });

            localRemove = localRemove.concat(multiRemove);
            localRemove.forEach((item) => {
                result.splice(endIndex, 0, item);
            });
        } else {
            result.splice(endIndex, 0, removed);
        }
        const tokens = result.filter((item) => item !== undefined);

        await reorderMetadataIndex(tokens);
    };

    const move = async (
        source: Array<Item>,
        destination: Array<Item>,
        droppableSource: DraggableLocation,
        droppableDestination: DraggableLocation,
        result: DropResult,
        multiMove: boolean = false,
    ) => {
        const sourceClone = Array.from(source);
        const destClone = Array.from(destination);
        const [removed] = sourceClone.splice(droppableSource.index, 1);
        const multiRemove: Array<Item> = [removed];

        if (multiMove) {
            const alsoSelected = source.filter(
                (item) => selectedTokens.includes(item.id) && item.id != result.draggableId,
            );

            let localRemove: Array<Item> = [];

            alsoSelected.forEach((item) => {
                localRemove = localRemove.concat(
                    sourceClone.splice(
                        sourceClone.findIndex((sourceItem) => sourceItem.id === item.id),
                        1,
                    ),
                );
            });

            localRemove = localRemove.concat(multiRemove);

            localRemove.forEach((item) => {
                destClone.splice(droppableDestination.index, 0, item);
            });
        } else {
            destClone.splice(droppableDestination.index, 0, removed);
        }

        await reorderMetadataIndexMulti(destClone, droppableDestination.droppableId, sourceClone);
    };

    const onDragEnd = async (result: DropResult) => {
        if (!result.destination) {
            return;
        }

        if (result.source.droppableId != result.destination.droppableId) {
            await move(
                tokenLists.get(result.source.droppableId) || [],
                tokenLists.get(result.destination.droppableId) || [],
                result.source,
                result.destination,
                result,
                selectedTokens.includes(result.draggableId),
            );
            return;
        }

        if (result.destination.index === result.source.index) {
            return;
        }

        await reorder(
            tokenLists.get(result.destination.droppableId) ?? [],
            result.source.index,
            result.destination.index,
            result,
            selectedTokens.includes(result.draggableId),
        );
    };

    return playerContext.role ? (
        <div className={`gm-grimoire ${playerContext.role === "PLAYER" ? "player" : ""}`}>
            <Helpbuttons ignoredChanges={ignoredChanges} setIgnoredChange={setIgnoredChanges} />
            <h1 className={"title"}>
                GM's Daggerheart <span className={"small"}>{version}</span>
            </h1>
            <div className={"grimoire-content"}>
                <Fear />
                {playerContext.role === "GM" ? (
                    <>
                        <DragDropContext onDragEnd={onDragEnd}>
                            {scene && scene.groups && scene.groups?.length > 0 ? (
                                scene.groups?.map((group) => {
                                    const list = tokenLists.get(group) || [];
                                    return (
                                        <DropGroup
                                            key={group}
                                            title={group}
                                            list={list.sort(sortItems)}
                                            selected={selectedTokens}
                                            tokenLists={tokenLists}
                                        />
                                    );
                                })
                            ) : (
                                <DropGroup
                                    title={"Default"}
                                    list={Array.from(items ?? []).sort(sortItems)}
                                    selected={selectedTokens}
                                    tokenLists={tokenLists}
                                />
                            )}
                        </DragDropContext>
                    </>
                ) : (
                    <PlayerTokenList tokens={playerTokens} selected={selectedTokens} tokenLists={tokenLists} />
                )}
            </div>
        </div>
    ) : (
        <h1>Waiting for OBR startup</h1>
    );
};
