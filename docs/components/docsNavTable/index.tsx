import ArrowButton from "@edgedb-site/shared/components/arrowButton";

import {
  DocsPythonIcon,
  DocsJavascriptIcon,
  DocsGolangIcon,
  DocsTutorialIcon,
  DocsDataModelIcon,
  DocsEdgeQLIcon,
  DocsGraphQLIcon,
  DocsAdminIcon,
} from "./icons";

import styles from "./docsNavTable.module.scss";

const tableItems = [
  {
    title: "Quick Start",
    link: "/docs/guides/quickstart",
    icon: <DocsTutorialIcon />,
  },
  {
    title: "Data Model",
    link: "/docs/datamodel/index",
    icon: <DocsDataModelIcon />,
  },
  {
    title: "EdgeQL",
    link: "/docs/edgeql/index",
    icon: <DocsEdgeQLIcon />,
  },
  {
    title: "GraphQL",
    link: "/docs/graphql/index",
    icon: <DocsGraphQLIcon />,
  },
  {
    title: "TypeScript & JS",
    link: "/docs/clients/js/index",
    icon: <DocsJavascriptIcon />,
  },
  {
    title: "Python",
    link: "/docs/clients/python/index",
    icon: <DocsPythonIcon />,
  },
  {
    title: "Go",
    link: "/docs/clients/go/index",
    icon: <DocsGolangIcon />,
  },
  {
    title: "Administration",
    link: "/docs/guides/configuration",
    icon: <DocsAdminIcon />,
  },
];

export default function DocsNavTable() {
  return (
    <div className={styles.navTable}>
      {tableItems.map((item) => (
        <ArrowButton
          className={styles.navItem}
          href={item.link}
          label={item.title}
          icon={item.icon}
          key={item.link}
        />
      ))}
    </div>
  );
}
