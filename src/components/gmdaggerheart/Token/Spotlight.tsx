import { updateTokenMetadata } from "../../../helper/tokenHelper.ts";
import { useEffect, useRef } from "react";
import { GMDMetadata } from "../../../helper/types.ts";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import "./hp.scss";
import Tippy from "@tippyjs/react";
import { useShallow } from "zustand/react/shallow";
import { toNumber } from "lodash";
import { SpotlightSvg } from "../../svgs/SpotlightSvg.tsx";

export const Spotlight = ({ id, hasOwnership }: { id: string; hasOwnership: boolean }) => {
    const spotlightRef = useRef<HTMLInputElement>(null);
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(id)));
    const data = token?.data as GMDMetadata;

    useEffect(() => {
        if (spotlightRef && spotlightRef.current) {
            spotlightRef.current.value = String(data?.spotlight);
        }
    }, [data?.spotlight]);

    return (
        <div className={"token-spotlight"}>
            <SpotlightSvg
                onClick={async () => {
                    if (hasOwnership) {
                        const spotlight = Math.min(data.spotlight + 1, 6);
                        await updateTokenMetadata({ ...data, spotlight: spotlight }, [id]);
                    }
                }}
                onContextMenu={async (e) => {
                    if (hasOwnership) {
                        e.preventDefault();
                        const spotlight = Math.max(data.spotlight - 1, 0);
                        await updateTokenMetadata({ ...data, spotlight: spotlight }, [id]);
                    }
                }}
            />
            <div className={"current-hp"}>
                {hasOwnership ? (
                    <>
                        <Tippy content={"Set current Spotlight"}>
                            <input
                                ref={spotlightRef}
                                type={"text"}
                                defaultValue={data.spotlight}
                                onBlur={async (e) => {
                                    const input = toNumber(e.target.value);
                                    const spotlight = Math.max(Math.min(input, 6), 0);
                                    e.target.value = String(spotlight);
                                    await updateTokenMetadata({ ...data, spotlight: spotlight }, [id]);
                                }}
                                onKeyDown={async (e) => {
                                    if (e.key === "ArrowUp") {
                                        const spotlight = Math.min(data.spotlight + 1, 6);
                                        e.currentTarget.value = String(spotlight);
                                        await updateTokenMetadata({ ...data, spotlight: spotlight }, [id]);
                                    } else if (e.key === "ArrowDown") {
                                        const spotlight = Math.min(data.spotlight - 1, 0);
                                        e.currentTarget.value = String(spotlight);
                                        await updateTokenMetadata({ ...data, spotlight: spotlight }, [id]);
                                    } else if (e.key === "Enter") {
                                        const input = toNumber(e.currentTarget.value);
                                        const spotlight = Math.max(Math.min(input, 6), 0);
                                        e.currentTarget.value = String(spotlight);
                                        await updateTokenMetadata({ ...data, spotlight: spotlight }, [id]);
                                    }
                                }}
                            />
                        </Tippy>
                    </>
                ) : (
                    <>{data.spotlight}</>
                )}
            </div>
        </div>
    );
};
