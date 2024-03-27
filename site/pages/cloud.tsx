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
import {
  GitHubIcon,
  GoogleIcon,
  UIArrowRightIcon as ArrowRightIcon,
  CloudIcon,
  AnnouncementIcon,
} from "@/components/icons";
import {useWindowSize} from "@edgedb-site/shared/hooks/useWindowSize";
import {useOverlayActive} from "@edgedb-site/shared/hooks/useOverlayActive";
import CloudModal from "@/components/cloud/cloudModal";
import {debounceToAnimationFrame} from "@edgedb-site/shared/utils/debounce";
import ColorPicker from "@/components/colorPicker";
import styles from "@/styles/cloud.module.scss";

export const ExampleThemeContext = createContext({
  exampleTheme: "light",
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
  {name: "Cloud dashboard", url: "/_images/cloud/instance.webp"},
  {name: "REPL", url: "/_images/cloud/repl.webp"},
  {name: "Data editor", url: "/_images/cloud/dataeditor.webp"},
  {name: "Schema browser", url: "/_images/cloud/schema.webp"},
  {name: "Query builder", url: "/_images/cloud/visual.webp"},
];

const CloudPage = () => {
  const windowSize = useWindowSize();
  const isMobile = (windowSize.width && windowSize.width < 768) || false;

  const [color, setColor] = useState("1F8AED");

  const [exampleTheme, setExampleTheme] = useState("light");

  const [modalOpen, setModalOpen] = useOverlayActive("Cloud");

  return (
    <ExampleThemeContext.Provider value={{exampleTheme, setExampleTheme}}>
      <MainLayout className={styles.page} footerClassName={styles.pageFooter}>
        <MetaTags title="Cloud" description={``} relPath="/cloud" />
        <Clouds />
        {modalOpen && <CloudModal />}
        <div className="globalPageWrapperCloud">
          <div className={styles.content}>
            <h1>
              The best way to <br />
              RUN EdgeDB
            </h1>
            <p className={styles.introParagraph}>
              EdgeDB Cloud is a fully managed, effortless cloud database
              service, engineered to let you{" "}
              <span>deploy your database instantly</span> and{" "}
              <span>connect from anywhere</span> with near-zero configuration.
            </p>
            <div className={styles.introButtons}>
              <button
                className={styles.btn}
                onClick={() => setModalOpen(true)}
              >
                <CloudIcon />
                <span>Create your cloud database</span>
              </button>
              <Link
                className={cn(styles.btn, styles.border)}
                href="/blog/edgedb-cloud-and-edgedb-4-0"
              >
                <AnnouncementIcon />
                <span>Read the announcement</span>
              </Link>
            </div>

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
              {!isMobile && <ExampleThemeSwitcher />}

              <div className={styles.interactiveContent}>
                <AuthForm color={color} />
                {isMobile && <ExampleThemeSwitcher />}
                <div className={styles.colorPickerWrapper}>
                  <p>
                    <span>EdgeDB Auth</span> includes a built-in authentication
                    UI.
                  </p>
                  <p>
                    Configure it as you wish and enable just by dropping a few
                    lines to your backend code.
                  </p>
                  <ColorPickerSection color={color} setColor={setColor} />
                  <p>Or design and build your own login forms, up to you. </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="globalPageWrapperCloud">
          <div className={styles.content}>
            <section className={styles.ctaSection}>
              <h2>Edgedb cloud is here</h2>
              <p className={styles.outroParagraph}>
                EdgeDB Cloud is here and it's ready for you. It's the easiest
                way of deploying EdgeDB and we plan to continue evolving and
                improving it to give you the best cloud database experience
                possible. In the mean time...
              </p>
              <div className={styles.introButtons}>
                <button
                  className={styles.btn}
                  onClick={() => setModalOpen(true)}
                >
                  <CloudIcon />
                  <span>Create your cloud database!</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </MainLayout>
    </ExampleThemeContext.Provider>
  );
};

export default CloudPage;

function Clouds() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState([0, 0]);

  useEffect(() => {
    const isTouch = "ontouchstart" in document.documentElement;

    let x = 0;
    let y = 0;
    let lastScrollTop = document.documentElement.scrollTop;

    const listener = debounceToAnimationFrame((e: MouseEvent) => {
      const rect = containerRef.current!.getBoundingClientRect();
      x = e.clientX - (rect.x + rect.width / 2);
      y = e.clientY - (rect.y + rect.height / 2);
      setMousePos([x, y]);
    });

    const scrollListener = debounceToAnimationFrame(() => {
      y = y + document.documentElement.scrollTop - lastScrollTop;
      lastScrollTop = document.documentElement.scrollTop;
      setMousePos([x, y]);
    });

    if (!isTouch) {
      window.addEventListener("mousemove", listener, {passive: true});
    }
    document.addEventListener("scroll", scrollListener, {passive: true});

    return () => {
      if (!isTouch) {
        window.removeEventListener("mousemove", listener);
      }
      document.removeEventListener("scroll", scrollListener);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={styles.clouds}
      style={
        {
          "--mouseRelPosX": mousePos[0] + "px",
          "--mouseRelPosY": mousePos[1] + "px",
        } as any
      }
    >
      <div />
      <div />
      <div />
      <div />
    </div>
  );
}

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

interface AuthFormProps {
  color: string;
}

const AuthForm = ({color}: AuthFormProps) => (
  <div className={styles.formWrapper}>
    <div className={styles.logoWrapper}>
      <div className={styles.logo}></div>
      <p className={styles.logoTitle}>MyAppLogo</p>
    </div>

    <div className={styles.form}>
      <p className={styles.title}>
        Login to <span>MyApp</span>
      </p>
      <div className={styles.signWithApp}>
        <GitHubIcon />
        Sign in with Github
      </div>
      <div className={styles.signWithApp}>
        <GoogleIcon /> Sign in with Google
      </div>
      <p className={styles.separator}>
        <span>or</span>
      </p>
      <div>
        <div className={styles.inputWrapper}>
          <p>Email</p>
          <input disabled style={{borderColor: `#${color}`}} />
        </div>
        <div className={styles.inputWrapper}>
          <p>Password</p>
          <input disabled />
        </div>
      </div>
      <button style={{backgroundColor: `#${color}`}}>
        Login <ArrowRightIcon />
      </button>
      <p className={styles.signUpText}>
        Don't have an account?
        <span style={{color: `#${color}`}}> Sign up</span>
      </p>
    </div>
  </div>
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
