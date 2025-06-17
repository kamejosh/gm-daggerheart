import OBR, { Image, Item, Metadata } from "@owlbear-rodeo/sdk";
import { defaultMetadata, infoMetadataKey, itemMetadataKey, metadataKey } from "./variables.ts";
import { AttachmentMetadata, GMDMetadata, RoomMetadata, SceneMetadata } from "./types.ts";
import { isEqual, isObject } from "lodash";
import { IRoll, IRoomParticipant } from "dddice-js";
import { RollLogEntryType } from "../context/RollLogContext.tsx";
import { chunk } from "lodash";
import { deleteItems, updateItems } from "./obrHelper.ts";

export const getAttachedItems = async (id: string, itemTypes: Array<string>) => {
    const items = await OBR.scene.items.getItemAttachments([id]);
    // why am I not using .filter()? because if I do there is a bug and I can't find it
    const attachments: Item[] = [];
    items.forEach((item) => {
        if (
            infoMetadataKey in item.metadata &&
            (itemTypes.length === 0 || itemTypes.indexOf(item.type) >= 0) &&
            item.attachedTo === id
        ) {
            attachments.push(item);
        }
    });

    return attachments;
};

export const getImageBounds = async (item: Image) => {
    const dpi = await OBR.scene.grid.getDpi();
    const dpiScale = dpi / item.grid.dpi;
    const width = item.image.width * dpiScale * item.scale.x;
    const height = item.image.height * dpiScale * item.scale.y;
    const offsetX = (item.grid.offset.x / item.image.width) * width;
    const offsetY = (item.grid.offset.y / item.image.height) * height;

    return {
        position: {
            x: item.position.x - offsetX,
            y: item.position.y - offsetY,
        },
        width: width,
        height: height,
    };
};

export const deleteAttachments = async (attachments: Item[]) => {
    if (attachments.length > 0) {
        await deleteItems(attachments.map((attachment) => attachment.id));
    }
};

export const evalString = (s: string) => {
    const tokens = s.replace(/\s/g, "").match(/[+\-]?([0-9]+)/g) || [];

    // @ts-ignore this works but ts doesn't like it
    return tokens.reduce((sum: string, value: string) => parseFloat(sum) + parseFloat(value));
};

export const sortItems = (a: Item, b: Item) => {
    const aData = a.metadata[itemMetadataKey] as GMDMetadata;
    const bData = b.metadata[itemMetadataKey] as GMDMetadata;
    if (aData && bData && aData.index !== undefined && bData.index !== undefined) {
        if (aData.index < bData.index) {
            return -1;
        } else if (aData.index > bData.index) {
            return 1;
        } else {
            return 0;
        }
    }
    return 0;
};

export const attachmentFilter = (attachment: Item) => {
    if (infoMetadataKey in attachment.metadata) {
        const metadata = attachment.metadata[infoMetadataKey] as AttachmentMetadata;
        return metadata.gmdAttachment;
    }
    return false;
};

export const updateSceneMetadata = async (scene: SceneMetadata | null, data: Partial<SceneMetadata>) => {
    const ownMetadata: Metadata = {};
    ownMetadata[metadataKey] = { ...scene, ...data };

    if (!scene || !isEqual({ ...scene, ...data }, scene)) {
        await OBR.scene.setMetadata({ ...ownMetadata });
    }
};

export const updateRoomMetadata = async (
    room: RoomMetadata | null,
    data: Partial<RoomMetadata>,
    additionalData?: Metadata,
    force: boolean = false,
) => {
    const ownMetadata: Metadata = additionalData ?? {};
    ownMetadata[metadataKey] = { ...room, ...data };

    if (!room || !isEqual({ ...room, ...data }, room) || force) {
        await OBR.room.setMetadata({ ...ownMetadata });
    }
};

export const dddiceRollToRollLog = async (
    roll: IRoll,
    options?: { participant?: IRoomParticipant; owlbear_user_id?: string },
): Promise<RollLogEntryType> => {
    let username = roll.external_id ?? roll.user.username;
    let participantName = "";
    if (options && options.participant && options.participant.username) {
        participantName = options.participant.username;
    } else {
        const particip = roll.room.participants.find((p) => p.user.uuid === roll.user.uuid);
        if (particip && particip.username) {
            participantName = particip.username;
        }
    }

    if ((roll.user.name === "Guest User" && !roll.external_id) || username.includes("dndb")) {
        username = participantName;
    }

    return {
        uuid: roll.uuid,
        created_at: roll.created_at,
        equation: roll.equation,
        label: roll.label,
        is_hidden: roll.values.some((v) => v.is_hidden),
        total_value: roll.total_value,
        username: username,
        values: roll.values.map((v) => {
            if (v.is_user_value) {
                return `+${String(v.value)}`;
            } else {
                return String(v.value);
            }
        }),
        owlbear_user_id: options?.owlbear_user_id,
        participantUsername: participantName,
    };
};

export const getRoomDiceUser = (room: RoomMetadata | null, id: string | null) => {
    return room?.diceUser?.find((user) => user.playerId === id);
};

export const reorderMetadataIndex = async (list: Array<Image>, group?: string) => {
    const chunks = chunk(list, 12);
    let index = 0;
    for (const subList of chunks) {
        try {
            await updateItems(
                subList.map((i) => i.id),
                (items) => {
                    items.forEach((item) => {
                        const data = item.metadata[itemMetadataKey] as GMDMetadata;
                        data.index = index;
                        if (group) {
                            data.group = group;
                        }
                        index++;
                        item.metadata[itemMetadataKey] = { ...data };
                    });
                },
            );
        } catch (e) {
            const errorName =
                isObject(e) && "error" in e && isObject(e.error) && "name" in e.error
                    ? e.error.name
                    : "Undefined Error";
            console.warn(`GM's Daggerheart: Error while updating reordering ${subList.length} tokens: ${errorName}`);
        }
    }
};

export const modulo = (n: number, m: number) => {
    return ((n % m) + m) % m;
};

export const delay = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

export const initToken = (token: Item) => {
    if (itemMetadataKey in token.metadata) {
        const data = token.metadata[itemMetadataKey] as GMDMetadata;
        token.metadata[itemMetadataKey] = { ...data, active: true };
    } else {
        token.metadata[itemMetadataKey] = defaultMetadata;
    }
};

export const getTokenName = (token: Image) => {
    try {
        if (token.text && token.text.plainText && token.text.plainText.replaceAll(" ", "").length > 0) {
            return token.text.plainText;
        } else {
            return token.name;
        }
    } catch {
        return "";
    }
};

export const generateSlug = (string: string) => {
    let str = string.replace(/^\s+|\s+$/g, "");
    str = str.toLowerCase();
    str = str
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

    return str;
};
