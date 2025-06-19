import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { useShallow } from "zustand/react/shallow";
import { GMDMetadata } from "../../../helper/types.ts";
import OBR, { Image, Player } from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";
import Tippy from "@tippyjs/react";
import { itemMetadataKey } from "../../../helper/variables.ts";
import "./sheet.scss";

export const Owner = (props: { id: string }) => {
    const playerContext = usePlayerContext();
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(props.id)));
    const data = token?.data as GMDMetadata;
    const item = token?.item as Image;
    const [players, setPlayers] = useState<Array<Player>>([]);
    const owner = players.find((p) => p.id === item.createdUserId)?.id ?? playerContext.id ?? "";

    useEffect(() => {
        const initPlayerList = async () => {
            setPlayers(await OBR.party.getPlayers());
        };

        initPlayerList();
        return OBR.party.onChange((players) => {
            setPlayers(players);
        });
    }, []);

    return (
        <div className={"token-owner"}>
            {playerContext.role === "GM" ? (
                <Tippy content={"Assign token owner"}>
                    <select
                        style={{
                            backgroundColor: players.find((p) => p.id === item.createdUserId)?.color ?? "transparent",
                        }}
                        value={owner}
                        onChange={async (e) => {
                            // this doesn't work with the abstraction layer
                            await OBR.scene.items.updateItems([item], (items) => {
                                items.forEach((item) => {
                                    item.createdUserId = e.target.value;
                                    item.metadata[itemMetadataKey] = {
                                        ...data,
                                        isPlayer: e.target.value !== playerContext.id,
                                    };
                                });
                            });
                        }}
                        className={"select-owner"}
                    >
                        <option value={OBR.player.id}>GM</option>
                        {players.map((player) => {
                            return (
                                <option key={player.id} value={player.id}>
                                    {player.name}
                                </option>
                            );
                        })}
                    </select>
                </Tippy>
            ) : null}
        </div>
    );
};
