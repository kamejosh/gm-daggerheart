import { updateTokenMetadata } from "../../../helper/tokenHelper.ts";
import { useEffect, useRef } from "react";
import { GMDMetadata } from "../../../helper/types.ts";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import "./hp.scss";
import Tippy from "@tippyjs/react";
import { useShallow } from "zustand/react/shallow";
import { ShieldSvg } from "../../svgs/ShieldSvg.tsx";
import { toNumber } from "lodash";

export const Armor = ({ id, hasOwnership }: { id: string; hasOwnership: boolean }) => {
    const armorRef = useRef<HTMLInputElement>(null);
    const maxArmorRef = useRef<HTMLInputElement>(null);
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(id)));
    const data = token?.data as GMDMetadata;

    useEffect(() => {
        if (armorRef && armorRef.current) {
            armorRef.current.value = String(data?.armor.current);
        }
    }, [data?.armor]);

    useEffect(() => {
        if (maxArmorRef && maxArmorRef.current) {
            maxArmorRef.current.value = String(data?.armor.max);
        }
    }, [data?.armor.max]);

    return (
        <div className={"token-armor"}>
            <Tippy
                content={"Armor (click to add, right click to remove)"}
                placement={"bottom-start"}
                disabled={!hasOwnership}
            >
                <div>
                    <ShieldSvg
                        onClick={async () => {
                            if (hasOwnership) {
                                const armor = Math.min(data.armor.current + 1, data.armor.max);
                                await updateTokenMetadata({ ...data, armor: { ...data.armor, current: armor } }, [id]);
                            }
                        }}
                        onContextMenu={async (e) => {
                            if (hasOwnership) {
                                e.preventDefault();
                                const armor = Math.max(data.armor.current - 1, 0);
                                await updateTokenMetadata({ ...data, armor: { ...data.armor, current: armor } }, [id]);
                            }
                        }}
                    />
                </div>
            </Tippy>
            <div className={"current-hp"}>
                {hasOwnership ? (
                    <>
                        <Tippy content={"Set current Armor"}>
                            <input
                                ref={armorRef}
                                type={"text"}
                                defaultValue={data.armor.current}
                                onBlur={async (e) => {
                                    const input = toNumber(e.target.value);
                                    const armor = Math.min(input, data.armor.max);
                                    e.target.value = String(armor);
                                    await updateTokenMetadata({ ...data, armor: { ...data.armor, current: armor } }, [
                                        id,
                                    ]);
                                }}
                                onKeyDown={async (e) => {
                                    if (e.key === "ArrowUp") {
                                        const armor = Math.min(data.armor.current + 1, data.armor.max);
                                        e.currentTarget.value = String(armor);
                                        await updateTokenMetadata(
                                            { ...data, armor: { ...data.armor, current: armor } },
                                            [id],
                                        );
                                    } else if (e.key === "ArrowDown") {
                                        const armor = Math.min(data.armor.current - 1, data.armor.max);
                                        e.currentTarget.value = String(armor);
                                        await updateTokenMetadata(
                                            { ...data, armor: { ...data.armor, current: armor } },
                                            [id],
                                        );
                                    } else if (e.key === "Enter") {
                                        const input = toNumber(e.currentTarget.value);
                                        const armor = Math.min(input, data.armor.max);
                                        e.currentTarget.value = String(armor);
                                        await updateTokenMetadata(
                                            { ...data, armor: { ...data.armor, current: armor } },
                                            [id],
                                        );
                                    }
                                }}
                            />
                        </Tippy>
                        <span className={"divider"}></span>
                        <Tippy content={"Set max Armor"}>
                            <input
                                type={"text"}
                                ref={maxArmorRef}
                                defaultValue={data.armor.max}
                                onKeyDown={async (e) => {
                                    if (e.key === "ArrowUp") {
                                        await updateTokenMetadata(
                                            {
                                                ...data,
                                                armor: {
                                                    current: Math.min(data.armor.current, data.armor.max + 1),
                                                    max: data.armor.max + 1,
                                                },
                                            },
                                            [id],
                                        );
                                    } else if (e.key === "ArrowDown") {
                                        await updateTokenMetadata(
                                            {
                                                ...data,
                                                armor: {
                                                    current: Math.min(data.armor.current, data.armor.max - 1),
                                                    max: data.armor.max - 1,
                                                },
                                            },
                                            [id],
                                        );
                                    } else if (e.key === "Enter") {
                                        const armor = toNumber(e.currentTarget.value);
                                        await updateTokenMetadata(
                                            {
                                                ...data,
                                                armor: {
                                                    current: Math.min(data.armor.current, armor),
                                                    max: armor,
                                                },
                                            },
                                            [id],
                                        );
                                    }
                                }}
                                onBlur={async (e) => {
                                    const armor = toNumber(e.currentTarget.value);
                                    await updateTokenMetadata(
                                        {
                                            ...data,
                                            armor: {
                                                current: Math.min(data.armor.current, armor),
                                                max: armor,
                                            },
                                        },
                                        [id],
                                    );
                                }}
                            />
                        </Tippy>
                    </>
                ) : (
                    <>
                        {data.armor.current}/{data.armor.max}
                    </>
                )}
            </div>
        </div>
    );
};
