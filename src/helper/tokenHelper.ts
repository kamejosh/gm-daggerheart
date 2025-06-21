import { GMDMetadata } from "./types.ts";
import OBR, { Image, Item } from "@owlbear-rodeo/sdk";
import { itemMetadataKey } from "./variables.ts";
import { RefObject } from "react";
import { updateItems, updateList } from "./obrHelper.ts";
import { isObject } from "lodash";
import { updateAttachments } from "./attachmentHelpers.ts";
import { evalString } from "./helpers.ts";

export const updateTokenMetadata = async (tokenData: GMDMetadata, ids: Array<string>) => {
    try {
        await updateList(ids, 16, async (subList) => {
            await updateItems(subList, (items: Array<Item>) => {
                items.forEach((item) => {
                    item.metadata[itemMetadataKey] = { ...tokenData };
                });
            });
        });
    } catch (e) {
        const errorName =
            isObject(e) && "error" in e && isObject(e.error) && "name" in e.error ? e.error.name : "Undefined Error";
        console.warn(`GM's Daggerheart: Error while updating token metadata of ${ids.length} tokens: ${errorName}`);
    }
    try {
        const items = await OBR.scene.items.getItems(ids);
        for (const item of items) {
            await updateAttachments(item, tokenData);
        }
    } catch (e) {
        const errorName =
            isObject(e) && "error" in e && isObject(e.error) && "name" in e.error ? e.error.name : "Undefined Error";
        console.warn(`GM's Daggerheart: Error while updating token metadata of ${ids.length} tokens: ${errorName}`);
    }
};

export const getNewHpValue = async (input: string, data: GMDMetadata, maxHpRef?: RefObject<HTMLInputElement>) => {
    let value: number;
    let factor = 1;
    if (input.indexOf("+") > 0 || input.indexOf("-") > 0) {
        value = Number(evalString(input));
    } else {
        value = Number(input.replace(/[^0-9]/g, ""));
    }
    let hp: number;
    if (data.hp.max > 0) {
        hp = Math.min(Number(value * factor), data.hp.max);
    } else {
        hp = Number(value * factor);
        const newData = { ...data, hp: { current: hp, max: Math.max(value, 0) } };
        if (maxHpRef && maxHpRef.current) {
            maxHpRef.current.value = String(newData.hp.max);
        }
    }
    return Math.max(hp, 0);
};

export const changeHp = async (newHp: number, data: GMDMetadata, item: Image, hpRef?: RefObject<HTMLInputElement>) => {
    let newData = { ...data, hp: { ...data.hp, current: Math.max(newHp, 0) } };
    await updateAttachments(item, newData);
    await updateTokenMetadata(newData, [item.id]);
    if (hpRef && hpRef.current) {
        hpRef.current.value = String(newData.hp.current);
    }
};

export const changeMaxHp = async (
    newMax: number,
    data: GMDMetadata,
    item: Image,
    maxHpRef?: RefObject<HTMLInputElement>,
) => {
    const max = Math.max(newMax, 0);
    let newData = { ...data, hp: { current: Math.min(data.hp.current, max), max: max } };
    await updateAttachments(item, newData);
    await updateTokenMetadata(newData, [item.id]);
    if (maxHpRef && maxHpRef.current) {
        maxHpRef.current.value = String(newMax);
    }
};

export const changeArmorClass = (newAc: number, data: GMDMetadata, item: Image) => {
    const newData = { ...data, armorClass: newAc };
    void updateAttachments(item, newData);
    void updateTokenMetadata(newData, [item.id]);
};
