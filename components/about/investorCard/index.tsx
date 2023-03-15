import cn from "@/utils/classNames";
import styles from "./investorCard.module.scss";

interface InvestorCardProps {
  name: string;
  role: string;
  Logo: () => JSX.Element;
  company?: string;
  classes?: string;
}

const InvestorCard = ({
  name,
  role,
  Logo,
  company,
  classes,
}: InvestorCardProps) => (
  <div className={cn(styles.container, classes)}>
    <p className={styles.name}>{name}</p>
    <div className={styles.desc}>
      <p>{role} </p>
      <p className={styles.logo}>
        <Logo />
        {company}
      </p>
    </div>
  </div>
);

export default InvestorCard;
