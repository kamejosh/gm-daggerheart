import { IDiceRoll, Operator, parseRollEquation } from "dddice-js";
import { getUserUuid, localRoll, rollerCallback, rollWrapper } from "../../../helper/diceHelper.ts";
import { updateTokenMetadata } from "../../../helper/tokenHelper.ts";
import { updateRoomMetadata } from "../../../helper/helpers.ts";
import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { useShallow } from "zustand/react/shallow";
import { useMemo, useState } from "react";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { GMDMetadata } from "../../../helper/types.ts";
import { useRollLogContext } from "../../../context/RollLogContext.tsx";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { autoPlacement, safePolygon, useFloating, useHover, useInteractions } from "@floating-ui/react";
import { getDiceImage } from "../../../helper/previewHelpers.tsx";
import { D12 } from "../../svgs/dice/D12.tsx";
import { toNumber } from "lodash";
import styles from "./attack.module.scss";
import Tippy from "@tippyjs/react";

export const Attack = ({ id, character }: { id: string; character: string }) => {
    const [theme, hopeTheme, fearTheme, initialized, rollerApi] = useDiceRoller(
        useShallow((state) => [state.theme, state.hopeTheme, state.fearTheme, state.initialized, state.rollerApi]),
    );
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(id)));
    const data = token?.data as GMDMetadata;
    const addRoll = useRollLogContext(useShallow((state) => state.addRoll));
    const room = useMetadataContext(useShallow((state) => state.room));
    const [rolling, setRolling] = useState<boolean>(false);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [bonus, setBonus] = useState<number>(0);
    const [debounceValue, setDebounceValue] = useState<string>(bonus.toString());

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

            if (bonus !== 0) {
                parsed.dice.push({ type: "mod", value: bonus });
            }

            if (rollerApi) {
                try {
                    let rollResult = await rollWrapper(rollerApi, parsed.dice, {
                        label: "Attack",
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
            if (bonus !== 0) {
                notation += `+ ${bonus}`;
            }

            const result = await localRoll(notation, "Attack", addRoll, modifier === "SELF", character, true);

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

    const getDicePreview = () => {
        try {
            if (theme) {
                const hope = getDiceImage(hopeTheme ?? theme, "d12", 0);
                const fear = getDiceImage(fearTheme ?? theme, "d12", 0);
                return (
                    <>
                        {hope}
                        {fear}
                    </>
                );
            } else {
                return (
                    <>
                        <D12 />
                        <D12 />
                    </>
                );
            }
        } catch {
            return (
                <>
                    <D12 />
                    <D12 />
                </>
            );
        }
    };

    return (
        <div className={`button-wrapper ${styles.wrapper}`}>
            <Tippy content={"Duality Roll for Attacks or similar"}>
                <button
                    ref={refs.setReference}
                    {...getReferenceProps()}
                    disabled={!isEnabled}
                    className={`dice-button button ${rolling ? "rolling" : ""} ${styles.attackButton}`}
                    onClick={async () => {
                        setRolling(true);
                        await roll();
                        setRolling(false);
                    }}
                >
                    {getDicePreview()}
                </button>
            </Tippy>
            <Tippy content={"Bonus for Attack roll"}>
                <input
                    className={`input ${styles.bonusInput}`}
                    value={debounceValue}
                    onChange={(e) => {
                        const newValue = e.target.value;
                        setDebounceValue(newValue);
                    }}
                    onBlur={(e) => {
                        setBonus(toNumber(e.target.value));
                    }}
                />
            </Tippy>
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
