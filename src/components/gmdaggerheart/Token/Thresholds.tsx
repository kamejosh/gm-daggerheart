import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { useShallow } from "zustand/react/shallow";
import { GMDMetadata } from "../../../helper/types.ts";
import styles from "./threshold.module.scss";
import { updateTokenMetadata } from "../../../helper/tokenHelper.ts";
import Tippy from "@tippyjs/react";
import { useState } from "react";
import { toNumber } from "lodash";

const ConnectionArrow = ({ threshold, id }: { threshold: number; id: string }) => {
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(id)));
    const data = token?.data as GMDMetadata;
    const [edit, setEdit] = useState<boolean>(false);

    return (
        <div className={styles.connectionArrow} onClick={() => setEdit(!edit)}>
            {edit ? (
                <input
                    autoFocus={true}
                    className={styles.edit}
                    value={threshold}
                    onChange={async (e) => {
                        const input = toNumber(e.target.value);
                        if (threshold === data.thresholds.major) {
                            await updateTokenMetadata({ ...data, thresholds: { ...data.thresholds, major: input } }, [
                                id,
                            ]);
                        } else {
                            await updateTokenMetadata({ ...data, thresholds: { ...data.thresholds, sever: input } }, [
                                id,
                            ]);
                        }
                    }}
                    onKeyDown={async (e) => {
                        if (e.key === "Enter") {
                            setEdit(false);
                        }
                    }}
                />
            ) : (
                threshold
            )}
        </div>
    );
};

export const Thresholds = ({ id }: { id: string }) => {
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(id)));
    const data = token?.data as GMDMetadata;

    return (
        <Tippy content={"Damage Thresholds (click to apply damage)"}>
            <div className={styles.damageThresholds}>
                <span
                    onClick={async () => {
                        const hp = Math.max(data.hp.current - 1, 0);
                        await updateTokenMetadata({ ...data, hp: { ...data.hp, current: hp } }, [id]);
                    }}
                >
                    1
                </span>
                <ConnectionArrow threshold={data.thresholds.major} id={id} />
                <span
                    onClick={async () => {
                        const hp = Math.max(data.hp.current - 2, 0);
                        await updateTokenMetadata({ ...data, hp: { ...data.hp, current: hp } }, [id]);
                    }}
                >
                    2
                </span>
                <ConnectionArrow threshold={data.thresholds.sever} id={id} />
                <span
                    onClick={async () => {
                        const hp = Math.max(data.hp.current - 3, 0);
                        await updateTokenMetadata({ ...data, hp: { ...data.hp, current: hp } }, [id]);
                    }}
                >
                    3
                </span>
            </div>
        </Tippy>
    );
};
