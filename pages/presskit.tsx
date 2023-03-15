import Head from "next/head";

import MainLayout from "@/components/layouts/main";

import {DownloadIcon} from "@/components/icons";
import {CopyCode} from "@/components/code";
import Logo from "@/components/icons/logo";

import styles from "@/styles/presskit.module.scss";

const isBritishLocale =
  typeof navigator !== "undefined" && navigator.language === "en-GB";

export default function PressKitPage() {
  return (
    <MainLayout className={styles.page}>
      <Head>
        <title>Media Kit</title>
      </Head>
      <div className="globalPageWrapper">
        <div className={styles.content}>
          <h1>Media Kit</h1>

          <div className={styles.downloadButtons}>
            <a href="/assets/presskit/edb_logo_pack.zip" download>
              <DownloadIcon />
              Download Logo Pack
            </a>
          </div>

          <h2>Colo{isBritishLocale ? "u" : ""}r Palette</h2>
          <div className={styles.palette}>
            {["#0CCB93", "#4D4D4D", "#F7F7F7", "#FFFFFF"].map((hex) => (
              <div className={styles.paletteItem} key={hex}>
                <div
                  className={styles.swatch}
                  style={{
                    backgroundColor: hex,
                    borderColor: hex === "#FFFFFF" ? "#4d4d4d" : undefined,
                  }}
                />
                <div className={styles.paletteInfo}>
                  {hex}
                  <CopyCode code={hex} className={styles.copyButton} />
                </div>
              </div>
            ))}
          </div>

          <div className={styles.logoCards}>
            {[
              {colour: "#616161"},
              {colour: "#0CCB93"},
              {colour: "#4C4C4C", bg: "#F7F7F7"},
              {colour: "#FFF", bg: "#4C4C4C"},
            ].map(({colour, bg}) => (
              <div
                className={styles.logoCard}
                style={{
                  backgroundColor: bg,
                  borderColor: bg,
                  color: bg ? colour : undefined,
                }}
                key={colour}
              >
                <Logo style={{color: colour}} />
                <span>Minimum width: 30px</span>
                <Logo className={styles.logoSmall} style={{color: colour}} />
              </div>
            ))}
          </div>

          <h2>Minimum Margins</h2>
          <div className={styles.minMargins}>
            <img src="/assets/presskit/logo_min_margins.svg" />
          </div>

          <h2>Scaling and Placement with other logos</h2>
          <div className={styles.placements}>
            <img src="/assets/presskit/logo_correct_placement.svg" />
            <img src="/assets/presskit/logo_incorrect_placement.svg" />
          </div>
        </div>
      </div>
      <div className={styles.dontsBlock}>
        <div className="globalPageWrapper">
          <div className={styles.content}>
            <h2>Don'ts</h2>
            <div className={styles.logoDonts}>
              <img src="/assets/presskit/logo_random_colours.svg" />
              <span>Do not use random colors</span>

              <img src="/assets/presskit/logo_gradient_fills.svg" />
              <span>Do not use gradient fills</span>

              <img src="/assets/presskit/logo_distortion.svg" />
              <span>Do not distort</span>

              <img src="/assets/presskit/logo_geocities.svg" />
              <span>Do not use effects</span>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
