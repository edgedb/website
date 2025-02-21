import {
  NextJSLogoIcon,
  ChatGPTLogoIcon,
  FlaskLogoIcon,
  FastAPILogoIcon,
  BunLogoIcon,
  PhoenixLogoIcon,
  AWSLogoIcon,
  AzureLogoIcon,
  DigitalOceanLogoIcon,
  GoogleCloudLogoIcon,
  HerokuLogoIcon,
  DockerLogoIcon,
  FlyIOLogoIcon,
  StrawberryLogoIcon,
} from "@/components/icons";
import styles from "../docs.module.scss";

export const guides = [
  {
    title: "EdgeDB Cloud",
    url: "/cloud",
    content:
      "EdgeDB Cloud is the easiest way to host your EdgeDB instance. We'll teach you to use it via our CLI and GUI, and how to deploy your app.",
  },
  {
    title: "EdgeDB Auth",
    url: "/guides/auth",
    content:
      "EdgeDB Auth is a batteries-included authentication solution for your app built into the EdgeDB server. We'll teach you to integrate it with your app.",
  },
  {
    title: "Self-hosting",
    url: "/guides/deployment",
    content:
      "Our self-hosting guides will get you started deploying your EdgeDB instance to various targets like DigitalOcean, AWS, and GCP.",
  },
  {
    title: "Migration patterns",
    url: "/guides/migrations",
    content:
      "Learn the ideal ways to perform various schema migrations using our CLI's migration tools.",
  },
  {
    title: "Importing existing data",
    url: "/guides/datamigrations",
    content:
      "We'll guide you through migrating your data from another database engine into EdgeDB.",
  },
  {
    title: "Contributing",
    url: "/guides/contributing",
    content:
      "EdgeDB is open source! Learn how you can become a part of our story by contributing code or documentation to the project.",
  },
];

export const tutorials = [
  {
    icon: <NextJSLogoIcon className={styles.iconPath} />,
    url: "/guides/tutorials/nextjs_app_router",
  },
  {
    icon: <ChatGPTLogoIcon className={styles.iconPath} />,
    url: "/guides/tutorials/chatgpt_bot",
  },
  {
    icon: <BunLogoIcon className={styles.bunLogo} />,
    url: "https://bun.sh/guides/ecosystem/edgedb",
    target: "_blank",
  },
  {
    icon: <FastAPILogoIcon />,
    url: "/guides/tutorials/rest_apis_with_fastapi",
  },
  {
    icon: <FlaskLogoIcon className={styles.iconPath} />,
    url: "/guides/tutorials/rest_apis_with_flask",
  },
  {
    icon: <StrawberryLogoIcon className={styles.iconPath} />,
    url: "/guides/tutorials/graphql_apis_with_strawberry",
  },
  {
    icon: <PhoenixLogoIcon className={styles.iconPath} />,
    url: "/guides/tutorials/phoenix_github_oauth",
  },
];

export const deployment = [
  {
    icon: <AWSLogoIcon className={styles.iconPath} />,
    url: "/guides/deployment/aws_aurora_ecs",
  },
  { icon: <AzureLogoIcon />, url: "/guides/deployment/azure_flexibleserver" },
  {
    icon: <DigitalOceanLogoIcon />,
    url: "/guides/deployment/digitalocean",
  },
  { icon: <FlyIOLogoIcon />, url: "/guides/deployment/fly_io" },
  {
    icon: <GoogleCloudLogoIcon />,
    url: "/guides/deployment/gcp",
  },
  {
    icon: <HerokuLogoIcon className={styles.iconPath} />,
    url: "/guides/deployment/heroku",
  },
  {
    icon: <DockerLogoIcon />,
    url: "/guides/deployment/docker",
  },
];
