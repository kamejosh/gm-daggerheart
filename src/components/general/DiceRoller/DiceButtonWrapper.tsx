import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { useCallback, useState } from "react";
import { diceToRoll, getUserUuid, localRoll, rollerCallback, rollWrapper } from "../../../helper/diceHelper.ts";
import { useRollLogContext } from "../../../context/RollLogContext.tsx";
import { IRoll, ITheme, parseRollEquation } from "dddice-js";
import { getDiceImage, getSvgForDiceType } from "../../../helper/previewHelpers.tsx";
import { D20 } from "../../svgs/dice/D20.tsx";
import Tippy from "@tippyjs/react";
import { useShallow } from "zustand/react/shallow";
import "./dice-button-wrapper.scss";
import { DiceRoll } from "@dice-roller/rpg-dice-roller";
import { autoPlacement, useFloating } from "@floating-ui/react";

type DiceButtonProps = {
    dice: Array<{ notation: string; label: string; theme?: ITheme | null }>;
    text: string;
    label: string;
    character?: string;
    onRoll?: (rollResult?: Array<IRoll | DiceRoll | null>) => void;
    classes?: string;
};
export const DiceButton = (props: DiceButtonProps) => {
    const [room] = useMetadataContext(useShallow((state) => [state.room]));
    const addRoll = useRollLogContext(useShallow((state) => state.addRoll));
    const [rollerApi, initialized, theme] = useDiceRoller(
        useShallow((state) => [state.rollerApi, state.initialized, state.theme]),
    );
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const { refs } = useFloating({
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

    const roll = async (modifier?: "ADV" | "DIS" | "SELF" | "CRIT") => {
        const button = refs.domReference.current;
        if (button) {
            button.classList.add("rolling");
            let label = props.label;
            let modifiedDice = props.dice[0].notation;

            let rollResult = null;
            if (theme && !room?.disableDiceRoller) {
                const parsed = diceToRoll(modifiedDice, theme.id);
                if (parsed && rollerApi) {
                    try {
                        rollResult = await rollWrapper(rollerApi, parsed.dice, {
                            label: label,
                            operator: parsed.operator,
                            external_id: props.character,
                            whisper: modifier === "SELF" ? await getUserUuid(room, rollerApi) : undefined,
                        });
                        // @ts-ignore
                        await rollerCallback(rollResult, addRoll);
                    } catch {
                        console.warn("error in dice roll", parsed.dice, parsed.operator);
                    }
                }
            } else {
                rollResult = await localRoll(modifiedDice, label, addRoll, modifier === "SELF", props.character);
            }
            if (props.onRoll) {
                props.onRoll([rollResult]);
            }
            button.classList.remove("rolling");
            try {
                (button as HTMLElement).blur();
            } catch {}
        }
    };

    const getDicePreview = () => {
        try {
            const parsed = parseRollEquation(props.dice[0].notation, "dddice-bees");
            const die = parsed.dice.find((d) => d.type !== "mod");
            if (die) {
                if (room?.disableDiceRoller) {
                    return getSvgForDiceType(die.type);
                } else {
                    if (theme) {
                        const image = getDiceImage(theme, die.type, 0);
                        return image ?? <D20 />;
                    } else {
                        return <D20 />;
                    }
                }
            } else {
                return <D20 />;
            }
        } catch {
            return <D20 />;
        }
    };

    const isEnabled = useCallback(() => {
        return (initialized && !room?.disableDiceRoller) || room?.disableDiceRoller;
    }, [initialized, room?.disableDiceRoller]);

    return (
        <Tippy
            content={!initialized && !room?.disableDiceRoller ? "Dice Roller is not initialized" : ""}
            disabled={!(!initialized && !room?.disableDiceRoller)}
        >
            <span
                className={`button-wrapper ${props.classes} ${isEnabled() ? "enabled" : "disabled"} ${
                    room?.disableDiceRoller ? "calculated" : "three-d-dice"
                }`}
                onMouseEnter={() => {
                    setIsOpen(true);
                }}
                onMouseLeave={() => setIsOpen(false)}
            >
                <button
                    ref={refs.setReference}
                    disabled={!isEnabled()}
                    className={`dice-button button`}
                    onClick={async () => {
                        await roll();
                    }}
                >
                    <div className={"dice-preview"}>{getDicePreview()}</div>
                    {props.text.replace(/\s/g, "").replace("&nbsp", " ")}
                </button>
            </span>
        </Tippy>
    );
};
