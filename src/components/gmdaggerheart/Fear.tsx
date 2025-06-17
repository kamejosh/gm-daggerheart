import { useMetadataContext } from "../../context/MetadataContext.ts";
import { useShallow } from "zustand/react/shallow";
import styles from "./fear.module.scss";
import { DiamondSvg } from "../svgs/DiamondSvg.tsx";
import { updateRoomMetadata } from "../../helper/helpers.ts";

export const Fear = () => {
    const room = useMetadataContext(useShallow((state) => state.room));

    return (
        <div className={styles.fear}>
            <div className={styles.active}>
                {[...new Array(room?.fear || 0)].map((_, index) => {
                    return (
                        <DiamondSvg
                            key={index}
                            onClick={async () => {
                                await updateRoomMetadata(room, { fear: Math.max((room?.fear || 0) - 1, 0) });
                            }}
                            onContextMenu={() => {}}
                        />
                    );
                })}
            </div>
            <div className={styles.inactive}>
                {[...new Array(12 - (room?.fear || 0))].map((_, index) => {
                    return (
                        <DiamondSvg
                            key={index}
                            onClick={async () => {
                                await updateRoomMetadata(room, { fear: Math.min((room?.fear || 0) + 1, 12) });
                            }}
                            onContextMenu={() => {}}
                        />
                    );
                })}
            </div>
        </div>
    );
};
