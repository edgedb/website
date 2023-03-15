import {RenderComponent} from "dataBuild/xmlRenderer/interfaces";
import {RenderComponentsMap} from ".";

import cn from "@/utils/classNames";

import * as charts from "@/components/charts";

import styles from "@/styles/blogPost.module.scss";

export const blogRenderComponents: RenderComponentsMap = {
  [RenderComponent.BlogLocalLink]: () => (props: BlogLocalLinkProps) => {
    const url = require("@/build-cache/_assets/blog/localResources/" +
      props.relPath);
    return <a href={url}>{props.text}</a>;
  },
  [RenderComponent.BlogChart]: () => (props: BlogChartProps) => {
    const Chart = (charts as any)[props.chartName];
    if (!Chart) {
      throw new Error("unknown chart type: " + props.chartName);
    }
    return (
      <div className={cn(styles.fullWidth, styles.max_safe)}>
        <Chart {...props.props} />
      </div>
    );
  },
  [RenderComponent.GithubButton]: () => GitHubButton,
};

export interface BlogLocalLinkProps {
  relPath: string;
  text: string;
}

export interface BlogChartProps {
  chartName: string;
  props: any;
}

export interface GithubButtonProps {
  size?: any;
  href: string;
  title: string;
}
function GitHubButton({size, href, title}: GithubButtonProps) {
  return (
    <a href={href}
        className={cn(styles.githubBtn, size ? styles[size] : null)}>
      <svg version="1.1" width="16" height="16" viewBox="0 0 16 16">
        <path
          fillRule="evenodd"
          d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"
        ></path>
      </svg>
      {title}
    </a>
  );
}
