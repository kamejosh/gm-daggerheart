import { Modal } from "@owlbear-rodeo/sdk/lib/types/Modal";
import { Popover } from "@owlbear-rodeo/sdk";
import { GMDMetadata } from "./types.ts";

export const ID = "com.tabletop-almanac.gmd";
export const metadataKey = `${ID}/metadata`;
export const itemMetadataKey = `${ID}/data`;
export const infoMetadataKey = `${ID}/text`;

export const modalId = `${ID}/modal`;
export const diceTrayModalId = `${ID}/diceTrayModal`;
export const rollLogPopoverId = `${ID}/dice-log`;
export const rollMessageChannel = `${ID}.roll-event`;

export const version = "1.0.0";

export const changelogModal: Modal = {
    id: modalId,
    url: "/modal.html?content=changelog",
};

export const helpModal: Modal = {
    id: modalId,
    url: "/modal.html?content=help",
};

export const settingsModal: Modal = {
    id: modalId,
    url: "/modal.html?content=settings",
};

export const diceModal: Modal = {
    id: modalId,
    url: "/modal.html?content=dddice",
};

export const diceTrayModal: Modal = {
    id: diceTrayModalId,
    url: "/modal.html?content=dicetray",
    fullScreen: true,
    hidePaper: true,
    hideBackdrop: true,
    disablePointerEvents: true,
};

export const rollLogPopover: Popover = {
    id: rollLogPopoverId,
    url: "/rolllog.html",
    width: 350,
    height: 200,
    anchorOrigin: { horizontal: "RIGHT", vertical: "BOTTOM" },
    transformOrigin: { vertical: "BOTTOM", horizontal: "RIGHT" },
    marginThreshold: 10,
    disableClickAway: true,
    hidePaper: true,
};

export const defaultMetadata: GMDMetadata = {
    active: true,
    agility: 0,
    strength: 0,
    finesse: 0,
    instinct: 0,
    presence: 0,
    knowledge: 0,
    evasion: 10,
    armor: {
        current: 3,
        max: 3,
    },
    hp: {
        current: 6,
        max: 6,
    },
    stress: {
        current: 0,
        max: 6,
    },
    hope: 2,
    damage: [],
    thresholds: {
        major: 6,
        sever: 12,
    },
    spotlight: 0,
    isPlayer: true,
    showOnMap: true,
    group: "Default",
};
