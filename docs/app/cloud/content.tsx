import styles from "../docs.module.scss";
import {
  VercelLogoIcon,
  NetlifyLogoIcon,
  FlyIOLandscapeLogo,
  RenderLogo,
  RailwayLogo,
} from "@/components/icons";

export const cloudCommands = [
  {
    title: "Get REPL",
    code: `$ edgedb \\
  -I <org-name>/<instance-name>`,
  },
  {
    title: "Run migrations",
    code: `$ edgedb migrate \\
  -I <org-name>/<instance-name>`,
  },
  {
    title: "Update your instance",
    code: `$ edgedb instance upgrade \\
  --to-version <target-version> \\
  -I <org-name>/<instance-name>`,
  },
  {
    title: "Manual full backup",
    code: `$ edgedb dump \\
  --all --format dir \\
  -I <org-name>/<instance-name> \\
  <local-dump-path>`,
  },
  {
    title: "Full restore",
    code: `$ edgedb restore \\
  --all \\
  -I <org-name>/<instance-name> \\
  <local-dump-path>`,
  },
];

export const connectingYourApp = [
  {
    icon: <VercelLogoIcon className={styles.iconPath} />,
    url: "/cloud/deploy/vercel",
  },
  {
    icon: <NetlifyLogoIcon className={styles.iconPath} />,
    url: "/cloud/deploy/netlify",
  },
  {
    icon: <FlyIOLandscapeLogo className={styles.iconPath} />,
    url: "/cloud/deploy/fly",
  },
  {
    icon: <RenderLogo className={styles.iconPath} />,
    url: "/cloud/deploy/render",
  },
  {
    icon: <RailwayLogo className={styles.iconPath} />,
    url: "/cloud/deploy/railway",
  },
];
