import {
  PackedRenderNode,
  RenderComponentType,
} from "@edgedb-site/build-tools/xmlRenderer/interfaces";
import { RenderComponentsMap } from "@edgedb-site/shared/xmlRenderer";

import EasyEDBQuiz from "@/components/easyedb/quiz";

export const easyedbRenderComponents: RenderComponentsMap = {
  [RenderComponentType.EasyEDBQuiz]: (renderNodes) => ({
    items,
    ...props
  }: EasyEDBQuizRenderProps) => {
    const unpackedItems = items.map(({ question, answer }) => ({
      question: <>{renderNodes(question)}</>,
      answer: <>{renderNodes(answer)}</>,
    }));

    return <EasyEDBQuiz {...props} items={unpackedItems} />;
  },
};

export interface EasyEDBQuizRenderProps {
  lang?: string;
  sectionId: string;
  items: {
    question: (string | PackedRenderNode)[];
    answer: (string | PackedRenderNode)[];
  }[];
}
