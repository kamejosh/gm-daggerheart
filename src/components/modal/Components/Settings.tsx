import { dicePlusAvailableKey, diceTrayModal, diceTrayModalId, modalId } from "../../../helper/variables.ts";
import OBR from "@owlbear-rodeo/sdk";
import { Groups } from "./Groups.tsx";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { getRoomDiceUser, updateRoomMetadata } from "../../../helper/helpers.ts";
import { useShallow } from "zustand/react/shallow";
import { DICE_ROLLER } from "../../../helper/types.ts";
import { useLocalStorage } from "../../../helper/hooks.ts";
import Tippy from "@tippyjs/react";

export const Settings = () => {
    const [room, scene] = useMetadataContext(useShallow((state) => [state.room, state.scene]));
    const [dicePlusAvailable] = useLocalStorage(dicePlusAvailableKey, false);

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

                    <div className={"dice-roller-enabled setting-group vertical"}>
                        <div className={"setting"}>
                            Select Dice Roller:
                            <select
                                value={room?.diceRoller || DICE_ROLLER.DDDICE}
                                onChange={async (e) => {
                                    const diceRoller = Number(e.currentTarget.value) as DICE_ROLLER;
                                    await updateRoomMetadata(room, { diceRoller });
                                    if (diceRoller === DICE_ROLLER.DDDICE) {
                                        const diceRoomUser = getRoomDiceUser(room, OBR.player.id);
                                        if (diceRoomUser) {
                                            await OBR.modal.open({
                                                ...diceTrayModal,
                                                url: `https://dddice.com/room/${room?.diceRoom!.slug}/stream?key=${
                                                    diceRoomUser.apiKey
                                                }`,
                                            });
                                        }
                                    } else {
                                        await OBR.modal.close(diceTrayModalId);
                                    }
                                }}
                            >
                                <option value={DICE_ROLLER.DDDICE}>dddice</option>
                                <option value={DICE_ROLLER.SIMPLE}>Calculated</option>
                                {dicePlusAvailable ? <option value={DICE_ROLLER.DICE_PLUS}>Dice+</option> : null}
                            </select>
                        </div>
                        {!dicePlusAvailable ? (
                            <div
                                style={{
                                    justifyContent: "flex-start",
                                    gap: "1ch",
                                    fontSize: "0.8rem",
                                    // alignItems: "flex-end",
                                }}
                                className={"setting"}
                            >
                                Checkout{" "}
                                <Tippy
                                    content={
                                        "After adding Dice+ to a room you have to reload the page to be able to select it"
                                    }
                                >
                                    <a
                                        style={{ fontWeight: "600", fontSize: "1rem" }}
                                        href={
                                            "https://owlbear.rogue.pub/extension/https://dice-plus.missinglinkdev.com/manifest.json"
                                        }
                                        target={"_blank"}
                                    >
                                        Dice+
                                    </a>
                                </Tippy>{" "}
                                for a OBR native 3D dice roller.
                            </div>
                        ) : null}
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
