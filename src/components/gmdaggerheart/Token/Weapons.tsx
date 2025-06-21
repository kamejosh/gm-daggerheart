import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { useShallow } from "zustand/react/shallow";
import { WeaponType, GMDMetadata } from "../../../helper/types.ts";
import { Image } from "@owlbear-rodeo/sdk";
import { useState } from "react";
import { EditSvg } from "../../svgs/EditSvg.tsx";
import { getTokenName } from "../../../helper/helpers.ts";
import { DiceButton } from "../../general/DiceRoller/DiceButtonWrapper.tsx";
import styles from "./weapon.module.scss";
import { AddSvg } from "../../svgs/AddSvg.tsx";
import { updateTokenMetadata } from "../../../helper/tokenHelper.ts";
import { DeleteSvg } from "../../svgs/DeleteSvg.tsx";
import { parseRollEquation } from "dddice-js";

const WeaponEntry = ({ weapon, id, edit, index }: { weapon: WeaponType; id: string; edit: boolean; index: number }) => {
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(id)));
    const data = token?.data as GMDMetadata;
    const item = token?.item as Image;
    const [labelInput, setLabelInput] = useState<string>(weapon.label);
    const [diceInput, setDiceInput] = useState<string>(weapon.dice);
    const [damageType, setDamageType] = useState<string | undefined>(weapon.damageType);
    const [error, setError] = useState<boolean>(false);

    const label = `${weapon.label}${weapon.damageType ? ` (${weapon.damageType})` : ""}`;

    if (edit) {
        return (
            <div className={styles.weaponInput}>
                <input
                    type={"text"}
                    className={styles.input}
                    placeholder={"Weapon"}
                    value={labelInput}
                    onChange={(e) => {
                        setLabelInput(e.target.value);
                    }}
                    onBlur={async () => {
                        const weaponsUpdate = [...data.weapons];
                        const newWeapon = { ...weaponsUpdate[index], label: labelInput };
                        weaponsUpdate.splice(index, 1, newWeapon);
                        await updateTokenMetadata({ ...data, weapons: weaponsUpdate }, [id]);
                    }}
                />
                <input
                    className={error ? styles.error : styles.input}
                    type={"text"}
                    placeholder={"Notation"}
                    value={diceInput}
                    onChange={(e) => {
                        setDiceInput(e.target.value);
                        try {
                            parseRollEquation(e.target.value, "dddice-bees");
                            setError(false);
                        } catch {
                            setError(true);
                        }
                    }}
                    onBlur={async () => {
                        try {
                            parseRollEquation(diceInput, "dddice-bees");
                            const weaponsUpdate = [...data.weapons];
                            const newWeapon = { ...weaponsUpdate[index], dice: diceInput };
                            weaponsUpdate.splice(index, 1, newWeapon);
                            await updateTokenMetadata({ ...data, weapons: weaponsUpdate }, [id]);
                        } catch {}
                    }}
                />
                <input
                    className={styles.input}
                    type={"text"}
                    placeholder={"Type"}
                    value={damageType ? damageType : ""}
                    onChange={(e) => {
                        setDamageType(e.target.value);
                    }}
                    onBlur={async () => {
                        const weaponsUpdate = [...data.weapons];
                        const newWeapon = { ...weaponsUpdate[index], damageType: damageType };
                        weaponsUpdate.splice(index, 1, newWeapon);
                        await updateTokenMetadata({ ...data, weapons: weaponsUpdate }, [id]);
                    }}
                />
                <button
                    className={styles.delete}
                    onClick={async () => {
                        const weaponsUpdate = [...data.weapons];
                        weaponsUpdate.splice(index, 1);
                        await updateTokenMetadata({ ...data, weapons: weaponsUpdate }, [id]);
                    }}
                >
                    <DeleteSvg />
                </button>
            </div>
        );
    }

    return (
        <>
            <span>{label} </span>
            <div>
                <DiceButton
                    dice={[{ notation: weapon.dice, label: label }]}
                    label={label}
                    text={weapon.dice}
                    character={getTokenName(item)}
                />
            </div>
        </>
    );
};

const AddWeapon = ({ id }: { id: string }) => {
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(id)));
    const data = token?.data as GMDMetadata;
    const weapons = data.weapons;

    return (
        <button
            className={styles.add}
            onClick={async () => {
                const weaponsUpdate = weapons ? [...weapons] : [];
                weaponsUpdate.push({ label: "", dice: "" });
                await updateTokenMetadata({ ...data, weapons: weaponsUpdate }, [id]);
            }}
        >
            <AddSvg />
        </button>
    );
};

export const Weapons = ({ id }: { id: string }) => {
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(id)));
    const data = token?.data as GMDMetadata;
    const weapons = data.weapons;
    const [edit, setEdit] = useState<boolean>(false);

    return (
        <div className={styles.weaponContainer}>
            {weapons && weapons.length > 0 ? (
                <div className={styles.weaponList}>
                    {weapons.map((d, index) => {
                        return <WeaponEntry weapon={d} id={id} index={index} key={index} edit={edit} />;
                    })}
                    {edit ? <AddWeapon id={id} /> : null}
                </div>
            ) : (
                <div className={styles.weaponList}>
                    <span className={styles.small}>No Weapons</span>
                    {edit ? <AddWeapon id={id} /> : null}
                </div>
            )}
            <button className={styles.edit} onClick={() => setEdit(!edit)}>
                <EditSvg />
            </button>
        </div>
    );
};
