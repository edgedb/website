import {type PropsWithChildren} from 'react';
import cn from "@edgedb/common/utils/classNames";
import styles from './styles.module.scss';

type BubbleProps = PropsWithChildren<{
  title: string
  image: string
  x: string
  className?: string
}>

export default function Bubble({title, x, children, image, className}: BubbleProps) {
  return <div className={styles.bubbleCnt}>
    <div className={cn(styles.avatar, className)}
      style={{backgroundImage: `url("/assets/peoplesay/${image}")`}}></div>
    <div className={styles.bubble}>
      <h6><a href={`https://x.com/${x}`}>{title}</a></h6>
      <p>{children}</p>
    </div>
  </div>
}
