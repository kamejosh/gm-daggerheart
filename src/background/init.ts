import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { ID, itemMetadataKey, metadataKey, version } from "../helper/variables.ts";
import { ItemChanges, GMDMetadata, RoomMetadata, SceneMetadata } from "../helper/types.ts";
import { v4 as uuidv4 } from "uuid";
import { attachmentFilter, getAttachedItems, initToken } from "../helper/helpers.ts";
import { setupDddice } from "./dddice.ts";
import { updateItems } from "../helper/obrHelper.ts";
import { saveOrChangeAttachments, updateAttachmentChanges } from "../helper/attachmentHelpers.ts";

/**
 * All character items get the default values for the HpTrackeMetadata.
 * This ensures that further handling can be done properly
 */
const initItems = async () => {
    const tokens = await OBR.scene.items.getItems(
        (item) => itemMetadataKey in item.metadata && (item.metadata[itemMetadataKey] as GMDMetadata).active,
    );

    const changes = new Map<string, ItemChanges>();

    for (const token of tokens) {
        const data = token.metadata[itemMetadataKey] as GMDMetadata;
        const attachments = (await getAttachedItems(token.id, [])).filter((a) => attachmentFilter(a));

        if (data.showOnMap) {
            await saveOrChangeAttachments(token, data, attachments, changes);
        }
    }

    await updateAttachmentChanges(changes);
    console.info("GM's Daggerheart - Token initialization done");
};

const initRoom = async () => {
    const metadata: Metadata = await OBR.room.getMetadata();
    const ownMetadata: Metadata = {};
    if (!(metadataKey in metadata)) {
        const roomData: RoomMetadata = {
            ignoreUpdateNotification: false,
            disableDiceRoller: false,
            fear: 0,
        };
        ownMetadata[metadataKey] = roomData;
    }
    await OBR.room.setMetadata(ownMetadata);
};

const initScene = async () => {
    const metadata: Metadata = await OBR.scene.getMetadata();
    const ownMetadata: Metadata = {};
    if (!(metadataKey in metadata)) {
        const sceneData: SceneMetadata = {
            version: version,
            id: uuidv4(),
            groups: ["Default"],
            openGroups: ["Default"],
        };

        ownMetadata[metadataKey] = sceneData;
    } else {
        const sceneData = metadata[metadataKey] as SceneMetadata;
        sceneData.version = version;

        if (!sceneData.id) {
            sceneData.id = uuidv4();
        }
        if (!sceneData.groups || sceneData.groups.length === 0) {
            sceneData.groups = ["Default"];
        }
        if (sceneData.openGroups === undefined) {
            sceneData.openGroups = ["Default"];
        }

        ownMetadata[metadataKey] = sceneData;
    }
    await OBR.scene.setMetadata(ownMetadata);
};

const setupContextMenu = async () => {
    await OBR.contextMenu.create({
        id: `${ID}/popover`,
        icons: [
            {
                icon: "/iconPopover.svg",
                label: "GM's Daggerheart",
                filter: {
                    some: [{ key: ["metadata", `${itemMetadataKey}`, "active"], value: true }],
                    roles: ["GM"],
                },
            },
            {
                icon: "/iconPopover.svg",
                label: "GM's Daggerheart",
                filter: {
                    every: [
                        { key: ["metadata", `${itemMetadataKey}`, "active"], value: true, coordinator: "&&" },
                        {
                            key: ["createdUserId"],
                            value: OBR.player.id,
                        },
                    ],
                    roles: ["PLAYER"],
                },
            },
        ],
        embed: {
            url: "/popover.html",
            height: 170,
        },
    });

    await OBR.contextMenu.create({
        id: `${ID}/remove`,
        icons: [
            {
                icon: "/iconOff.svg",
                label: "Remove from Grimoire",
                filter: {
                    some: [{ key: ["metadata", `${itemMetadataKey}`, "active"], value: true }],
                    roles: ["GM"],
                },
            },
        ],
        onClick: async (context) => {
            const contextItems = context.items.filter(
                (i) => itemMetadataKey in i.metadata && (i.metadata[itemMetadataKey] as GMDMetadata).active,
            );
            await updateItems(
                contextItems.map((i) => i.id),
                (items) => {
                    items.forEach((item) => {
                        if (itemMetadataKey in item.metadata) {
                            const data = item.metadata[itemMetadataKey] as GMDMetadata;
                            item.metadata[itemMetadataKey] = { ...data, active: false };
                        }
                    });
                },
            );
        },
    });

    await OBR.contextMenu.create({
        id: `${ID}/add-to-grimoire`,
        icons: [
            {
                icon: "/icon.svg",
                label: "Add to Grimoire",
                filter: {
                    every: [
                        { key: ["metadata", `${itemMetadataKey}`], value: undefined, coordinator: "||" },
                        {
                            key: ["metadata", `${itemMetadataKey}`, "active"],
                            value: false,
                        },
                    ],
                    some: [
                        { key: "type", value: "IMAGE", coordinator: "&&" },
                        { key: "layer", value: "CHARACTER", coordinator: "||" },
                        { key: "layer", value: "MOUNT", coordinator: "||" },
                    ],
                    roles: ["GM"],
                },
            },
        ],
        onClick: async (context) => {
            const contextItems = context.items.filter(
                (i) => (i.layer === "CHARACTER" || i.layer === "MOUNT") && i.type === "IMAGE",
            );

            await updateItems(
                contextItems.map((i) => i.id),
                (items) => {
                    items.forEach((item) => {
                        initToken(item);
                    });
                },
            );
        },
    });

    await OBR.contextMenu.create({
        id: `${ID}/add-prop-to-grimoire`,
        icons: [
            {
                icon: "/icon.svg",
                label: "Add to Grimoire",
                filter: {
                    every: [
                        { key: ["metadata", `${itemMetadataKey}`], value: undefined, coordinator: "||" },
                        {
                            key: ["metadata", `${itemMetadataKey}`, "active"],
                            value: false,
                        },
                        { key: "type", value: "IMAGE", coordinator: "&&" },
                        { key: "layer", value: "PROP" },
                    ],
                    roles: ["GM"],
                },
            },
        ],
        onClick: async (context) => {
            const contextItems = context.items.filter((i) => i.layer === "PROP" && i.type === "IMAGE");

            await updateItems(
                contextItems.map((i) => i.id),
                (items) => {
                    items.forEach((item) => {
                        initToken(item);
                    });
                },
            );
        },
    });
};

const migrations = async () => {
    const metadata = await OBR.scene.getMetadata();
    if (metadataKey in metadata) {
        /*const data: SceneMetadata = metadata[metadataKey] as SceneMetadata;
        if (data.version) {
        }*/
    }
};

const sceneReady = async () => {
    try {
        await migrations();
    } catch (e) {
        console.warn("GM's Daggerheart - Error while running migrations", e);
    }
    try {
        await initItems();
    } catch (e) {
        console.warn("GM's Daggerheart - Error while initializing items", e);
    }
    try {
        await initScene();
    } catch (e) {
        console.warn("GM's Daggerheart - Error while initializing Scene", e);
    }
};

const initMessageBus = async () => {};

OBR.onReady(async () => {
    console.info(`GM's Daggerheart - version ${version} initializing`);
    try {
        await setupContextMenu();
    } catch (e) {
        console.warn("GM's Daggerheart - error while setting up context menu");
    }
    try {
        await initMessageBus();
    } catch (e) {
        console.warn("GM's Daggerheart - error while setting up message bus");
    }

    if ((await OBR.player.getRole()) === "GM") {
        try {
            await initRoom();
        } catch (e) {
            console.warn("GM's Daggerheart - Error while initializing Room", e);
        }

        OBR.scene.onReadyChange(async (isReady) => {
            if (isReady) {
                await sceneReady();
            }
        });

        const isReady = await OBR.scene.isReady();
        if (isReady) {
            await sceneReady();
        }
    }
    try {
        await setupDddice();
    } catch (e) {
        await OBR.notification.show(
            "GM's Daggerheart dice roller initialization error. Check browser logs for more info.",
            "ERROR",
        );
        console.warn("GM's Daggerheart - error while intializing dddice", e);
    }
    console.info(`GM's Daggerheart - initialization done`);
});
