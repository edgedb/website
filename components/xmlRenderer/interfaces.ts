import type {
  RenderComponent,
  WithStyles,
} from "dataBuild/xmlRenderer/interfaces";

import type {
  CodeRenderProps,
  CodeTabsRenderProps,
  NextLinkProps,
} from "./baseComponents";
import type {CodeProps, MigrationProps} from "@/components/code";
import type {HeaderLinkProps} from "@/components/headerLink";
import type {LazyImageProps} from "@/components/lazyImage";
import type {DocIntroIllustrationProps} from "@/components/docs/introIllustration";
import type {DescBlockProps, DescRefProps} from "@/components/docs/descBlock";
import type {
  VersionedBlockProps,
  VersionedLinkProps,
} from "@/components/docs/versioned";
import type {
  BlogLocalLinkProps,
  BlogChartProps,
  GithubButtonProps,
} from "./blogComponents";
import type {EasyEDBQuizRenderProps} from "./easyedbComponents";

export type ComponentRenderNode =
  | {
      type: RenderComponent.ReactComponent;
      props: {
        component: string;
      };
    } // Base
  | {
      type: RenderComponent.NextLink;
      props: NextLinkProps & WithStyles;
    }
  | {
      type: RenderComponent.Code;
      props: CodeRenderProps & WithStyles;
    }
  | {
      type: RenderComponent.CodeTabs;
      props: CodeTabsRenderProps & WithStyles;
    }
  | {
      type: RenderComponent.HeaderLink;
      props: HeaderLinkProps & WithStyles;
    }
  | {
      type: RenderComponent.Migration;
      props: MigrationProps & WithStyles;
    }
  | {
      type: RenderComponent.LazyImage;
      props: LazyImageProps & WithStyles;
    } // Docs
  | {
      type: RenderComponent.DocIntroIllustration;
      props: DocIntroIllustrationProps & WithStyles;
    }
  | {
      type: RenderComponent.DescBlock;
      props: DescBlockProps & WithStyles;
    }
  | {
      type: RenderComponent.DescRef;
      props: DescRefProps & WithStyles;
    }
  | {
      type: RenderComponent.VersionedLink;
      props: VersionedLinkProps & WithStyles;
    }
  | {
      type: RenderComponent.VersionedBlock;
      props: VersionedBlockProps & WithStyles;
    } //Blog
  | {
      type: RenderComponent.BlogLocalLink;
      props: BlogLocalLinkProps & WithStyles;
    }
  | {
      type: RenderComponent.BlogChart;
      props: BlogChartProps & WithStyles;
    }
  | {
      type: RenderComponent.GithubButton;
      props: GithubButtonProps & WithStyles;
    } // EasyEDB
  | {
      type: RenderComponent.EasyEDBQuiz;
      props: EasyEDBQuizRenderProps & WithStyles;
    };
