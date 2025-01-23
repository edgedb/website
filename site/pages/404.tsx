import cn from "@edgedb-site/shared/utils/classNames";

import MainLayout from "@/components/layouts/main";

import styles from "@/styles/404.module.scss";
import MetaTags from "@/components/metatags";

export default function NotFoundPage() {
  return (
    <MainLayout minimalFooter>
      <MetaTags
        title="404 Not Found"
        description="This page does not exist."
        relPath="/404"
      />
      <div className={cn("globalPageWrapper", styles.wrapper)}>
        <div className={styles.content}>
          <h1>Page Not Found</h1>
        </div>
      </div>
    </MainLayout>
  );
}
