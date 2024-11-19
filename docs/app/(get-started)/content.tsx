import { BookIcon, RocketIcon, TerminalIcon } from "@/components/icons";

export const getStartedIntro = [
  <p key="1st-paragraph">
    EdgeDB is an <b>open-source database</b> engineered to advance SQL into a
    sophisticated <b>graph data model</b>, supporting{" "}
    <b>composable hierarchical queries</b> and accelerated development cycles.
  </p>,
  <p key="2nd-paragraph">
    EdgeDB significantly <b>simplifies your stack and code</b>, eliminating the
    need for ORMs while <b>offering effortless type safety </b>
    and <b>best-in-class performance</b>.
  </p>,
  <p key="3d-paragraph">
    EdgeDB allows you to <b>build your app</b> fast. When it's time to deploy it
    gives you a <b>1-click cloud database</b> experience.
  </p>,
];

export const getStartedUrls = [
  {
    icon: <RocketIcon />,
    title: "Quick  start",
    url: "/get-started/quickstart",
    desc: "EdgeDB makes it easy to get started. Try our Quickstart to install with a single command and build your first app!",
  },
  {
    icon: <TerminalIcon />,
    title: "Live tutorial",
    url: "/tutorial",
    desc: "Our in-browser tutorial shows you the full power of EdgeDB in < 15 minutes!",
  },
  {
    icon: <BookIcon />,
    title: "Book",
    url: "/easy-edgedb",
    desc: "Become an expert while building a fake game based on Dracula in our book Easy EdgeDB.",
  },
];
