import { GMDMetadata } from "../../../helper/types.ts";
import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { useShallow } from "zustand/react/shallow";
import { Image } from "@owlbear-rodeo/sdk";
import { getTokenName } from "../../../helper/helpers.ts";
import { useEffect, useMemo, useState } from "react";
import { autoPlacement, safePolygon, useFloating, useHover, useInteractions } from "@floating-ui/react";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { rollDualityDice } from "../../../helper/diceHelper.ts";
import { useRollLogContext } from "../../../context/RollLogContext.tsx";
import styles from "./stats.module.scss";
import { EditSvg } from "../../svgs/EditSvg.tsx";
import { updateTokenMetadata } from "../../../helper/tokenHelper.ts";
import { toNumber } from "lodash";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import Tippy from "@tippyjs/react";
import { useComponentContext } from "../../../context/ComponentContext.tsx";

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
    const { component } = useComponentContext();
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

    useEffect(() => {
        if (!edit && debounceValue !== value.toString()) {
            setValue(toNumber(debounceValue));
        }
    }, [edit]);

    const isEnabled = useMemo(() => {
        return component === "popover" || (initialized && !room?.disableDiceRoller) || room?.disableDiceRoller;
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
                        await rollDualityDice(
                            value,
                            name,
                            character,
                            data,
                            id,
                            addRoll,
                            room,
                            hopeTheme,
                            fearTheme,
                            theme,
                            component !== "popover" ? rollerApi : null,
                        );
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
                            await rollDualityDice(
                                value,
                                name,
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
                                value,
                                name,
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
                    <Tippy content={"Reactions do not change hope/stress/fear"}>
                        <button
                            className={"reaction"}
                            disabled={!isEnabled}
                            onClick={async () => {
                                await rollDualityDice(
                                    value,
                                    name,
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
                    </Tippy>
                    <button
                        className={"self"}
                        disabled={!isEnabled}
                        onClick={async () => {
                            await rollDualityDice(
                                value,
                                name,
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
