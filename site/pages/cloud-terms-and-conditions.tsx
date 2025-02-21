import {GetStaticProps} from "next";

import cn from "@edgedb-site/shared/utils/classNames";

import MainLayout from "@/components/layouts/main";
import WebGLWrapper from "@/components/homepage/webgl";
import MetaTags from "@/components/metatags";
import {
  BackgroundBlock,
  BackgroundFader,
} from "@/components/homepage/backgroundFader";
import {getLegalDoc} from "dataSources/legal";
import styles from "@/styles/legal_docs.module.scss";

interface TermsAndConditionsProps {
  content: string;
}

export default function TermsAndConditionsPage({
  content,
}: TermsAndConditionsProps) {
  return (
    <MainLayout className={styles.page} footerClassName={styles.pageFooter}>
      <MetaTags
        title="Cloud Terms and Conditions"
        description="EdgeDB Cloud Terms and Conditions"
        relPath={`/cloud-terms-and-conditions`}
      />
      <div className="globalPageWrapper">
        <div
          className={cn(styles.content, styles.termsAndConditions)}
          dangerouslySetInnerHTML={{__html: content}}
        ></div>
      </div>
    </MainLayout>
  );
}

export const getStaticProps: GetStaticProps<
  TermsAndConditionsProps
> = async () => ({
  props: {content: (await getLegalDoc("cloudTermsAndConditions")).content},
});
