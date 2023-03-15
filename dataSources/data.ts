import {
  Auth0Icon,
  CockroachLabsIcon,
  FirebaseIcon,
  IBMIcon,
  NetlifyIcon,
  OpenAIIcon,
  PagerDutyIcon,
  YugaByteIcon,
  RelationshipHeroIcon,
  CoilIcon,
} from "./../components/icons/about";
import {
  AlphabetIcon,
  GitHubIcon,
  IconiqIcon,
  SentryIcon,
  VercelIcon,
} from "@/components/icons/about";
import {
  LearnBookIcon,
  LearnDocsIcon,
  LearnRocketIcon,
  LearnTutorialIcon,
} from "../components/icons/learn";
import {sortByName} from "utils/sorting";

export const URLS = {
  EDGEQL: "/showcase/edgeql",
  GRAPHQL: "/showcase/graphql",
  MIGRATIONS: "/showcase/migrations",
  DATA_MODELING: "/showcase/data-modeling",
};

export const learnCards = [
  {href: "/docs/guides/quickstart", title: "5-min Quickstart"},
  {href: "/tutorial", title: "Interactive EdgeQL Tutorial"},
  {href: "/easy-edgedb", title: "Easy EdgeDB Book"},
  {href: "/docs", title: "Documentation"},
];

export const learnCardsExtended = [
  ...learnCards,
  {href: URLS.MIGRATIONS, title: "Migrations"},
  {href: URLS.DATA_MODELING, title: "Data modeling"},
  {href: URLS.GRAPHQL, title: "GraphQL"},
  {href: URLS.EDGEQL, title: "EdgeQL"},
];

export const homepageCards = [
  {
    href: "/docs/guides/quickstart",
    title: "5-min Quickstart",
    desc:
      "Install EdgeDB, create a simple schema, and write your first queries in under 5 minutes.",
    Icon: LearnRocketIcon,
  },
  {
    href: "/tutorial",
    title: "Interactive EdgeQL Tutorial",
    desc:
      "The quickest way to learn the key concepts of EdgeDB without installation, right in your browser.",
    Icon: LearnTutorialIcon,
  },
  {
    href: "/easy-edgedb",
    title: "Easy EdgeDB Book",
    desc:
      "An easy to follow book about using EdgeDB for an imaginary game based on the setting in Bram Stoker's 1897 book Dracula.",
    Icon: LearnBookIcon,
  },
  {
    href: "/docs",
    title: "Documentation",
    desc:
      "An in-depth look at everything there is to know about EdgeDB: data types, query language, schema and database setup, etc.",
    Icon: LearnDocsIcon,
  },
];

export const angelInvestors = sortByName([
  {
    name: "Guillermo Rauch",
    role: "Founder/CEO of",
    Logo: VercelIcon,
    company: "Vercel",
  },
  {
    name: "Roger W. Ferguson Jr.",
    role: "Board of Directors at",
    Logo: AlphabetIcon,
    company: "Alphabet",
  },
  {
    name: "Greg Brockman",
    role: "Co-founder of",
    Logo: OpenAIIcon,
    company: "OpenAI",
  },
  {
    name: "James Tamplin",
    role: "Founder/ex-CEO of",
    Logo: FirebaseIcon,
    company: "Firebase",
  },
  {
    name: "Andrew Miklas",
    role: "Co-founder/ex-CTO of",
    Logo: PagerDutyIcon,
    company: "Pagerduty",
  },
  {
    name: "Tom-Preston Werner",
    role: "Founder/ex-CEO of",
    Logo: GitHubIcon,
    company: "GitHub",
  },
  {
    name: "Divesh Makan",
    role: "Founder/CEO of",
    Logo: IconiqIcon,
  },
  {
    name: "Nat Friedman",
    role: "ex-CEO of",
    Logo: GitHubIcon,
    company: "GitHub",
  },
  {
    name: "Kannan Muthukkaruppan",
    role: "Founder/President of",
    Logo: YugaByteIcon,
    company: "Yugabyte",
  },
  {
    name: "Matias Woloski",
    role: "Co-founder/ex-CTO of",
    Logo: Auth0Icon,
    company: "Auth0",
  },
  {
    name: "Liron Shapira",
    role: "CEO of",
    Logo: RelationshipHeroIcon,
    company: "Relationship Hero",
  },
  {
    name: "David Cramer",
    role: "Founder/CEO of",
    Logo: SentryIcon,
    company: "Sentry",
  },
  {
    name: "Samuel J. Palmisano",
    role: "ex-CEO of",
    Logo: IBMIcon,
  },
  {
    name: "Ben Darnell",
    role: "Co-founder of",
    Logo: CockroachLabsIcon,
    company: "Cockroach Labs",
  },
  {
    name: "Mathias Biilmann",
    role: "Founder/CEO of",
    Logo: NetlifyIcon,
    company: "Netlify",
  },
  {name: "Stefan Thomas", role: "CEO of", Logo: CoilIcon},
]);
