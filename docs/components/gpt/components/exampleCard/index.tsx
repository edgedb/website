import cn from "@edgedb-site/shared/utils/classNames";
import styles from "./exampleCard.module.scss";
import {RunIcon} from "../../icons";

interface ExampleCardProps {
  question: string;
  classes?: string;
  handleClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const ExampleCard = ({question, classes, handleClick}: ExampleCardProps) => (
  <button className={cn(styles.container, classes)} onClick={handleClick}>
    <p>
      {question} <RunIcon />
    </p>
  </button>
);

export default ExampleCard;
