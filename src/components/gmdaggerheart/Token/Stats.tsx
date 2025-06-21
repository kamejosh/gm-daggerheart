import { GMDMetadata } from "../../../helper/types.ts";
import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { useShallow } from "zustand/react/shallow";
import { Image } from "@owlbear-rodeo/sdk";
import { getTokenName, updateRoomMetadata } from "../../../helper/helpers.ts";
import { useMemo, useState } from "react";
import { autoPlacement, safePolygon, useFloating, useHover, useInteractions } from "@floating-ui/react";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { IDiceRoll, Operator, parseRollEquation } from "dddice-js";
import { getUserUuid, localRoll, rollerCallback, rollWrapper } from "../../../helper/diceHelper.ts";
import { useRollLogContext } from "../../../context/RollLogContext.tsx";
import styles from "./stats.module.scss";
import { EditSvg } from "../../svgs/EditSvg.tsx";
import { updateTokenMetadata } from "../../../helper/tokenHelper.ts";
import { toNumber } from "lodash";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import Tippy from "@tippyjs/react";

export const Stat = ({
    value,
    name,
    character,
    edit,
    setValue,
    id,
}: {
    value: number;
    name: string;
    character: string;
    edit: boolean;
    setValue: (value: number) => void;
    id: string;
}) => {
    const [theme, hopeTheme, fearTheme, initialized, rollerApi] = useDiceRoller(
        useShallow((state) => [state.theme, state.hopeTheme, state.fearTheme, state.initialized, state.rollerApi]),
    );
    const [debounceValue, setDebounceValue] = useState<string>(value.toString());
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(id)));
    const data = token?.data as GMDMetadata;
    const addRoll = useRollLogContext(useShallow((state) => state.addRoll));
    const room = useMetadataContext(useShallow((state) => state.room));
    const [rolling, setRolling] = useState<boolean>(false);
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const isEnabled = useMemo(() => {
        return (initialized && !room?.disableDiceRoller) || room?.disableDiceRoller;
    }, [initialized, room?.disableDiceRoller]);

    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        middleware: [
            autoPlacement({
                autoAlignment: true,
                crossAxis: true,
                allowedPlacements: ["left", "right"],
            }),
        ],
    });

    const hover = useHover(context, { handleClose: safePolygon() });

    const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

    const roll = async (modifier?: "ADV" | "DIS" | "SELF") => {
        let parsedDice: Array<{
            dice: IDiceRoll[];
            operator: Operator | undefined;
        }> = [];

        if (!room?.disableDiceRoller) {
            parsedDice.push(parseRollEquation("1d12", hopeTheme ? hopeTheme.id : theme?.id || "dddice-bees"));
            parsedDice.push(parseRollEquation("1d12", fearTheme ? fearTheme.id : theme?.id || "dddice-bees"));

            const parsed: {
                dice: IDiceRoll[];
                operator: Operator | undefined;
            } = { dice: [], operator: undefined };
            parsedDice.forEach((p) => {
                parsed.dice.push(...p.dice);
            });

            if (modifier === "ADV") {
                parsed.dice.push({ type: "d6", theme: theme?.id || "dddice-bees" });
            } else if (modifier === "DIS") {
                parsed.dice.push({ type: "d6", theme: theme?.id || "dddice-bees" });
                parsed.operator = { "*": { "-1": [2] } };
            }

            if (value !== 0) {
                parsed.dice.push({ type: "mod", value: value });
            }

            if (rollerApi) {
                try {
                    let rollResult = await rollWrapper(rollerApi, parsed.dice, {
                        label: name,
                        operator: parsed.operator,
                        external_id: character,
                        whisper: modifier === "SELF" ? await getUserUuid(room, rollerApi) : undefined,
                    });
                    if (rollResult) {
                        if (rollResult.values[0].value > rollResult.values[1].value) {
                            rollResult.label += ": Hope";
                            await updateTokenMetadata({ ...data, hope: Math.min(data.hope + 1, 6) }, [id]);
                        } else if (rollResult.values[0].value < rollResult.values[1].value) {
                            rollResult.label += ": Fear";
                            await updateRoomMetadata(room, { fear: room?.fear ? Math.min(room?.fear + 1, 12) : 1 });
                        } else {
                            rollResult.label += ": Critical";
                            await updateTokenMetadata(
                                {
                                    ...data,
                                    hope: Math.min(data.hope + 1, 6),
                                    stress: { ...data.stress, current: Math.max(data.stress.current - 1, 0) },
                                },
                                [id],
                            );
                        }
                        await rollerCallback(rollResult, addRoll);
                    }
                } catch {
                    console.warn("error in dice roll", parsed.dice, parsed.operator);
                }
            }
        } else {
            let notation = "2d12";
            if (modifier === "ADV") {
                notation += "+1d6";
            } else if (modifier === "DIS") {
                notation += "-1d6";
            }
            if (value !== 0) {
                notation += `+ ${value}`;
            }

            const result = await localRoll(notation, name, addRoll, modifier === "SELF", character, true);

            // @ts-ignore
            const rolls: Array<{ value: number }> = result?.rolls[0].rolls;
            if (rolls && rolls[0].value < rolls[1].value) {
                await updateRoomMetadata(room, { fear: room?.fear ? Math.min(room?.fear + 1, 12) : 1 });
            } else if (rolls && rolls[0].value > rolls[1].value) {
                await updateTokenMetadata({ ...data, hope: Math.min(data.hope + 1, 6) }, [id]);
            } else {
                await updateTokenMetadata(
                    {
                        ...data,
                        hope: Math.min(data.hope + 1, 6),
                        stress: { ...data.stress, current: Math.max(data.stress.current - 1, 0) },
                    },
                    [id],
                );
            }
        }
    };

    return (
        <div className={`button-wrapper ${styles.stat}`}>
            <span className={styles.name}>{name.substring(0, 3)}</span>
            {edit ? (
                <input
                    className={styles.statInput}
                    value={debounceValue}
                    onChange={(e) => {
                        const newValue = e.target.value;
                        setDebounceValue(newValue);
                    }}
                    onBlur={(e) => {
                        setValue(toNumber(e.target.value));
                    }}
                />
            ) : (
                <button
                    ref={refs.setReference}
                    {...getReferenceProps()}
                    disabled={!isEnabled}
                    className={`dice-button button ${rolling ? "rolling" : ""} ${styles.statValue}`}
                    onClick={async () => {
                        setRolling(true);
                        await roll();
                        setRolling(false);
                    }}
                >
                    {Intl.NumberFormat("en-US", { signDisplay: "always" }).format(value)}
                </button>
            )}
            {isOpen && isEnabled ? (
                <span
                    ref={refs.setFloating}
                    {...getFloatingProps()}
                    style={floatingStyles}
                    className={`dice-context-button visible full`}
                >
                    <button
                        className={"advantage"}
                        disabled={!isEnabled}
                        onClick={async () => {
                            await roll("ADV");
                        }}
                    >
                        ADV
                    </button>
                    <button
                        className={"disadvantage"}
                        disabled={!isEnabled}
                        onClick={async () => {
                            await roll("DIS");
                        }}
                    >
                        DIS
                    </button>

                    <button
                        className={"self"}
                        disabled={!isEnabled}
                        onClick={async () => {
                            await roll("SELF");
                        }}
                    >
                        HIDE
                    </button>
                </span>
            ) : null}
        </div>
    );
};

export const Stats = ({ data, item }: { data: GMDMetadata; item: Image }) => {
    const character = getTokenName(item);
    const [edit, setEdit] = useState<boolean>(false);
    return (
        <div className={styles.statsWrapper}>
            <div className={styles.stats}>
                <Stat
                    edit={edit}
                    value={data.agility}
                    name={"Agility"}
                    character={character}
                    setValue={async (value: number) => {
                        const newData = { ...data, agility: value };
                        await updateTokenMetadata(newData, [item.id]);
                    }}
                    id={item.id}
                ></Stat>
                <Stat
                    edit={edit}
                    value={data.strength}
                    name={"Strength"}
                    character={character}
                    setValue={async (value: number) => {
                        const newData = { ...data, strength: value };
                        await updateTokenMetadata(newData, [item.id]);
                    }}
                    id={item.id}
                ></Stat>
                <Stat
                    edit={edit}
                    value={data.finesse}
                    name={"Finesse"}
                    character={character}
                    setValue={async (value: number) => {
                        const newData = { ...data, finesse: value };
                        await updateTokenMetadata(newData, [item.id]);
                    }}
                    id={item.id}
                ></Stat>
                <Stat
                    edit={edit}
                    value={data.instinct}
                    name={"Instinct"}
                    character={character}
                    setValue={async (value: number) => {
                        const newData = { ...data, instinct: value };
                        await updateTokenMetadata(newData, [item.id]);
                    }}
                    id={item.id}
                ></Stat>
                <Stat
                    edit={edit}
                    value={data.presence}
                    name={"Presence"}
                    character={character}
                    setValue={async (value: number) => {
                        const newData = { ...data, presence: value };
                        await updateTokenMetadata(newData, [item.id]);
                    }}
                    id={item.id}
                ></Stat>
                <Stat
                    edit={edit}
                    value={data.knowledge}
                    name={"Knowledge"}
                    character={character}
                    setValue={async (value: number) => {
                        const newData = { ...data, knowledge: value };
                        await updateTokenMetadata(newData, [item.id]);
                    }}
                    id={item.id}
                ></Stat>
            </div>
            <Tippy content={"edit stats"}>
                <button className={`${styles.edit} ${edit ? styles.active : ""}`} onClick={() => setEdit(!edit)}>
                    <EditSvg />
                </button>
            </Tippy>
        </div>
    );
};
