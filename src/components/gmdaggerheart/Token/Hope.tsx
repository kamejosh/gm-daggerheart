import { updateTokenMetadata } from "../../../helper/tokenHelper.ts";
import { useEffect, useRef } from "react";
import { GMDMetadata } from "../../../helper/types.ts";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import "./hp.scss";
import Tippy from "@tippyjs/react";
import { useShallow } from "zustand/react/shallow";
import { toNumber } from "lodash";
import { DiamondSvg } from "../../svgs/DiamondSvg.tsx";

export const Hope = ({ id, hasOwnership }: { id: string; hasOwnership: boolean }) => {
    const hopeRef = useRef<HTMLInputElement>(null);
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(id)));
    const data = token?.data as GMDMetadata;

    useEffect(() => {
        if (hopeRef && hopeRef.current) {
            hopeRef.current.value = String(data?.hope);
        }
    }, [data?.hope]);

    return (
        <div className={"token-hope"}>
            <DiamondSvg
                onClick={async () => {
                    if (hasOwnership) {
                        const hope = Math.min(data.hope + 1, 6);
                        await updateTokenMetadata({ ...data, hope: hope }, [id]);
                    }
                }}
                onContextMenu={async (e) => {
                    if (hasOwnership) {
                        e.preventDefault();
                        const hope = Math.max(data.hope - 1, 0);
                        await updateTokenMetadata({ ...data, hope: hope }, [id]);
                    }
                }}
            />
            <div className={"current-hp"}>
                {hasOwnership ? (
                    <>
                        <Tippy content={"Set current Hope"}>
                            <input
                                ref={hopeRef}
                                type={"text"}
                                defaultValue={data.hope}
                                onBlur={async (e) => {
                                    const input = toNumber(e.target.value);
                                    const hope = Math.max(Math.min(input, 6), 0);
                                    e.target.value = String(hope);
                                    await updateTokenMetadata({ ...data, hope: hope }, [id]);
                                }}
                                onKeyDown={async (e) => {
                                    if (e.key === "ArrowUp") {
                                        const hope = Math.min(data.hope + 1, 6);
                                        e.currentTarget.value = String(hope);
                                        await updateTokenMetadata({ ...data, hope: hope }, [id]);
                                    } else if (e.key === "ArrowDown") {
                                        const hope = Math.min(data.hope - 1, 0);
                                        e.currentTarget.value = String(hope);
                                        await updateTokenMetadata({ ...data, hope: hope }, [id]);
                                    } else if (e.key === "Enter") {
                                        const input = toNumber(e.currentTarget.value);
                                        const hope = Math.max(Math.min(input, 6), 0);
                                        e.currentTarget.value = String(hope);
                                        await updateTokenMetadata({ ...data, hope: hope }, [id]);
                                    }
                                }}
                            />
                        </Tippy>
                    </>
                ) : (
                    <>{data.hope}</>
                )}
            </div>
        </div>
    );
};
