import { diceTrayModal, diceTrayModalId, modalId } from "../../../helper/variables.ts";
import OBR from "@owlbear-rodeo/sdk";
import { Groups } from "./Groups.tsx";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { getRoomDiceUser, updateRoomMetadata } from "../../../helper/helpers.ts";
import { useShallow } from "zustand/react/shallow";

export const Settings = () => {
    const [room, scene] = useMetadataContext(useShallow((state) => [state.room, state.scene]));

    return (
        <>
            <button className={"close-button"} onClick={async () => await OBR.modal.close(modalId)}>
                X
            </button>
            <div className={"global-setting"}>
                <h2>Settings</h2>
                <>
                    <div className={"settings-context vertical"}>
                        <h3>Room Settings</h3>
                        <span className={"small"}>(Shared across all scenes in opened in the current Room)</span>
                    </div>

                    <div className={"dice-roller-enabled setting"}>
                        Use calculated rolls (no 3D dice):
                        <input
                            type={"checkbox"}
                            checked={room?.disableDiceRoller || false}
                            onChange={async () => {
                                const disableDiceRoller = !room?.disableDiceRoller;
                                await updateRoomMetadata(room, { disableDiceRoller: disableDiceRoller });
                                if (!disableDiceRoller) {
                                    const diceRoomUser = getRoomDiceUser(room, OBR.player.id);
                                    if (diceRoomUser) {
                                        await OBR.modal.open({
                                            ...diceTrayModal,
                                            url: `https://dddice.com/room/${room.diceRoom!.slug}/stream?key=${
                                                diceRoomUser.apiKey
                                            }`,
                                        });
                                    }
                                } else {
                                    await OBR.modal.close(diceTrayModalId);
                                }
                            }}
                        />
                    </div>
                    <div className={"update-notification setting"}>
                        Don't show Changelog on updates:
                        <input
                            type={"checkbox"}
                            checked={room?.ignoreUpdateNotification || false}
                            onChange={() => {
                                updateRoomMetadata(room, { ignoreUpdateNotification: !room?.ignoreUpdateNotification });
                            }}
                        />
                    </div>
                    <div className={"settings-context vertical"}>
                        <h3>Scene Settings</h3>
                        <span className={"small"}>(Settings only affect the current Scene)</span>
                    </div>
                    {scene ? (
                        <Groups />
                    ) : (
                        <span className={"warning"}>Scene Settings only available once Scene is open</span>
                    )}
                </>
            </div>
        </>
    );
};
