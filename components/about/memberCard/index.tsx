import cn from "@/utils/classNames";

import {GitHubIcon, LinkedinIcon, TwitterIcon} from "@/components/icons/about";
import {AvatarAnimations} from "components/icons/about";
import styles from "./memberCard.module.scss";

export interface TeamMember {
  name: string;
  role: string;
  country: string;
  avatar?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  classes?: string;
}

const MemberCard = ({
  name,
  role,
  country,
  avatar,
  github,
  linkedin,
  twitter,
  classes,
}: TeamMember) => {
  const avatarUrl = avatar
    ? require(`content/about/photos/${avatar}`).default.src
    : "assets/about/avatar.svg";

  return (
    <div className={cn(styles.container, classes)}>
      <div
        className={styles.avatar}
        style={{backgroundImage: `url(${avatarUrl})`}}
      >
        <AvatarAnimations />
      </div>
      <div className={styles.info}>
        <p className={styles.name}>{name}</p>
        <p className={styles.role}>{role}</p>
        <p className={styles.country}>{country}</p>
        <div className={styles.socials}>
          {github && (
            <a href={github}>
              <GitHubIcon />
            </a>
          )}
          {linkedin && (
            <a href={linkedin}>
              <LinkedinIcon />
            </a>
          )}
          {twitter && (
            <a href={twitter}>
              <TwitterIcon />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberCard;
