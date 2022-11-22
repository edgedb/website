import {
  PackedRenderNode,
  RenderComponent,
} from "dataBuild/xmlRenderer/interfaces";
import {RenderComponentsMap} from ".";

import EasyEDBQuiz from "../easyedb/quiz";

export const easyedbRenderComponents: RenderComponentsMap = {
  [RenderComponent.EasyEDBQuiz]: (renderNodes) => (
    props: EasyEDBQuizRenderProps
  ) => {
    const items = props.items.map(({question, answer}) => ({
      question: <>{renderNodes(question)}</>,
      answer: <>{renderNodes(answer)}</>,
    }));

    return (
      <EasyEDBQuiz
        lang={props.lang}
        sectionId={props.sectionId}
        items={items}
      />
    );
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
