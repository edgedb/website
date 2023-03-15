import {useEffect, useState} from "react";

import cn from "@edgedb/common/utils/classNames";

import {ChevronLeftIcon} from "@/components/icons";

import {
  FuncSig,
  OpSig,
  PythonFuncSig,
  JSClassSig,
  JSFuncSig,
  CSClassSig,
  CSFuncSig,
} from "@/components/code";

import {HeaderLinkInner} from "@/components/headerLink";

import styles from "@/styles/docs.module.scss";

export interface DescRefProps {
  classes?: string;
  text: string;
}

export function DescRef({classes, text}: DescRefProps) {
  const cls = classes?.split(/\s/);

  let sig: JSX.Element;
  if (cls?.includes("eql-op")) {
    sig = <OpSig signature={text} />;
  } else if (cls?.includes("eql-func")) {
    sig = <span className="funcname">{text}</span>;
  } else {
    sig = <>{text}</>;
  }

  return <span className={styles.descRef}>{sig}</span>;
}

export interface DescBlockProps {
  objtype: string; // 'function' | 'operator' | 'class' | 'describe'
  domain: string;
  titleSig: string | DescRefProps;
  sigs: string[];
  sigIds: string[];
  anno: string | null;
  githubLink?: string;
}

export default function DescBlock({
  objtype,
  domain,
  titleSig,
  sigs,
  sigIds,
  anno,
  githubLink,
  children,
}: React.PropsWithChildren<DescBlockProps>) {
  const [blockOpen, setBlockOpen] = useState(false);

  useEffect(() => {
    if (!!location.hash && location.hash.slice(1) === sigIds[0]) {
      setBlockOpen(true);
    }
  }, []);

  let prefixCmps: JSX.Element[] = [];
  if (sigIds.length > 1) {
    for (let i = 1; i < sigIds.length; i++) {
      prefixCmps.push(<div key={sigIds[i]} id={sigIds[i]}></div>);
    }
  }

  let sigCmps = [];
  for (let sig of sigs) {
    if (objtype == "function" && domain == "eql") {
      sigCmps.push(<FuncSig signature={sig} key={sig} />);
    } else if (objtype == "operator" && domain == "eql") {
      sigCmps.push(<OpSig signature={sig} key={sig} />);
    } else if (domain == "py") {
      sigCmps.push(<PythonFuncSig signature={sig} key={sig} />);
    } else if (objtype == "class" && domain == "js") {
      sigCmps.push(<JSClassSig signature={sig} key={sig} />);
    } else if (domain == "js") {
      sigCmps.push(<JSFuncSig signature={sig} key={sig} />);
    } else if (objtype == "class" && domain == "dn") {
      sigCmps.push(<CSClassSig signature={sig} key={sig} />);
    } else if (domain == "dn") {
      sigCmps.push(<CSFuncSig signature={sig} key={sig} />);
    } else {
      sigCmps.push(
        <span className={styles.noToken} key={sig}>
          {sig}
        </span>
      );
    }
  }

  let objtype_text = objtype;
  if (objtype == "describe" && !domain) {
    objtype_text = "interface";
  }
  if (anno != null) {
    objtype_text = anno;
  }

  return (
    <>
      {prefixCmps}
      <div
        className={cn(styles.desc, styles[`desc_${objtype}`], {
          [styles.open]: blockOpen,
        })}
      >
        <div className={styles.descAnchor} id={sigIds[0]} />
        <div className={styles.descBlock}>
          <div
            className={styles.descSigHeader}
            onClick={() => setBlockOpen(!blockOpen)}
          >
            <div className={styles.descSigType}>{objtype_text}</div>
            <div
              className={cn(styles.descSigName, {
                [styles.isDescRef]: !!titleSig && typeof titleSig !== "string",
              })}
            >
              {typeof titleSig === "string" ? (
                titleSig
              ) : (
                <DescRef {...titleSig} />
              )}
            </div>
            <div className={styles.descHeaderLink}>
              <div className={styles.descHeaderLinkFade}>
                <HeaderLinkInner id={sigIds[0]} githubLink={githubLink} />
              </div>
            </div>
            <ChevronLeftIcon className={styles.descSigHeaderArrow} />
          </div>

          {sigCmps.length ? (
            <div className={styles.descSigBlock}>
              <div className={styles.descSig}>{sigCmps}</div>
            </div>
          ) : null}

          <div className={styles.descContent}>{children}</div>
        </div>
      </div>
    </>
  );
}
