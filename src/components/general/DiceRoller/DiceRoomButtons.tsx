import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { CustomDieNotation, useDiceButtonsContext } from "../../../context/DiceButtonContext.tsx";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { IAvailableDie, IDiceRoll, IDieType, ITheme, Operator, parseRollEquation } from "dddice-js";
import { DiceSvg } from "../../svgs/DiceSvg.tsx";
import { AddSvg } from "../../svgs/AddSvg.tsx";
import { diceToRoll, getUserUuid, localRoll, rollerCallback, rollWrapper } from "../../../helper/diceHelper.ts";
import { RollLogSvg } from "../../svgs/RollLogSvg.tsx";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { useRollLogContext } from "../../../context/RollLogContext.tsx";
import { DiceRoll } from "@dice-roller/rpg-dice-roller";
import { getDiceImage, getSvgForDiceType, getThemePreview } from "../../../helper/previewHelpers.tsx";
import { Select } from "../Select.tsx";
import { isNull, isString } from "lodash";
import Tippy from "@tippyjs/react";
import { useShallow } from "zustand/react/shallow";

type DiceRoomButtonsProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
};

type CustomDiceButtonProps = {
    button: number;
    customDice: CustomDieNotation | null;
};

const CustomDiceButton = (props: CustomDiceButtonProps) => {
    const [rollerApi, theme, initialized, themes] = useDiceRoller(
        useShallow((state) => [state.rollerApi, state.theme, state.initialized, state.themes]),
    );
    const addRoll = useRollLogContext(useShallow((state) => state.addRoll));
    const { buttons, setButtons } = useDiceButtonsContext();
    const [room] = useMetadataContext(useShallow((state) => [state.room]));
    const [hover, setHover] = useState<boolean>(false);
    const [addCustom, setAddCustom] = useState<boolean>(false);
    const [validCustom, setValidCustom] = useState<boolean>(false);
    const [currentCustomTheme, setCurrentCustomTheme] = useState<ITheme | null>(theme);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setCurrentCustomTheme(theme);
    }, [theme]);

    const setCustomTheme = (themeId: string) => {
        if (!isNull(themes)) {
            const tempT = themes.find((t) => t.id === themeId);
            if (tempT) {
                setCurrentCustomTheme(tempT);
            }
        }
    };

    const getDicePreview = useCallback(() => {
        if (props.customDice && theme && !room?.disableDiceRoller) {
            try {
                const parsed = parseRollEquation(props.customDice.dice, props.customDice.theme ?? theme.id);
                return (
                    <div className={"custom-dice-preview-wrapper"}>
                        {parsed.dice.map((die, index) => {
                            if (die.type !== "mod") {
                                const preview = getDiceImage(theme, die.type, index, props.customDice?.theme, themes);
                                if (preview) {
                                    return preview;
                                }
                            }
                            if (die.type !== "mod" && theme.preview.hasOwnProperty(die.type)) {
                                return (
                                    <img
                                        key={index}
                                        className={"preview-image"}
                                        src={theme.preview[die.type]}
                                        alt={die.type}
                                    />
                                );
                            } else if (die.type !== "mod" && !theme.preview.hasOwnProperty(die.type)) {
                                return (
                                    <div key={index} className={"preview-image"}>
                                        {getSvgForDiceType(die.type)}
                                    </div>
                                );
                            } else {
                                if (die.value) {
                                    return (
                                        <span key={index} className={"modifier"}>
                                            {Intl.NumberFormat("en-US", { signDisplay: "always" }).format(die.value)}
                                        </span>
                                    );
                                }
                            }
                        })}
                    </div>
                );
            } catch {
                return <DiceSvg />;
            }
        } else if (props.customDice) {
            try {
                const parsed = parseRollEquation(props.customDice.dice, props.customDice.theme ?? "dddice-bees");
                return (
                    <div className={"custom-dice-preview-wrapper"}>
                        {parsed.dice.map((die, index) => {
                            if (die.type !== "mod") {
                                return (
                                    <div key={index} className={"preview-image"}>
                                        {getSvgForDiceType(die.type)}
                                    </div>
                                );
                            } else {
                                if (die.value) {
                                    return (
                                        <span key={index} className={"modifier"}>
                                            {Intl.NumberFormat("en-US", { signDisplay: "always" }).format(die.value)}
                                        </span>
                                    );
                                }
                            }
                        })}
                    </div>
                );
            } catch {
                return <DiceSvg />;
            }
        }
        return <DiceSvg />;
    }, [theme, props.customDice, room?.disableDiceRoller, themes, rollerApi]);

    const roll = async (button: HTMLButtonElement, hide: boolean = false) => {
        button.classList.add("rolling");
        if (!room?.disableDiceRoller && rollerApi && theme && props.customDice) {
            let parsed: { dice: IDiceRoll[]; operator: Operator | undefined } | undefined = diceToRoll(
                props.customDice.dice,
                props.customDice.theme ?? theme.id,
            );
            if (parsed) {
                await rollWrapper(rollerApi, parsed.dice, {
                    operator: parsed.operator,
                    label: "Custom Roll",
                    whisper: hide ? await getUserUuid(room, rollerApi) : undefined,
                });
            }
        } else if (props.customDice) {
            await localRoll(props.customDice.dice, "Custom Roll", addRoll, hide);
        }
        button.classList.remove("rolling");
        button.blur();
    };

    const isEnabled = useCallback(() => {
        return (initialized && !room?.disableDiceRoller) || room?.disableDiceRoller;
    }, [initialized, room?.disableDiceRoller]);

    return (
        <div
            className={`custom-dice-wrapper ${props.customDice && !props.customDice.removed ? "has-dice" : ""}`}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <Tippy
                content={
                    props.customDice && !props.customDice.removed ? props.customDice.dice : "Add new custom dice roll"
                }
            >
                <button
                    className={`button custom-dice dice-${props.button} ${isEnabled() ? "enabled" : "disabled"} ${
                        addCustom ? "open" : ""
                    }`}
                    onClick={async (e) => {
                        if (
                            (!props.customDice || props.customDice.removed) &&
                            buttons.hasOwnProperty(String(props.button))
                        ) {
                            setAddCustom(true);
                        } else if (props.customDice && !props.customDice.removed) {
                            await roll(e.currentTarget);
                        }
                    }}
                >
                    {props.customDice && !props.customDice.removed ? getDicePreview() : <AddSvg />}
                </button>
            </Tippy>
            {addCustom ? (
                <div className={"add-custom-dice"}>
                    {!room?.disableDiceRoller ? (
                        <div className={`setting dice-theme valid searching`}>
                            <Select
                                options={
                                    !isNull(themes)
                                        ? themes.map((t) => {
                                              return { value: t.id, name: t.name || t.id, icon: getThemePreview(t) };
                                          })
                                        : []
                                }
                                current={{
                                    value: currentCustomTheme?.id || theme?.id || "",
                                    name: currentCustomTheme?.name || theme?.name || "",
                                    icon: currentCustomTheme
                                        ? getThemePreview(currentCustomTheme)
                                        : theme
                                          ? getThemePreview(theme)
                                          : undefined,
                                }}
                                setTheme={setCustomTheme}
                            />
                        </div>
                    ) : null}
                    <div className={"dice-equation"}>
                        <input
                            ref={inputRef}
                            type={"text"}
                            onChange={(e) => {
                                const value = e.currentTarget.value;
                                try {
                                    if (currentCustomTheme && !room?.disableDiceRoller) {
                                        const parsed = parseRollEquation(value, currentCustomTheme);
                                        if (parsed) {
                                            setValidCustom(true);
                                            inputRef.current?.classList.remove("error");
                                            inputRef.current?.classList.add("success");
                                        }
                                    } else {
                                        const roll = new DiceRoll(value);
                                        if (roll) {
                                            setValidCustom(true);
                                            inputRef.current?.classList.remove("error");
                                            inputRef.current?.classList.add("success");
                                        }
                                    }
                                } catch {
                                    setValidCustom(false);
                                    inputRef.current?.classList.remove("success");
                                    inputRef.current?.classList.add("error");
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && validCustom) {
                                    const newButton = {
                                        [props.button]: {
                                            dice: e.currentTarget.value,
                                            theme: currentCustomTheme
                                                ? currentCustomTheme.id
                                                : theme
                                                  ? theme.id
                                                  : "dddice-bees",
                                        },
                                    };
                                    setButtons(newButton);
                                    setAddCustom(false);
                                    setValidCustom(false);
                                } else if (e.key === "Escape") {
                                    setAddCustom(false);
                                }
                            }}
                        />
                        <button
                            className={"save-custom-dice"}
                            disabled={!validCustom}
                            onClick={() => {
                                if (inputRef.current) {
                                    const newButton = {
                                        [props.button]: {
                                            dice: inputRef.current.value,
                                            theme: currentCustomTheme
                                                ? currentCustomTheme.id
                                                : theme
                                                  ? theme.id
                                                  : "dddice-bees",
                                        },
                                    };
                                    setButtons(newButton);
                                    setAddCustom(false);
                                    setValidCustom(false);
                                }
                            }}
                        >
                            √
                        </button>
                        <button
                            className={"abort-custom-dice"}
                            onClick={() => {
                                setAddCustom(false);
                            }}
                        >
                            X
                        </button>
                    </div>
                </div>
            ) : null}
            {props.customDice && !props.customDice.removed ? (
                <>
                    <button
                        className={`hidden-roll self ${hover ? "hover" : ""}`}
                        onClick={(e) => {
                            if (e.currentTarget.parentElement) {
                                roll(e.currentTarget.parentElement as HTMLButtonElement, true);
                            }
                        }}
                    >
                        HIDE
                    </button>
                    <button
                        className={`remove-dice ${hover ? "hover" : ""}`}
                        onClick={() => {
                            if (
                                props.customDice &&
                                !props.customDice.removed &&
                                buttons.hasOwnProperty(String(props.button))
                            ) {
                                const newButton = {
                                    [props.button]: { ...props.customDice, removed: true },
                                };
                                setButtons(newButton);
                            }
                        }}
                    >
                        x
                    </button>
                </>
            ) : null}
        </div>
    );
};

const QuickButtons = ({ open }: { open: boolean }) => {
    const { theme, rollerApi } = useDiceRoller();
    const addRoll = useRollLogContext(useShallow((state) => state.addRoll));
    const [room] = useMetadataContext(useShallow((state) => [state.room]));
    const [validCustom, setValidCustom] = useState<boolean>(true);

    const roll = async (element: HTMLElement, dice: string, hide: boolean = false) => {
        element.classList.add("rolling");
        if (theme && dice && !room?.disableDiceRoller) {
            let parsed: { dice: IDiceRoll[]; operator: Operator | undefined } | undefined = diceToRoll(dice, theme.id);
            if (parsed && rollerApi) {
                await rollWrapper(rollerApi, parsed.dice, {
                    operator: parsed.operator,
                    label: "Roll: Custom",
                    whisper: hide ? await getUserUuid(room, rollerApi) : undefined,
                });
            }
        } else {
            await localRoll(dice, "Roll: Custom", addRoll, hide);
        }
        element.classList.remove("rolling");
        element.blur();
    };

    const getDiceList = () => {
        const DiceListEntry = ({ preview, name }: { preview: ReactNode; name: string }) => {
            return (
                <Tippy content={name}>
                    <li
                        className={"quick-roll"}
                        onClick={async (e) => {
                            await roll(e.currentTarget, name);
                        }}
                    >
                        <div className={"quick-preview"}>{preview}</div>
                        <button
                            className={"self"}
                            onClick={async (e) => {
                                e.stopPropagation();
                                if (e.currentTarget.parentElement) {
                                    await roll(e.currentTarget.parentElement, name, true);
                                }
                            }}
                        >
                            HIDE
                        </button>
                    </li>
                </Tippy>
            );
        };

        if (theme && !room?.disableDiceRoller) {
            return theme.available_dice.map((die, index) => {
                let preview = "";
                let name = "";
                try {
                    if (die.hasOwnProperty("type")) {
                        const notation = (die as IAvailableDie).notation;
                        const id = (die as IAvailableDie).id;
                        if (theme.preview.hasOwnProperty(id)) {
                            preview = theme.preview[id];
                        } else if (notation && theme.preview.hasOwnProperty(notation)) {
                            preview = theme.preview[notation];
                        } else {
                            preview = theme.preview[(die as IAvailableDie).type];
                        }
                        name = (die as IAvailableDie).notation ?? (die as IAvailableDie).id;
                    } else {
                        preview = theme.preview[die as IDieType];
                        name = String(die);
                    }
                    if (name) {
                        name = name === "d10x" ? "d100" : name;
                        return (
                            <DiceListEntry
                                key={index}
                                preview={preview ? <img src={preview} alt={name} /> : getSvgForDiceType(name)}
                                name={name}
                            />
                        );
                    }
                } catch {
                    return null;
                }
            });
        } else {
            const quickRollDice = ["d4", "d6", "d8", "d10", "d10x", "d12", "d20"];
            return quickRollDice.map((d, index) => {
                const name = d === "d10x" ? "d100" : d;

                return <DiceListEntry key={index} preview={getSvgForDiceType(d)} name={name} />;
            });
        }
    };

    return (
        <>
            <ul className={`quick-button-list ${open ? "open" : ""}`}>
                {getDiceList()}
                <li className={"quick-custom-roll"}>
                    <DiceSvg />
                    <input
                        className={`quick-custom-input ${validCustom ? "valid" : "invalid"}`}
                        type={"text"}
                        size={2}
                        onChange={(e) => {
                            e.currentTarget.style.width = `${e.currentTarget.value.length}ch`;
                            if (e.currentTarget.value === "") {
                                setValidCustom(true);
                                return;
                            }
                            try {
                                if (theme && !room?.disableDiceRoller) {
                                    const parsed = parseRollEquation(e.currentTarget.value, theme.id);
                                    if (parsed) {
                                        setValidCustom(true);
                                    } else {
                                        setValidCustom(false);
                                    }
                                } else {
                                    const roll = new DiceRoll(e.currentTarget.value);
                                    if (roll) {
                                        setValidCustom(true);
                                    }
                                }
                            } catch {
                                setValidCustom(false);
                            }
                        }}
                        onKeyDown={async (e) => {
                            if (e.key === "Enter" && validCustom && e.currentTarget.value) {
                                await roll(e.currentTarget, e.currentTarget.value);
                            }
                        }}
                    />
                </li>
            </ul>
        </>
    );
};

const DualityDiceButton = () => {
    const [rollerApi, theme, hopeTheme, fearTheme, initialized, themes] = useDiceRoller(
        useShallow((state) => [
            state.rollerApi,
            state.theme,
            state.hopeTheme,
            state.fearTheme,
            state.initialized,
            state.themes,
        ]),
    );
    const addRoll = useRollLogContext(useShallow((state) => state.addRoll));
    const [room] = useMetadataContext(useShallow((state) => [state.room]));
    const [hover, setHover] = useState<boolean>(false);

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

            if (rollerApi) {
                try {
                    let rollResult = await rollWrapper(rollerApi, parsed.dice, {
                        label: "Roll Duality",
                        operator: parsed.operator,
                        whisper: modifier === "SELF" ? await getUserUuid(room, rollerApi) : undefined,
                    });
                    if (rollResult) {
                        if (rollResult.values[0].value > rollResult.values[1].value) {
                            rollResult.label += ": Hope";
                        } else if (rollResult.values[0].value < rollResult.values[1].value) {
                            rollResult.label += ": Fear";
                        } else {
                            rollResult.label += ": Critical";
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

            await localRoll(notation, "Roll Duality", addRoll, modifier === "SELF", undefined, true);
        }
    };

    const getDicePreview = useCallback(() => {
        if (theme && !room?.disableDiceRoller) {
            const hopeFallBackTheme = hopeTheme ?? theme;
            const fearFallBackTheme = fearTheme ?? theme;
            try {
                return (
                    <div className={"custom-dice-preview-wrapper"}>
                        {["d12", "d12"].map((die, index) => {
                            const currentTheme = index === 0 ? hopeFallBackTheme : fearFallBackTheme;
                            const preview = getDiceImage(theme, die, index, currentTheme.id, themes);
                            if (preview) {
                                return preview;
                            }
                            if (currentTheme.preview.hasOwnProperty("d12")) {
                                return (
                                    <img key={index} className={"preview-image"} src={theme.preview[die]} alt={die} />
                                );
                            } else if (!theme.preview.hasOwnProperty(die)) {
                                return (
                                    <div key={index} className={"preview-image"}>
                                        {getSvgForDiceType(die)}
                                    </div>
                                );
                            }
                        })}
                    </div>
                );
            } catch {
                return <DiceSvg />;
            }
        } else {
            return (
                <div className={"custom-dice-preview-wrapper"}>
                    <div className={"preview-image"}>{getSvgForDiceType("d12")}</div>
                    <div className={"preview-image"}>{getSvgForDiceType("d12")}</div>
                </div>
            );
        }
    }, [theme, hopeTheme, fearTheme, room?.disableDiceRoller, themes, rollerApi]);

    const isEnabled = useCallback(() => {
        return (initialized && !room?.disableDiceRoller) || room?.disableDiceRoller;
    }, [initialized, room?.disableDiceRoller]);

    return (
        <div
            className={`custom-dice-wrapper has-dice duality-dice`}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <Tippy content={"Roll Duality Dice"}>
                <button
                    className={`button custom-dice ${isEnabled() ? "enabled" : "disabled"}`}
                    onClick={async () => {
                        await roll();
                    }}
                >
                    {getDicePreview()}
                </button>
            </Tippy>

            <button
                className={`hidden-roll self ${hover ? "hover" : ""}`}
                onClick={async (e) => {
                    if (e.currentTarget.parentElement) {
                        await roll("SELF");
                    }
                }}
            >
                HIDE
            </button>
        </div>
    );
};

export const DiceRoomButtons = (props: DiceRoomButtonsProps) => {
    const { buttons, setButtons } = useDiceButtonsContext();
    const [quick, setQuick] = useState<boolean>(false);

    useEffect(() => {
        // In older version the value was only a string, we need to delete those buttons
        if (buttons) {
            Object.entries(buttons).forEach(([k, v]) => {
                if (v && isString(v)) {
                    setButtons({ [k]: null });
                }
            });
        }
    }, [buttons]);

    return (
        <div className={"dice-room-buttons"}>
            {Object.values(buttons).map((value, index) => {
                return <CustomDiceButton key={index} button={index + 1} customDice={value} />;
            })}
            <DualityDiceButton />
            <Tippy content={"Log & Settings"}>
                <button
                    className={`open-dice-tray button icon ${props.open ? "open" : "closed"}`}
                    onClick={(e) => {
                        props.setOpen(!props.open);
                        e.currentTarget.blur();
                    }}
                >
                    <RollLogSvg />
                </button>
            </Tippy>
            <div className={`quick-button-wrapper`}>
                <QuickButtons open={quick} />
                <Tippy content={"Quick roll"}>
                    <button
                        onClick={() => setQuick(!quick)}
                        className={`quick-roll-button button icon ${quick ? "open" : ""}`}
                    >
                        <DiceSvg />
                    </button>
                </Tippy>
            </div>
        </div>
    );
};
