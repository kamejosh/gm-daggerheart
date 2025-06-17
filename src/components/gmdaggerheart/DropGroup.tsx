import { Droppable } from "@hello-pangea/dnd";
import { DraggableTokenList } from "./TokenList.tsx";
import OBR, { Image, Metadata } from "@owlbear-rodeo/sdk";
import { SceneMetadata } from "../../helper/types.ts";
import { metadataKey } from "../../helper/variables.ts";
import { useMetadataContext } from "../../context/MetadataContext.ts";
import Tippy from "@tippyjs/react";
import "./drop-group.scss";
import { useShallow } from "zustand/react/shallow";

type DropGroupProps = {
    title: string;
    list: Array<Image>;
    selected: Array<string>;
    tokenLists: Map<string, Array<Image>>;
};

export const DropGroup = (props: DropGroupProps) => {
    const scene = useMetadataContext(useShallow((state) => state.scene));

    const setOpenGroupSetting = async (name: string) => {
        const metadata: Metadata = await OBR.scene.getMetadata();
        const hpTrackerSceneMetadata = metadata[metadataKey] as SceneMetadata;
        if (hpTrackerSceneMetadata.openGroups && hpTrackerSceneMetadata.openGroups.indexOf(name) >= 0) {
            hpTrackerSceneMetadata.openGroups.splice(hpTrackerSceneMetadata.openGroups.indexOf(name), 1);
        } else {
            hpTrackerSceneMetadata.openGroups?.push(name);
        }
        const ownMetadata: Metadata = {};
        ownMetadata[metadataKey] = hpTrackerSceneMetadata;
        await OBR.scene.setMetadata(ownMetadata);
    };

    return (
        <div
            className={`group-wrapper ${
                scene?.openGroups && scene?.openGroups?.indexOf(props.title) >= 0 ? "" : "hidden"
            }`}
        >
            <div className={"group-title"}>
                <div className={"group-general"}>
                    <Tippy content={props.title}>
                        <div className={"group-name"}>
                            <span>{props.title}</span>
                        </div>
                    </Tippy>
                </div>

                <button
                    className={"hide-group"}
                    onClick={async () => {
                        await setOpenGroupSetting(props.title);
                    }}
                ></button>
            </div>
            <Droppable droppableId={props.title}>
                {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                        <DraggableTokenList
                            tokens={props.list}
                            selected={props.selected}
                            tokenLists={props.tokenLists}
                        />
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
};
