import {GetStaticProps} from "next";

import MainLayout from "@/components/layouts/main";
import WebGLWrapper from "@/components/homepage/webgl";
import MetaTags from "@/components/metatags";
import {
  BackgroundBlock,
  BackgroundFader,
} from "@/components/homepage/backgroundFader";
import {getLegalDoc} from "dataSources/legal";
import styles from "@/styles/legal_docs.module.scss";

interface TermsOfUseProps {
  content: string;
}

const TermsOfUsePage = ({content}: TermsOfUseProps) => (
  <MainLayout className={styles.page} footerClassName={styles.pageFooter}>
    <MetaTags
      title="Terms of Use"
      description="EdgeDB website terms of use."
      relPath={`/terms-of-use`}
    />
    <WebGLWrapper>
      <BackgroundFader usePageBackground>
        <BackgroundBlock colour="ffffff" particleColour="f1f1f1">
          <div className="globalPageWrapper">
            <div className={styles.content}>
              <h1>Website Terms of Use</h1>
              <div dangerouslySetInnerHTML={{__html: content}} />
            </div>
          </div>
        </BackgroundBlock>
      </BackgroundFader>
    </WebGLWrapper>
  </MainLayout>
);

export default TermsOfUsePage;

export const getStaticProps: GetStaticProps<TermsOfUseProps> = async () => ({
  props: {content: (await getLegalDoc("termsOfUse")).content},
});
