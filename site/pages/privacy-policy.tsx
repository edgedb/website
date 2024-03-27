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

interface PrivacyPolicyProps {
  content: string;
}

export default function PrivacyPolicyPage({content}: PrivacyPolicyProps) {
  return (
    <MainLayout className={styles.page} footerClassName={styles.pageFooter}>
      <MetaTags
        title="Privacy Policy"
        description="EdgeDB website privacy policy"
        relPath={`/privacy-policy`}
      />
      <WebGLWrapper>
        <BackgroundFader usePageBackground>
          <BackgroundBlock colour="ffffff" particleColour="f1f1f1">
            <div className="globalPageWrapper">
              <div
                className={styles.content}
                dangerouslySetInnerHTML={{__html: content}}
              ></div>
            </div>
          </BackgroundBlock>
        </BackgroundFader>
      </WebGLWrapper>
    </MainLayout>
  );
}

export const getStaticProps: GetStaticProps<PrivacyPolicyProps> = async () => ({
  props: {content: (await getLegalDoc("privacyPolicy")).content},
});
