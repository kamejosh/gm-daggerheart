import { itemMetadataKey } from "./variables.ts";
import { GMDMetadata } from "./types.ts";
import { Item } from "@owlbear-rodeo/sdk";
import { chunk } from "lodash";
import { updateItems, updateList } from "./obrHelper.ts";
import { updateAttachments } from "./attachmentHelpers.ts";

export const getIsPlayer = (list: Array<Item>) => {
    const isPlayer = list.map((token) => {
        const metadata = token.metadata[itemMetadataKey] as GMDMetadata;
        return metadata.isPlayer;
    });
    return isPlayer.some((is) => is);
};

export const getIsOnMap = (list: Array<Item>) => {
    const onMap = list.map((token) => {
        const metadata = token.metadata[itemMetadataKey] as GMDMetadata;
        return metadata.showOnMap;
    });
    return onMap.some((map) => map);
};

export const toggleOnMap = async (list: Array<Item>) => {
    const current = getIsOnMap(list);
    const chunks = chunk(list, 4);
    for (const subList of chunks) {
        await updateItems(
            subList.map((i) => i.id),
            (items) => {
                items.forEach((item) => {
                    (item.metadata[itemMetadataKey] as GMDMetadata).showOnMap = !current;
                });
            },
        );
    }
    await updateList(list, current ? 4 : 2, async (subList) => {
        for (const item of subList) {
            const data = item.metadata[itemMetadataKey] as GMDMetadata;
            await updateAttachments(item, { ...data, showOnMap: !current });
        }
    });
};
