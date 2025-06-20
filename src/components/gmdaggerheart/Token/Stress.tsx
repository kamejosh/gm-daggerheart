import { updateTokenMetadata } from "../../../helper/tokenHelper.ts";
import { useEffect, useRef } from "react";
import { GMDMetadata } from "../../../helper/types.ts";
import { Image } from "@owlbear-rodeo/sdk";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import "./hp.scss";
import Tippy from "@tippyjs/react";
import { useShallow } from "zustand/react/shallow";
import { StressSvg } from "../../svgs/StressSvg.tsx";
import { toNumber } from "lodash";

export const Stress = ({ id, hasOwnership }: { id: string; hasOwnership: boolean }) => {
    const stressRef = useRef<HTMLInputElement>(null);
    const maxStressRef = useRef<HTMLInputElement>(null);
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(id)));
    const data = token?.data as GMDMetadata;
    const item = token?.item as Image;

    useEffect(() => {
        if (stressRef && stressRef.current) {
            stressRef.current.value = String(data?.stress.current);
        }
    }, [data?.stress]);

    useEffect(() => {
        if (maxStressRef && maxStressRef.current) {
            maxStressRef.current.value = String(data?.stress.max);
        }
    }, [data?.stress.max]);

    return (
        <div className={"token-stress"}>
            <Tippy
                content={"Stress (click to add, right click to remove)"}
                placement={"bottom-start"}
                disabled={!hasOwnership}
            >
                <div>
                    <StressSvg
                        onClick={async () => {
                            if (hasOwnership) {
                                const stress = Math.min(data.stress.current + 1, data.stress.max);
                                const hp =
                                    stress === data.stress.max ? Math.max(data.hp.current - 1, 0) : data.hp.current;
                                await updateTokenMetadata(
                                    {
                                        ...data,
                                        stress: { ...data.stress, current: stress },
                                        hp: { ...data.hp, current: hp },
                                    },
                                    [id],
                                );
                            }
                        }}
                        onContextMenu={async (e) => {
                            if (hasOwnership) {
                                e.preventDefault();
                                const stress = Math.max(data.stress.current - 1, 0);
                                await updateTokenMetadata({ ...data, stress: { ...data.stress, current: stress } }, [
                                    id,
                                ]);
                            }
                        }}
                        percent={(data.stress.max / data.stress.current) * 100}
                        name={item.id}
                    />
                </div>
            </Tippy>
            <div className={"current-hp"}>
                {hasOwnership ? (
                    <>
                        <Tippy content={"Set current Stress"}>
                            <input
                                ref={stressRef}
                                type={"text"}
                                defaultValue={data.stress.current}
                                onBlur={async (e) => {
                                    const input = toNumber(e.target.value);
                                    const stress = Math.min(input, data.stress.max);
                                    e.target.value = String(stress);
                                    await updateTokenMetadata(
                                        { ...data, stress: { ...data.stress, current: stress } },
                                        [id],
                                    );
                                }}
                                onKeyDown={async (e) => {
                                    if (e.key === "ArrowUp") {
                                        const stress = Math.min(data.stress.current + 1, data.stress.max);
                                        e.currentTarget.value = String(stress);
                                        await updateTokenMetadata(
                                            { ...data, stress: { ...data.stress, current: stress } },
                                            [id],
                                        );
                                    } else if (e.key === "ArrowDown") {
                                        const stress = Math.min(data.stress.current - 1, data.stress.max);
                                        e.currentTarget.value = String(stress);
                                        await updateTokenMetadata(
                                            { ...data, stress: { ...data.stress, current: stress } },
                                            [id],
                                        );
                                    } else if (e.key === "Enter") {
                                        const input = toNumber(e.currentTarget.value);
                                        const stress = Math.min(input, data.stress.max);
                                        e.currentTarget.value = String(stress);
                                        await updateTokenMetadata(
                                            { ...data, stress: { ...data.stress, current: stress } },
                                            [id],
                                        );
                                    }
                                }}
                            />
                        </Tippy>
                        <span className={"divider"}></span>
                        <Tippy content={"Set max Stress"}>
                            <input
                                type={"text"}
                                ref={maxStressRef}
                                defaultValue={data.stress.max}
                                onKeyDown={async (e) => {
                                    if (e.key === "ArrowUp") {
                                        await updateTokenMetadata(
                                            {
                                                ...data,
                                                stress: {
                                                    current: Math.min(data.stress.current, data.stress.max + 1),
                                                    max: data.stress.max + 1,
                                                },
                                            },
                                            [id],
                                        );
                                    } else if (e.key === "ArrowDown") {
                                        await updateTokenMetadata(
                                            {
                                                ...data,
                                                stress: {
                                                    current: Math.min(data.stress.current, data.stress.max - 1),
                                                    max: data.stress.max - 1,
                                                },
                                            },
                                            [id],
                                        );
                                    } else if (e.key === "Enter") {
                                        const stress = toNumber(e.currentTarget.value);
                                        await updateTokenMetadata(
                                            {
                                                ...data,
                                                stress: {
                                                    current: Math.min(data.stress.current, stress),
                                                    max: stress,
                                                },
                                            },
                                            [id],
                                        );
                                    }
                                }}
                                onBlur={async (e) => {
                                    const stress = toNumber(e.currentTarget.value);
                                    await updateTokenMetadata(
                                        {
                                            ...data,
                                            stress: {
                                                current: Math.min(data.stress.current, stress),
                                                max: stress,
                                            },
                                        },
                                        [id],
                                    );
                                }}
                            />
                        </Tippy>{" "}
                    </>
                ) : (
                    <>
                        {data.stress.current}/{data.stress.max}
                    </>
                )}
            </div>
        </div>
    );
};
