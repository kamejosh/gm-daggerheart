import { buildCurve, buildShape, buildText, Image, Item, Shape, Text } from "@owlbear-rodeo/sdk";
import { GMDMetadata, ItemChanges } from "./types.ts";
import { deleteAttachments, getAttachedItems, getImageBounds } from "./helpers.ts";
import { infoMetadataKey } from "./variables.ts";
import { addItems, updateItems } from "./obrHelper.ts";

export const createAttachments = async (percentage: number, text: string, token: Image, data: GMDMetadata) => {
    const bounds = await getImageBounds(token);
    const overflow = 100;
    const height = Math.abs(Math.ceil(bounds.height / 4.85));
    const width = Math.abs(bounds.width);
    const position = {
        x: bounds.width < 0 ? bounds.position.x - width : bounds.position.x,
        y: bounds.position.y + bounds.height - height - bounds.height / 10,
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
        .visible(token.visible && data.isPlayer)
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
        .visible(token.visible && data.isPlayer)
        .zIndex(token.zIndex + 2)
        .build();

    const textItem = buildText()
        .textType("PLAIN")
        .width(width + overflow)
        .height(height)
        .position({
            x: bounds.width < 0 ? bounds.position.x - width + overflow / 2 : bounds.position.x - overflow / 2,
            y: bounds.position.y + bounds.height - height - bounds.height / 10,
        })
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
        .disableAttachmentBehavior(["ROTATION"])
        .visible(token.visible && data.isPlayer)
        .name("hp-text")
        .zIndex(token.zIndex + 4)
        .build();

    const shapeHeight = Math.abs(bounds.height / 2.3);
    const shapeWidth = Math.abs(bounds.width / 3);

    const hopeItem = buildCurve()
        .points([
            { x: shapeWidth / 3, y: 0 },
            { x: shapeWidth / 1.5, y: shapeHeight / 3 },
            { x: shapeWidth / 3, y: shapeHeight / 1.5 },
            { x: 0, y: shapeHeight / 3 },
            { x: shapeWidth / 3, y: 0 },
        ])
        .tension(0)
        .fillColor("black")
        .fillOpacity(0.5)
        .strokeWidth(shapeWidth / 25)
        .strokeColor("lightblue")
        .name("hope")
        .position({ x: position.x, y: position.y - bounds.height + shapeHeight / 1.3 })
        .attachedTo(token.id)
        .layer(token.layer)
        .locked(true)
        .disableHit(true)
        .disableAttachmentBehavior(["ROTATION"])
        .visible(token.visible && data.isPlayer)
        .zIndex(token.zIndex + 2)
        .build();

    const hopeText = buildText()
        .textType("PLAIN")
        .width(shapeWidth / 1.5)
        .height(height)
        .position({ x: position.x, y: position.y - bounds.height + shapeHeight / 1.2 })
        .attachedTo(token.id)
        .layer(token.layer)
        .plainText(String(data.hope))
        .locked(true)
        .textAlign("CENTER")
        .textAlignVertical("MIDDLE")
        .textAlignVertical("BOTTOM")
        .fontWeight(600)
        .strokeColor("black")
        .strokeWidth(2)
        .fontSize(height - 3)
        .lineHeight(1)
        .disableHit(true)
        .disableAttachmentBehavior(["ROTATION"])
        .visible(token.visible && data.isPlayer)
        .name("hope-text")
        .zIndex(token.zIndex + 4)
        .build();

    const stressItem = buildShape()
        .shapeType("HEXAGON")
        .fillColor("black")
        .width(shapeWidth * 0.7)
        .height(shapeHeight * 0.7)
        .fillOpacity(0.5)
        .strokeWidth(shapeWidth / 25)
        .strokeColor("yellow")
        .name("stress")
        .position({
            x: position.x + shapeWidth * 0.34,
            y: bounds.position.y + bounds.height - shapeHeight * 0.77 - bounds.height / 10,
        })
        .attachedTo(token.id)
        .layer(token.layer)
        .locked(true)
        .disableHit(true)
        .disableAttachmentBehavior(["ROTATION"])
        .visible(token.visible && data.isPlayer)
        .zIndex(token.zIndex + 2)
        .build();

    const stressText = buildText()
        .textType("PLAIN")
        .width(shapeWidth * 0.7)
        .height(height)
        .position({ x: position.x, y: bounds.position.y + bounds.height - shapeHeight - bounds.height / 10 })
        .attachedTo(token.id)
        .layer(token.layer)
        .plainText(String(data.stress.current))
        .locked(true)
        .textAlign("CENTER")
        .textAlignVertical("BOTTOM")
        .fontWeight(600)
        .strokeColor("black")
        .strokeWidth(2)
        .fontSize(height - 3)
        .lineHeight(1)
        .disableHit(false)
        .disableAttachmentBehavior(["ROTATION"])
        .visible(token.visible && data.isPlayer)
        .name("stress-text")
        .zIndex(token.zIndex + 4)
        .build();

    const armorItem = buildCurve()
        .points([
            { x: 0, y: 0 },
            { x: shapeWidth / 3, y: shapeHeight / 6 },
            { x: shapeWidth / 1.5, y: 0 },
            { x: shapeWidth / 1.5, y: shapeHeight / 2 },
            { x: shapeWidth / 3, y: shapeHeight / 1.5 },
            { x: 0, y: shapeHeight / 2 },
            { x: 0, y: 0 },
        ])
        .tension(0)
        .fillColor("black")
        .fillOpacity(0.5)
        .strokeWidth(3)
        .strokeColor("grey")
        .name("armor")
        .position({
            x: bounds.position.x + (bounds.width < 0 ? 0 : bounds.width) - shapeWidth / 1.5,
            y: bounds.position.y + bounds.height - shapeHeight / 1.5 - height - bounds.height / 10,
        })
        .attachedTo(token.id)
        .layer(token.layer)
        .locked(true)
        .disableHit(true)
        .disableAttachmentBehavior(["ROTATION"])
        .visible(token.visible && data.isPlayer)
        .zIndex(token.zIndex + 2)
        .build();

    const armorText = buildText()
        .textType("PLAIN")
        .width(shapeWidth / 1.5)
        .height(height)
        .position({
            x: bounds.position.x + (bounds.width < 0 ? 0 : bounds.width) - shapeWidth / 1.5,
            y: bounds.position.y + bounds.height - shapeHeight / 1.85 - height - bounds.height / 10,
        })
        .attachedTo(token.id)
        .layer(token.layer)
        .plainText(String(data.armor.current))
        .locked(true)
        .textAlign("CENTER")
        .textAlignVertical("BOTTOM")
        .fontWeight(600)
        .strokeColor("black")
        .strokeWidth(2)
        .fontSize(height - 3)
        .lineHeight(1)
        .disableHit(true)
        .disableAttachmentBehavior(["ROTATION"])
        .visible(token.visible && data.isPlayer)
        .name("armor-text")
        .zIndex(token.zIndex + 4)
        .build();

    backgroundShape.metadata[infoMetadataKey] = { isHpText: true, attachmentType: "BAR" };
    hpShape.metadata[infoMetadataKey] = { isHpText: true, attachmentType: "BAR" };
    textItem.metadata[infoMetadataKey] = { isHpText: true, attachmentType: "HP" };
    hopeItem.metadata[infoMetadataKey] = { isHpText: true, attachmentType: "HOPE" };
    hopeText.metadata[infoMetadataKey] = { isHpText: true, attachmentType: "HOPE" };
    stressItem.metadata[infoMetadataKey] = { isHpText: true, attachmentType: "STRESS" };
    stressText.metadata[infoMetadataKey] = { isHpText: true, attachmentType: "STRESS" };
    armorItem.metadata[infoMetadataKey] = { isHpText: true, attachmentType: "ARMOR" };
    armorText.metadata[infoMetadataKey] = { isHpText: true, attachmentType: "ARMOR" };
    return [backgroundShape, hpShape, textItem, hopeItem, hopeText, stressItem, stressText, armorItem, armorText];
};

export const calculatePercentage = (current: number, max: number) => {
    if (max === 0) {
        return 0;
    }
    return current / max;
};

const handleBarAttachment = async (
    attachment: Item,
    character: Image,
    changeMap: Map<string, ItemChanges>,
    data: GMDMetadata,
): Promise<ItemChanges> => {
    const shape = attachment as Shape;
    const bounds = await getImageBounds(character);
    const width = Math.abs(bounds.width);
    const border = Math.floor(width / 75);
    const color = shape.style.fillColor;

    if (attachment.name === "hp" && infoMetadataKey in attachment.metadata) {
        const change = changeMap.get(attachment.id) ?? {};
        const hpPercentage = calculatePercentage(data.hp.current, data.hp.max);
        if (hpPercentage === 0) {
            if (color !== "black") {
                change.color = "black";
            }
        } else {
            if (color !== "red") {
                change.color = "red";
            }
        }
        change.width = hpPercentage === 0 ? 0 : (width - border * 2) * hpPercentage;
        if (shape.width !== change.width || (change.color && color !== change.color)) {
            return change;
        }
    }
    return {};
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
) => {
    if (attachments.length > 0) {
        for (const a of attachments) {
            let change = changes.get(a.id) ?? {};
            if (a.name === "hp-text") {
                const newText = data.hp.current + "/" + data.hp.max;
                if ((a as Text).text.plainText !== newText) {
                    change.text = newText;
                }
            } else if (a.name === "hope-text") {
                const newText = String(data.hope);
                if ((a as Text).text.plainText !== newText) {
                    change.text = newText;
                }
            } else if (a.name === "stress-text") {
                const newText = String(data.stress.current);
                if ((a as Text).text.plainText !== newText) {
                    change.text = newText;
                }
            } else if (a.name === "armor-text") {
                const newText = String(data.armor.current);
                if ((a as Text).text.plainText !== newText) {
                    change.text = newText;
                }
            } else if (a.name === "hp") {
                change = await handleBarAttachment(a, token as Image, changes, data);
            }
            if (token.visible && data.isPlayer != a.visible) {
                change.visible = token.visible && data.isPlayer;
            }
            changes.set(a.id, change);
        }
    } else {
        const items = await createAttachments(
            calculatePercentage(data.hp.current, data.hp.max),
            `${data.hp.current}/${data.hp.max}`,
            token as Image,
            data,
        );
        await addItems(items);
    }
};

// @ts-ignore
export const updateAttachments = async (item: Item, data: GMDMetadata) => {
    const attachments = await getAttachedItems(item.id, []);
    const attachmentChanges = new Map<string, ItemChanges>();
    if (!data.active || !data.showOnMap) {
        await deleteAttachments(attachments);
    } else {
        await saveOrChangeAttachments(item, data, attachments, attachmentChanges);
        await updateAttachmentChanges(attachmentChanges);
    }
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
