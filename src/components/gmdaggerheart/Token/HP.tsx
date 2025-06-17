import { changeHp, changeMaxHp, getNewHpValue } from "../../../helper/tokenHelper.ts";
import { useEffect, useRef } from "react";
import { GMDMetadata } from "../../../helper/types.ts";
import { Image } from "@owlbear-rodeo/sdk";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { HPSvg } from "../../svgs/HPSvg.tsx";
import "./hp.scss";
import Tippy from "@tippyjs/react";
import { useShallow } from "zustand/react/shallow";

export const HP = ({ id }: { id: string }) => {
    const hpRef = useRef<HTMLInputElement>(null);
    const maxHpRef = useRef<HTMLInputElement>(null);
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(id)));
    const data = token?.data as GMDMetadata;
    const item = token?.item as Image;

    useEffect(() => {
        if (hpRef && hpRef.current) {
            hpRef.current.value = String(data?.hp.current);
        }
    }, [data?.hp]);

    useEffect(() => {
        if (maxHpRef && maxHpRef.current) {
            maxHpRef.current.value = String(data?.hp.max);
        }
    }, [data?.hp.max]);

    return (
        <div className={"token-hp"}>
            <HPSvg
                onClick={async () => {
                    const hp = Math.min(data.hp.current + 1, data.hp.max);
                    await changeHp(hp, data, item, hpRef);
                }}
                onContextMenu={async (e) => {
                    e.preventDefault();
                    const hp = Math.min(data.hp.current - 1, data.hp.max);
                    await changeHp(hp, data, item, hpRef);
                }}
                percent={(data.hp.current / data.hp.max) * 100}
                name={item.id}
            />
            <div className={"current-hp"}>
                <Tippy content={"Set current HP"}>
                    <input
                        ref={hpRef}
                        type={"text"}
                        defaultValue={data.hp.current}
                        onBlur={async (e) => {
                            const input = e.target.value;
                            const hp = await getNewHpValue(input, data, maxHpRef);
                            e.target.value = String(hp);
                            await changeHp(hp, data, item, hpRef);
                        }}
                        onKeyDown={async (e) => {
                            if (e.key === "ArrowUp") {
                                const hp = Math.min(data.hp.current + 1, data.hp.max);
                                await changeHp(hp, data, item, hpRef);
                                e.currentTarget.value = String(hp);
                            } else if (e.key === "ArrowDown") {
                                const hp = Math.min(data.hp.current - 1, data.hp.max);
                                await changeHp(hp, data, item, hpRef);
                                e.currentTarget.value = String(hp);
                            } else if (e.key === "Enter") {
                                const input = e.currentTarget.value;
                                const hp = await getNewHpValue(input, data, maxHpRef);
                                await changeHp(hp, data, item, hpRef);
                            }
                        }}
                    />
                </Tippy>
                <span className={"divider"}></span>
                <Tippy content={"Set max HP"}>
                    <input
                        type={"text"}
                        ref={maxHpRef}
                        defaultValue={data.hp.max}
                        onKeyDown={async (e) => {
                            if (e.key === "ArrowUp") {
                                await changeMaxHp(data.hp.max + 1, data, item, maxHpRef);
                            } else if (e.key === "ArrowDown") {
                                await changeMaxHp(data.hp.max - 1, data, item, maxHpRef);
                            } else if (e.key === "Enter") {
                                const value = Number(e.currentTarget.value.replace(/[^0-9]/g, ""));
                                await changeMaxHp(value, data, item, maxHpRef);
                            }
                        }}
                        onBlur={async (e) => {
                            const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                            await changeMaxHp(value, data, item, maxHpRef);
                        }}
                    />
                </Tippy>
            </div>
        </div>
    );
};
