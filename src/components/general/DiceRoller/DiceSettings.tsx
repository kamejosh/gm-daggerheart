import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { useEffect, useState } from "react";
import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { updateRoomMetadataDiceRoom, updateRoomMetadataDiceUser, validateTheme } from "../../../helper/diceHelper.ts";
import OBR from "@owlbear-rodeo/sdk";
import { getRoomDiceUser } from "../../../helper/helpers.ts";
import { diceTrayModal } from "../../../helper/variables.ts";
import { Select } from "../Select.tsx";
import { getThemePreview } from "../../../helper/previewHelpers.tsx";
import { Loader } from "../Loader.tsx";
import { isNull } from "lodash";
import { ITheme } from "dddice-js";
import { useShallow } from "zustand/react/shallow";

const ThemeSelector = ({
    label,
    current,
    setTheme,
    updateRoom,
    setSearching,
    setValidTheme,
    setError,
}: {
    label: string;
    current: ITheme | null;
    setTheme: (theme: ITheme) => void;
    updateRoom: (themeId: string) => Promise<void>;
    setSearching: (searching: boolean) => void;
    setValidTheme: (valid: boolean) => void;
    setError: (error: string | null) => void;
}) => {
    const [themes, rollerApi] = useDiceRoller(useShallow((state) => [state.themes, state.rollerApi]));
    const room = useMetadataContext(useShallow((state) => state.room));
    const playerContext = usePlayerContext();

    const findAndSetTheme = async (searchTheme: string, input?: HTMLInputElement) => {
        try {
            setSearching(true);
            const newTheme = (await rollerApi?.theme.get(searchTheme))?.data;

            if (newTheme && validateTheme(newTheme)) {
                if (newTheme.id !== current?.id) {
                    if (room && playerContext.id) {
                        await updateRoom(newTheme.id);
                        setValidTheme(true);
                        setTheme(newTheme);
                    } else {
                        if (input) {
                            input.value = current?.id || "";
                        }
                        setError("error updating theme");
                        setValidTheme(false);
                    }
                }
            } else {
                setValidTheme(false);
            }
        } catch {
            if (input) {
                input.value = current?.id || "";
            }
            setError("theme not found");
            setValidTheme(false);
        } finally {
            setSearching(false);
        }
    };

    return (
        <div>
            <span className={"setting-name"}>{label}</span>
            <Select
                options={
                    !isNull(themes)
                        ? themes
                              .filter((t: ITheme) => validateTheme(t))
                              .map((t) => {
                                  return { value: t.id, name: t.name || t.id, icon: getThemePreview(t) };
                              })
                        : []
                }
                // @ts-ignore
                current={
                    current
                        ? {
                              value: current.id,
                              name: current.name,
                              icon: getThemePreview(current),
                          }
                        : undefined
                }
                setTheme={findAndSetTheme}
            />
        </div>
    );
};

export const DiceSettings = ({ setSettings }: { setSettings: (settings: boolean) => void }) => {
    const room = useMetadataContext(useShallow((state) => state.room));
    const [rollerApi, theme, setTheme, hopeTheme, setHopeTheme, fearTheme, setFearTheme, rooms] = useDiceRoller(
        useShallow((state) => [
            state.rollerApi,
            state.theme,
            state.setTheme,
            state.hopeTheme,
            state.setHopeTheme,
            state.fearTheme,
            state.setFearTheme,
            state.rooms,
        ]),
    );
    const playerContext = usePlayerContext();
    const [validTheme, setValidTheme] = useState<boolean>(true);
    const [searching, setSearching] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const currentRoom = rooms.find((r) => r.slug === room?.diceRoom?.slug);

    useEffect(() => {
        if (error) {
            setTimeout(() => {
                setError(null);
            }, 5000);
        }
    }, [error]);

    return (
        <div className={"dice-settings"}>
            <button
                className={"close-button"}
                onClick={() => {
                    setSettings(false);
                }}
            >
                X
            </button>
            {rollerApi ? (
                <div
                    className={`setting dice-theme ${validTheme ? "valid" : "invalid"} ${searching ? "searching" : ""}`}
                >
                    <ThemeSelector
                        label={"dice theme:"}
                        current={theme}
                        setTheme={setTheme}
                        updateRoom={async (themeId: string) => {
                            if (room && playerContext.id) {
                                await updateRoomMetadataDiceUser(room, playerContext.id, { diceTheme: themeId });
                            }
                        }}
                        setSearching={setSearching}
                        setValidTheme={setValidTheme}
                        setError={setError}
                    />
                    <ThemeSelector
                        label={"hope theme:"}
                        current={hopeTheme}
                        setTheme={setHopeTheme}
                        updateRoom={async (themeId: string) => {
                            if (room && playerContext.id) {
                                await updateRoomMetadataDiceUser(room, playerContext.id, { hopeTheme: themeId });
                            }
                        }}
                        setSearching={setSearching}
                        setValidTheme={setValidTheme}
                        setError={setError}
                    />
                    <ThemeSelector
                        label={"fear theme:"}
                        current={fearTheme}
                        setTheme={setFearTheme}
                        updateRoom={async (themeId: string) => {
                            if (room && playerContext.id) {
                                await updateRoomMetadataDiceUser(room, playerContext.id, { fearTheme: themeId });
                            }
                        }}
                        setSearching={setSearching}
                        setValidTheme={setValidTheme}
                        setError={setError}
                    />
                </div>
            ) : (
                <span>Unable to connect with dddice</span>
            )}
            {error ? <span>{error}</span> : null}
            {playerContext.role === "GM" ? (
                <div className={`setting dice-room-select valid`}>
                    <span className={"setting-name"}>dice room:</span>
                    {rooms.length === 0 && !currentRoom ? (
                        <Loader className={"room-loader"} />
                    ) : (
                        <Select
                            options={rooms.map((r) => {
                                return { value: r.slug, name: `${r.name} - ${r.slug}` };
                            })}
                            current={
                                currentRoom
                                    ? { value: currentRoom.slug, name: `${currentRoom.name} - ${currentRoom.slug}` }
                                    : undefined
                            }
                            setTheme={async (t) => {
                                if (room) {
                                    await updateRoomMetadataDiceRoom(room, t);
                                }
                            }}
                        />
                    )}
                </div>
            ) : null}
            <div className={"setting dice-rendering"}>
                <span className={"text"}>{"Render 3D Dice "}</span>
                <input
                    type={"checkbox"}
                    checked={getRoomDiceUser(room, playerContext.id)?.diceRendering ?? true}
                    onChange={async () => {
                        if (room) {
                            const id = OBR.player.id;
                            const diceRoomUser = getRoomDiceUser(room, id);
                            if (diceRoomUser) {
                                await updateRoomMetadataDiceUser(room, id, {
                                    diceRendering: !diceRoomUser.diceRendering,
                                });
                                if (!diceRoomUser.diceRendering) {
                                    await OBR.modal.open({
                                        ...diceTrayModal,
                                        url: `https://dddice.com/room/${room.diceRoom!.slug}/stream?key=${
                                            diceRoomUser.apiKey
                                        }`,
                                    });
                                }
                            }
                        }
                    }}
                />
            </div>
        </div>
    );
};
