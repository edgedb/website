import React, {
  useState,
  useContext,
  createContext,
  useRef,
  useEffect,
} from "react";

import Link from "next/link";
import MainLayout from "@/components/layouts/main";
import MetaTags from "@/components/metatags";
import {
  LightThemeIcon,
  DarkThemeIcon,
} from "@edgedb-site/shared/components/themeSwitcher/icons";
import Tabs from "@/components/cloud/tabs/tabs";
import cn from "@edgedb/common/utils/classNames";
import {CloudIcon} from "@/components/icons";
import {useWindowSize} from "@edgedb-site/shared/hooks/useWindowSize";
import {useOverlayActive} from "@edgedb-site/shared/hooks/useOverlayActive";
import CloudModal from "@/components/cloud/cloudModal";
import ColorPicker from "@/components/colorPicker";
import Env from "@/components/cloud/env";
import styles from "@/styles/cloud.module.scss";
import AuthForm from "@/components/cloud/authForm";

export const ExampleThemeContext = createContext({
  exampleTheme: "dark",
  setExampleTheme: (_: string) => {},
});

const generalFeatures = [
  {
    title: "Cloud built for developers",
    content:
      "We refused to cut corners: our cloud is fully integrated into the EdgeDB toolchain and has a beautiful UI to match.",
  },
  {
    title: "Easy deploy",
    content:
      "First, generate a secret key. Second, create environment variables with the key and the instance name where your backend runs.",
  },
  {
    title: "Enjoy EdgeDB",
    content:
      "It's everything you love about EdgeDB: type safety, built-in migrations, intuitive data modeling, and more. But leave the infrastructure to us!",
  },
];

const resilienceFeatures = [
  {
    title: "Uninterruptible connection",
    content:
      "Our client libraries automatically reconnect if the network connection to the database drops for any reason. Read-only queries are also automatically retried.",
  },
  {
    title: "Builtin connection pooling",
    content:
      "Client-side connection pools are transparently configured, scaled, and maintained. Meanwhile, built-in server-side connection pooling ensures balanced access across your backend.",
  },
  {
    title: "Robust transactions",
    content:
      "EdgeDB uses serializable transactions—the highest transaction isolation level. Our client-side query and transaction API automatically retry operations if a serialization error occurs.",
  },
  {
    title: "One API to rule them all",
    content:
      "Since we designed our library APIs from scratch, we made sure they're similar across all supported languages. Learn the TypeScript API, and you're pretty much set with Python, too. It's that kind of deal.",
  },
  {
    title: "Secure by default",
    content:
      "The EdgeDB protocol is secure by default and requires TLS. Naturally every EdgeDB Cloud instance comes with a free, trusted TLS certificate. Our client APIs and tooling are built to work with TLS from the ground up.",
  },
];

const uiTabs = [
  {name: "Cloud dashboard", url: "/_images/cloud/instance1.webp"},
  {name: "REPL", url: "/_images/cloud/repl1.webp"},
  {name: "Data editor", url: "/_images/cloud/dataeditor1.webp"},
  {name: "Schema browser", url: "/_images/cloud/schema1.webp"},
  {name: "Query builder", url: "/_images/cloud/visual1.webp"},
];

const CloudPage = () => {
  const windowSize = useWindowSize();
  const isMobile = (windowSize.width && windowSize.width < 768) || false;

  const [color, setColor] = useState("8280FF");

  const [exampleTheme, setExampleTheme] = useState("dark");

  const [modalOpen, setModalOpen] = useOverlayActive("Cloud");

  const target = useRef<HTMLDivElement>(
    null!
  ) as React.MutableRefObject<HTMLInputElement>;

  return (
    <ExampleThemeContext.Provider value={{exampleTheme, setExampleTheme}}>
      <MainLayout className={styles.page}>
        <MetaTags title="Cloud" description={``} relPath="/cloud" />
        <Env eventSource={target} />
        {modalOpen && <CloudModal />}
        <div className="globalPageWrapperCloud" ref={target}>
          <div className={styles.content}>
            <h1>
              <span>The best way </span>to
              <br />
              run EdgeDB
            </h1>
            <p className={styles.introParagraph}>
              EdgeDB Cloud is a fully managed, effortless cloud database
              service, engineered to let you{" "}
              <span>deploy your database instantly</span> and{" "}
              <span>connect from anywhere</span> with near-zero configuration.
            </p>
            <button className={styles.btn} onClick={() => setModalOpen(true)}>
              <CloudIcon />
              <span>Create your cloud database</span>
            </button>

            <section className={styles.generalFeatures}>
              {generalFeatures.map(({title, content}) => (
                <div className={styles.feature} key={title}>
                  <h3>{title}</h3>
                  <p className={styles.small}>{content}</p>
                </div>
              ))}
            </section>

            <section className={styles.uiSection}>
              <h2>Just a click away</h2>
              <p className={styles.introParagraph}>
                EdgeDB Cloud comes with a UI for managing your cloud database,
                including tools like the Data Editor, Schema Browser, and Web
                REPL, effectively making it a <b>cloud data IDE</b>.
              </p>
              <Tabs tabs={uiTabs} className={styles.imageTabs} />
            </section>

            <section>
              <h2>Seamless resilience</h2>
              <div className={styles.resilienceFeatures}>
                <div className={styles.overview}>
                  <p>
                    EdgeDB features a state-of-the-art network protocol and
                    client libraries.
                  </p>
                  <p>
                    This vertical integration enables us to offer unique
                    features unmatched by any other cloud database.
                  </p>
                  <p>
                    Don't let your backend{" "}
                    <span className={styles.blink}>blink</span>.
                  </p>
                </div>
                <div>
                  {resilienceFeatures.map(({title, content}, i) => (
                    <div
                      className={styles.resilienceFeature}
                      key={title}
                      style={{"--blockOrder": i + 1} as any}
                    >
                      <h3>{title}</h3>
                      <p className={styles.small}>{content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className={styles.authSection}>
              {/* todo should I update content */}
              <h2>Integrated auth</h2>
              <p className={styles.authParagraph}>
                Ready to build authentication for your new app all over again?
                If not, check out our built-in authentication extension. It's
                part of the open-source EdgeDB and works seamlessly with EdgeDB
                Cloud.
              </p>
            </section>
          </div>
        </div>

        <div
          className={cn(styles.interactiveSection, {
            [styles.darkMode]: exampleTheme == "dark",
          })}
        >
          <div className="globalPageWrapperCloud">
            <div className={styles.content}>
              <div className={styles.interactiveContent}>
                <AuthForm color={color} includeHeader />
                <div className={styles.colorPickerWrapper}>
                  <p>
                    <span>EdgeDB Auth</span> includes a built-in authentication
                    UI.
                  </p>
                  <p>
                    Configure it as you wish and enable just by dropping a few
                    lines to your backend code.
                  </p>
                  {!isMobile && (
                    <ColorPickerSection color={color} setColor={setColor} />
                  )}
                  <p>Or design and build your own login forms, up to you. </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="globalPageWrapperCloud">
          <div className={styles.content}>
            <section className={styles.ctaSection}>
              <h2>EdgeDB Cloud</h2>
              <p className={styles.outroParagraph}>
                EdgeDB Cloud is the easiest
                way of deploying EdgeDB and we plan to continue evolving and
                improving it to give you the best cloud database experience
                possible. In the mean time...
              </p>
              <button
                className={styles.btn}
                onClick={() => setModalOpen(true)}
              >
                <CloudIcon />
                <span>Create your cloud database!</span>
              </button>
            </section>
          </div>
        </div>
      </MainLayout>
    </ExampleThemeContext.Provider>
  );
};

export default CloudPage;

interface ColorPickerSectionProps {
  color: string;
  setColor: React.Dispatch<React.SetStateAction<string>>;
}

const ColorPickerSection = ({color, setColor}: ColorPickerSectionProps) => (
  <form className={styles.colorPicker}>
    <div className={styles.logoWrapper}>
      <label htmlFor="appLogo">Custom App logo (.png or .svg)</label>
      <input
        name="appLogo"
        id="appLogo"
        type="file"
        accept="image/png, image/svg"
        className={styles.logoInput}
        disabled
      ></input>
      <div className={styles.fakeInput}>MyAppLogo.png</div>
    </div>
    <ColorPicker
      label="Custom accent color"
      colorHex={color}
      setColorHex={setColor}
    />
  </form>
);

function ExampleThemeSwitcher() {
  const {exampleTheme, setExampleTheme} = useContext(ExampleThemeContext);

  return (
    <div className={cn(styles.themeSwitcherBig)}>
      <button
        className={cn({
          [styles.active]: exampleTheme === "light",
        })}
        onClick={() => setExampleTheme("light")}
      >
        <LightThemeIcon />
        Light
      </button>
      <button
        className={cn({
          [styles.active]: exampleTheme === "dark",
        })}
        onClick={() => setExampleTheme("dark")}
      >
        <DarkThemeIcon />
        Dark
      </button>
    </div>
  );
}
