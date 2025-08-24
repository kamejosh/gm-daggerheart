import { rollDualityDice } from "../../../helper/diceHelper.ts";
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

    const getDicePreview = () => {
        try {
            if (theme) {
                const hope = getDiceImage(hopeTheme ?? theme, "d12", 0);
                const fear = getDiceImage(fearTheme ?? theme, "d12", 1);
                return (
                    <>
                        {hope}
                        {fear}
                    </>
                );
            } else {
                return (
                    <>
                        <D12 key={"hope"} />
                        <D12 key={"fear"} />
                    </>
                );
            }
        } catch {
            return (
                <>
                    <D12 key={"hope"} />
                    <D12 key={"fear"} />
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
                        await rollDualityDice(
                            bonus,
                            "Attack",
                            character,
                            data,
                            id,
                            addRoll,
                            room,
                            hopeTheme,
                            fearTheme,
                            theme,
                            rollerApi,
                        );
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
                            await rollDualityDice(
                                bonus,
                                "Attack",
                                character,
                                data,
                                id,
                                addRoll,
                                room,
                                hopeTheme,
                                fearTheme,
                                theme,
                                rollerApi,
                                "ADV",
                            );
                        }}
                    >
                        ADV
                    </button>
                    <button
                        className={"disadvantage"}
                        disabled={!isEnabled}
                        onClick={async () => {
                            await rollDualityDice(
                                bonus,
                                "Attack",
                                character,
                                data,
                                id,
                                addRoll,
                                room,
                                hopeTheme,
                                fearTheme,
                                theme,
                                rollerApi,
                                "DIS",
                            );
                        }}
                    >
                        DIS
                    </button>
                    <button
                        className={"reaction"}
                        disabled={!isEnabled}
                        onClick={async () => {
                            await rollDualityDice(
                                bonus,
                                "Attack",
                                character,
                                data,
                                id,
                                addRoll,
                                room,
                                hopeTheme,
                                fearTheme,
                                theme,
                                rollerApi,
                                "REACT",
                            );
                        }}
                    >
                        REACT
                    </button>
                    <button
                        className={"self"}
                        disabled={!isEnabled}
                        onClick={async () => {
                            await rollDualityDice(
                                bonus,
                                "Attack",
                                character,
                                data,
                                id,
                                addRoll,
                                room,
                                hopeTheme,
                                fearTheme,
                                theme,
                                rollerApi,
                                "SELF",
                            );
                        }}
                    >
                        HIDE
                    </button>
                </span>
            ) : null}
        </div>
    );
};
