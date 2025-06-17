import { buildShape, buildText, Image, Item } from "@owlbear-rodeo/sdk";
import { GMDMetadata, ItemChanges } from "./types.ts";
import { getImageBounds } from "./helpers.ts";
import { infoMetadataKey } from "./variables.ts";
import { updateItems } from "./obrHelper.ts";

export const createBar = async (percentage: number, tempHpPercentage: number, token: Image) => {
    const bounds = await getImageBounds(token);
    const height = Math.abs(Math.ceil(bounds.height / 4.85));
    const width = Math.abs(bounds.width);
    const position = {
        x: bounds.width < 0 ? bounds.position.x - width : bounds.position.x,
        y: bounds.position.y + bounds.height - height,
    };
    const border = Math.floor(width / 75);

    const backgroundShape = buildShape()
        .width(width)
        .height(height)
        .shapeType("RECTANGLE")
        .fillColor("black")
        .fillOpacity(0.5)
        .strokeColor("black")
        .strokeOpacity(0)
        .position(position)
        .attachedTo(token.id)
        .layer(token.layer)
        .locked(true)
        .disableHit(true)
        .disableAttachmentBehavior(["ROTATION"])
        .visible(token.visible)
        .zIndex(token.zIndex + 1)
        .build();

    const hpShape = buildShape()
        .width(percentage === 0 ? 0 : (width - border * 2) * percentage)
        .height(height - border * 2)
        .shapeType("RECTANGLE")
        .fillColor("red")
        .fillOpacity(0.5)
        .strokeWidth(0)
        .strokeOpacity(0)
        .position({ x: position.x + border, y: position.y + border })
        .attachedTo(token.id)
        .layer(token.layer)
        .locked(true)
        .disableHit(true)
        .name("hp")
        .disableAttachmentBehavior(["ROTATION"])
        .visible(token.visible)
        .zIndex(token.zIndex + 2)
        .build();

    const tempHp = buildShape()
        .width(tempHpPercentage === 0 ? 0 : (width - border * 2) * tempHpPercentage)
        .height(height - border * 2)
        .shapeType("RECTANGLE")
        .fillColor("blue")
        .fillOpacity(0.8)
        .strokeWidth(0)
        .strokeOpacity(0)
        .position({ x: position.x + border, y: position.y + border })
        .attachedTo(token.id)
        .layer(token.layer)
        .locked(true)
        .disableHit(true)
        .name("temp-hp")
        .disableAttachmentBehavior(["ROTATION"])
        .visible(token.visible)
        .zIndex(token.zIndex + 3)
        .build();

    backgroundShape.metadata[infoMetadataKey] = { isHpText: true, attachmentType: "BAR" };
    hpShape.metadata[infoMetadataKey] = { isHpText: true, attachmentType: "BAR" };
    tempHp.metadata[infoMetadataKey] = { isHpText: true, attachmentType: "BAR" };
    return [backgroundShape, hpShape, tempHp];
};

// @ts-ignore
const createText = async (text: string, token: Image) => {
    const bounds = await getImageBounds(token);
    const height = Math.abs(Math.ceil(bounds.height / 4.85));
    const overflow = 100;
    const width = Math.abs(bounds.width) + overflow;
    const position = {
        x: bounds.width < 0 ? bounds.position.x - width + overflow / 2 : bounds.position.x - overflow / 2,
        y: bounds.position.y + bounds.height - height,
    };

    const textItem = buildText()
        .textType("PLAIN")
        .width(width)
        .height(height)
        .position({ ...position, y: position.y })
        .attachedTo(token.id)
        .layer(token.layer)
        .plainText(text)
        .locked(true)
        .textAlign("CENTER")
        .textAlignVertical("BOTTOM")
        .fontWeight(600)
        .strokeColor("black")
        .strokeWidth(2)
        .fontSize(height)
        .lineHeight(1)
        .disableHit(true)
        .disableAttachmentBehavior(["ROTATION", "VISIBLE"])
        .visible(token.visible)
        .name("hp-text")
        .zIndex(token.zIndex + 4)
        .build();

    textItem.metadata[infoMetadataKey] = { isHpText: true, attachmentType: "HP" };
    return textItem;
};

export const saveOrChangeAttachments = async (
    // @ts-ignore
    token: Item,
    // @ts-ignore
    data: GMDMetadata,
    // @ts-ignore
    attachments: Array<Item>,
    // @ts-ignore
    changes: Map<string, ItemChanges>,
) => {};

// @ts-ignore
export const updateAttachments = async (item: Item, data: GMDMetadata) => {
    // TODO: implement
};

export const updateAttachmentChanges = async (changes: Map<string, ItemChanges>) => {
    if (changes.size > 0) {
        await updateItems(
            (item) => changes.has(item.id),
            (items) => {
                items.forEach((item) => {
                    if (changes.has(item.id)) {
                        const change = changes.get(item.id);
                        if (change) {
                            if (change.color) {
                                // @ts-ignore
                                item.color = change.color;
                            }
                            if (change.width) {
                                // @ts-ignore
                                item.width = change.width;
                            }
                            if (change.text) {
                                // @ts-ignore
                                item.text.plainText = change.text;
                            }
                            if (change.visible !== undefined) {
                                item.visible = change.visible;
                            }
                            if (change.position) {
                                item.position = change.position;
                            }
                        }
                    }
                });
            },
        );
    }
};
