import { createStore } from "zustand/vanilla";
import { createJSONStorage, persist } from "zustand/middleware";
import { ID } from "../helper/variables.ts";

export type DicePool = {
    name: string;
    dice: string;
    number: number;
};

export type DicePoolContextType = {
    dicePools: Array<DicePool>;
    addDicePool: (name: string) => void;
    removeDicePool: (name: string) => void;
    updateDicePool: (name: string, dice: string, number: number) => void;
};

export const useDicePoolContext = createStore<DicePoolContextType>()(
    persist(
        (set) => ({
            dicePools: [],
            addDicePool: (name: string) =>
                set((state) => {
                    if (!state.dicePools.map((d) => d.name).includes(name)) {
                        state.dicePools.push({ name, dice: "1d6", number: 1 });
                    }
                    return state;
                }),
            removeDicePool: (name: string) =>
                set((state) => {
                    return { dicePools: [...state.dicePools.filter((d) => d.name !== name)] };
                }),
            updateDicePool: (name: string, dice: string, number: number) =>
                set((state) => {
                    return { dicePools: [...state.dicePools.filter((d) => d.name !== name), { name, dice, number }] };
                }),
        }),
        {
            name: `${ID}.dice-pools`,
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
