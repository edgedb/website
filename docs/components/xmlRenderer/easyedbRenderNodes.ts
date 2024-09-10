import { RenderComponentType } from "@edgedb-site/build-tools/xmlRenderer/interfaces";
import { buildRenderNode } from "@edgedb-site/build-tools/xmlRenderer/renderNodes";

import type { EasyEDBQuizRenderProps } from "./easyedbComponents";

export { EasyEDBQuizRenderProps };

export const EasyEDBQuiz = buildRenderNode<EasyEDBQuizRenderProps>(
  RenderComponentType.EasyEDBQuiz
);
