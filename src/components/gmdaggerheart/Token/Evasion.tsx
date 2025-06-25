import { updateTokenMetadata } from "../../../helper/tokenHelper.ts";
import { useEffect, useRef } from "react";
import { GMDMetadata } from "../../../helper/types.ts";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import "./hp.scss";
import Tippy from "@tippyjs/react";
import { useShallow } from "zustand/react/shallow";
import { toNumber } from "lodash";
import { EvasionSvg } from "../../svgs/EvasionSvg.tsx";
import { InitiativeSvg } from "../../svgs/InitiativeSvg.tsx";

export const Evasion = ({ id, hasOwnership }: { id: string; hasOwnership: boolean }) => {
    const evasionRef = useRef<HTMLInputElement>(null);
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(id)));
    const data = token?.data as GMDMetadata;

    useEffect(() => {
        if (evasionRef && evasionRef.current) {
            evasionRef.current.value = String(data?.evasion);
        }
    }, [data?.evasion]);

    return (
        <div className={"token-evasion"}>
            <Tippy
                content={data.isPlayer ? "Evasion" : "Difficulty"}
                placement={"bottom-start"}
                disabled={!hasOwnership}
            >
                <div>{data.isPlayer ? <EvasionSvg /> : <InitiativeSvg />}</div>
            </Tippy>
            <div className={"current-hp"}>
                {hasOwnership ? (
                    <>
                        <Tippy content={"Set current Evasion"}>
                            <input
                                ref={evasionRef}
                                type={"text"}
                                defaultValue={data.evasion}
                                onBlur={async (e) => {
                                    const input = toNumber(e.target.value);
                                    const evasion = Math.max(input, 0);
                                    e.target.value = String(evasion);
                                    await updateTokenMetadata({ ...data, evasion: evasion }, [id]);
                                }}
                                onKeyDown={async (e) => {
                                    if (e.key === "ArrowUp") {
                                        const evasion = data.evasion + 1;
                                        e.currentTarget.value = String(evasion);
                                        await updateTokenMetadata({ ...data, evasion: evasion }, [id]);
                                    } else if (e.key === "ArrowDown") {
                                        const evasion = Math.min(data.evasion - 1, 0);
                                        e.currentTarget.value = String(evasion);
                                        await updateTokenMetadata({ ...data, evasion: evasion }, [id]);
                                    } else if (e.key === "Enter") {
                                        const input = toNumber(e.currentTarget.value);
                                        const evasion = Math.max(input, 0);
                                        e.currentTarget.value = String(evasion);
                                        await updateTokenMetadata({ ...data, evasion: evasion }, [id]);
                                    }
                                }}
                            />
                        </Tippy>
                    </>
                ) : (
                    <>{data.evasion}</>
                )}
            </div>
        </div>
    );
};
