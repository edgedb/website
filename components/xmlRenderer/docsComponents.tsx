import {RenderComponent} from "dataBuild/xmlRenderer/interfaces";
import {RenderComponentsMap} from ".";

import DescBlock, {DescRef} from "@/components/docs/descBlock";
import DocsNavTable from "@/components/docs/docsNavTable";
import DocIntroIllustration from "@/components/docs/introIllustration";

export const docsRenderComponents: RenderComponentsMap = {
  [RenderComponent.DescBlock]: () => DescBlock,
  [RenderComponent.DocIntroIllustration]: () => DocIntroIllustration,
  [RenderComponent.DescRef]: () => DescRef,
};

export const docsReactComponents = {
  DocsNavTable: DocsNavTable,
};
