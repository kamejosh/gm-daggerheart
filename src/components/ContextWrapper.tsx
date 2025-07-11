import OBR from "@owlbear-rodeo/sdk";
import { PlayerContext, PlayerContextType } from "../context/PlayerContext.ts";
import { PropsWithChildren, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PluginGate } from "../context/PluginGateContext.tsx";
import { metadataKey } from "../helper/variables.ts";
import { useMetadataContext } from "../context/MetadataContext.ts";
import { RoomMetadata, SceneMetadata } from "../helper/types.ts";
import { Loader } from "./general/Loader.tsx";
import { SceneReadyContext } from "../context/SceneReadyContext.ts";
import { useComponentContext } from "../context/ComponentContext.tsx";
import "tippy.js/dist/tippy.css";
import { isEqual } from "lodash";
import { useShallow } from "zustand/react/shallow";

type ContextWrapperProps = PropsWithChildren & {
    component: string;
};

const Content = (props: PropsWithChildren) => {
    return <>{props.children}</>;
};

export const ContextWrapper = (props: ContextWrapperProps) => {
    const [role, setRole] = useState<string | null>(null);
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [playerColor, setPlayerColor] = useState<string | null>(null);
    const [playerName, setPlayerName] = useState<string | null>(null);
    const [ready, setReady] = useState<boolean>(false);
    const [room, setSceneMetadata, setRoomMetadata] = useMetadataContext(
        useShallow((state) => [state.room, state.setSceneMetadata, state.setRoomMetadata]),
    );
    const { component, setComponent } = useComponentContext();
    const queryClient = new QueryClient();
    const { isReady } = SceneReadyContext();

    useEffect(() => {
        setComponent(props.component);
        if (OBR.isAvailable) {
            OBR.onReady(async () => {
                setReady(true);
            });
        }
    }, []);

    useEffect(() => {
        const initContext = async () => {
            setRole(await OBR.player.getRole());
            setPlayerId(OBR.player.id);
            setPlayerName(await OBR.player.getName());
            setPlayerColor(await OBR.player.getColor());

            OBR.player.onChange(async (player) => {
                setRole(player.role);
                setPlayerId(player.id);
                setPlayerName(player.name);
            });

            // this throws an error when creating a new room so we catch it
            try {
                const roomMetadata = await OBR.room.getMetadata();
                if (metadataKey in roomMetadata) {
                    setRoomMetadata(roomMetadata[metadataKey] as RoomMetadata);
                }
            } catch {}

            OBR.room.onMetadataChange((metadata) => {
                if (metadataKey in metadata) {
                    const newRoomMetadata = metadata[metadataKey] as RoomMetadata;
                    if (!room || !isEqual(newRoomMetadata, room)) {
                        setRoomMetadata(newRoomMetadata);
                    }
                }
            });
        };
        if (ready) {
            initContext();
        }
    }, [ready]);

    useEffect(() => {
        const setMetadataScene = async () => {
            const sceneMetadata = await OBR.scene.getMetadata();
            if (metadataKey in sceneMetadata) {
                setSceneMetadata(sceneMetadata[metadataKey] as SceneMetadata);
            }
        };

        if (isReady) {
            setMetadataScene();
            return OBR.scene.onMetadataChange((metadata) => {
                if (metadataKey in metadata) {
                    const newSceneMetadata = metadata[metadataKey] as SceneMetadata;
                    const sceneState = useMetadataContext.getState().scene;
                    if (!sceneState || !isEqual(newSceneMetadata, sceneState)) {
                        setSceneMetadata(newSceneMetadata);
                    }
                }
            });
        } else {
            // while switching scenes the old scene groups are still cached and lead to tokens of the new scene to be
            // reassigned to the default group so we need to set groups to undefined while no scene is available
            setSceneMetadata({ groups: undefined });
        }
    }, [isReady]);

    const playerContext: PlayerContextType = { role: role, id: playerId, name: playerName, color: playerColor };

    return (
        <PluginGate>
            <QueryClientProvider client={queryClient}>
                <PlayerContext.Provider value={playerContext}>
                    <Content>
                        {component && room ? (
                            props.children
                        ) : (
                            <div>
                                GM's Daggerheart - initializing...
                                <Loader className={"initialization-loader"} />
                            </div>
                        )}
                    </Content>
                </PlayerContext.Provider>
            </QueryClientProvider>
        </PluginGate>
    );
};
