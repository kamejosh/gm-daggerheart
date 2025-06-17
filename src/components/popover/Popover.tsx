import { ContextWrapper } from "../ContextWrapper.tsx";
import { useEffect, useState } from "react";
import { Token } from "../gmdaggerheart/Token/Token.tsx";
import OBR, { Image } from "@owlbear-rodeo/sdk";
import { GMDMetadata } from "../../helper/types.ts";
import { SceneReadyContext } from "../../context/SceneReadyContext.ts";
import { Loader } from "../general/Loader.tsx";
import { useTokenListContext } from "../../context/TokenContext.tsx";
import { TokenContextWrapper } from "../TokenContextWrapper.tsx";
import { useShallow } from "zustand/react/shallow";

export const Popover = () => {
    const [ids, setIds] = useState<Array<string>>([]);
    const { isReady } = SceneReadyContext();

    const initPopover = async () => {
        const selection = await OBR.player.getSelection();
        setIds(selection ?? []);
    };

    useEffect(() => {
        if (isReady) {
            initPopover();
        }
    }, [isReady]);

    return (
        <ContextWrapper component={"popover"}>
            <TokenContextWrapper>
                {ids.length === 1 ? (
                    <Content id={ids[0]} />
                ) : ids.length > 1 ? (
                    <Content id={ids[0]} />
                ) : (
                    <Loader className={"popover-spinner"} />
                )}
            </TokenContextWrapper>
        </ContextWrapper>
    );
};

const Content = (props: { id: string }) => {
    const id = props.id;
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(props.id)));
    const data = token?.data as GMDMetadata;
    const item = token?.item as Image;

    return id && data && item ? (
        <div className={"popover"}>
            <Token id={id} popover={true} selected={false} />
        </div>
    ) : null;
};
