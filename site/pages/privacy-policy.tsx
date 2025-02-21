import {GetStaticProps} from "next";

import MainLayout from "@/components/layouts/main";
import MetaTags from "@/components/metatags";
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
      <div className="globalPageWrapper">
        <div
          className={styles.content}
          dangerouslySetInnerHTML={{__html: content}}
        ></div>
      </div>
    </MainLayout>
  );
}

export const getStaticProps: GetStaticProps<
  PrivacyPolicyProps
> = async () => ({
  props: {content: (await getLegalDoc("privacyPolicy")).content},
});
