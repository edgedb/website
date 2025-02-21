import { useState, useEffect } from "react";

import cn from "@edgedb-site/shared/utils/classNames";

import { ColourTheme, useTheme } from "@edgedb-site/shared/hooks/useTheme";

import {
  CloseIcon,
  ChevronLeftIcon,
} from "@edgedb-site/shared/components/icons";

import styles from "./schemaHelp.module.scss";

interface TutorialSchemaHelpProps {
  open: boolean;
  onClose: () => void;
}

export default function TutorialSchemaHelp({
  open,
  onClose,
}: TutorialSchemaHelpProps) {
  const [cardIndex, setCardIndex] = useState(0);

  const { actualTheme } = useTheme();
  const theme = actualTheme === ColourTheme.Dark ? "dark" : "light";

  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (open) {
      setOpened(true);
    }
  }, [open]);

  if (!open && !opened) {
    return null;
  }

  const cards = [
    <div className={styles.card} key="card_controls">
      <div className={styles.title}>Tutorial Schema Browser</div>
      <div className={cn(styles.content, styles.vertical)}>
        <img
          src={`/assets/tutorial/help_controls_${theme}.png`}
          style={{ width: "247px" }}
        />
        <div className={styles.text}>
          <p>
            On this screen you can explore the schema we are using in some
            tutorial sections.
          </p>
          <p>
            There are two views: Graphical and Textual. Toggle between them in
            the blue toolbar at the bottom of the screen
          </p>
        </div>
      </div>
    </div>,
    <div className={styles.card} key="card_schema">
      <div className={styles.title}>
        Object types are represented as graph nodes
      </div>
      <div className={styles.content}>
        <img
          src={`/assets/tutorial/help_schema_${theme}.png`}
          style={{ width: "208px" }}
        />
        <div className={styles.text}>
          <p>
            A grey line from type A to type B means that type A extends type B.
          </p>
          <p>
            When you click on them you will see what other object types they are
            linked to. Magenta line from type A to type B means that type A has
            a link to type B.
          </p>
        </div>
      </div>
    </div>,
  ];

  return (
    <div
      className={cn(styles.schemaHelpOverlay, {
        [styles.open]: open && opened,
      })}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={styles.schemaHelp}>
        <div className={styles.cardsWrapper}>
          <div
            className={styles.cards}
            style={{
              transform: `translateX(-${cardIndex * 100}%)`,
            }}
          >
            {cards}
          </div>
        </div>

        <div className={styles.close} onClick={onClose}>
          <CloseIcon />
        </div>
        <div
          className={cn(styles.leftArrow, {
            [styles.disabled]: cardIndex === 0,
          })}
          onClick={() => setCardIndex(cardIndex - 1)}
        >
          <ChevronLeftIcon />
        </div>
        <div
          className={cn(styles.rightArrow, {
            [styles.disabled]: cardIndex === cards.length - 1,
          })}
          onClick={() => setCardIndex(cardIndex + 1)}
        >
          <ChevronLeftIcon />
        </div>
        <div className={styles.dots}>
          {cards.map((_, i) => (
            <div
              key={i}
              className={cn(styles.dot, {
                [styles.active]: i === cardIndex,
              })}
              onClick={() => setCardIndex(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
