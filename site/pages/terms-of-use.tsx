import {GetStaticProps} from "next";

import MainLayout from "@/components/layouts/main";
import MetaTags from "@/components/metatags";
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
    <div className="globalPageWrapper">
      <div className={styles.content}>
        <h1>Website Terms of Use</h1>
        <div dangerouslySetInnerHTML={{__html: content}} />
      </div>
    </div>
  </MainLayout>
);

export default TermsOfUsePage;

export const getStaticProps: GetStaticProps<TermsOfUseProps> = async () => ({
  props: {content: (await getLegalDoc("termsOfUse")).content},
});
