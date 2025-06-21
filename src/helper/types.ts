export type WeaponType = {
    label: string;
    dice: string;
    damageType?: string;
};

export type GMDMetadata = {
    active: boolean;
    agility: number;
    strength: number;
    finesse: number;
    instinct: number;
    presence: number;
    knowledge: number;
    evasion: number;
    hope: number;
    spotlight: number;
    armor: {
        current: number;
        max: number;
    };
    hp: {
        current: number;
        max: number;
    };
    stress: {
        current: number;
        max: number;
    };
    weapons: Array<WeaponType>;
    thresholds: {
        major: number;
        sever: number;
    };
    isPlayer: boolean;
    showOnMap: boolean;
    index?: number;
    group?: string;
};

export type AttachmentMetadata = {
    gmdAttachment: boolean;
};

export type SceneMetadata = {
    version?: string;
    id?: string;
    groups?: Array<string>;
    openGroups?: Array<string>;
};

export type DiceUser = {
    diceRendering: boolean;
    playerId: string;
    apiKey: string | undefined;
    lastUse: number;
    diceTheme: string;
    hopeTheme: string;
    fearTheme: string;
};

export type RoomMetadata = {
    ignoreUpdateNotification?: boolean;
    fear?: number;
    diceRoom?: { slug: string | undefined };
    diceUser?: Array<DiceUser>;
    disableDiceRoller?: boolean;
};

export type ItemChanges = {
    color?: string;
    width?: number;
    text?: string;
    visible?: boolean;
    position?: { x: number; y: number };
};
