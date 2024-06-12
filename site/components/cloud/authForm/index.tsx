import {
  GitHubIcon,
  GoogleIcon,
  UIArrowRightIcon as ArrowRightIcon,
} from "@/components/icons";
import styles from "./authForm.module.scss";

interface AuthFormProps {
  color: string;
  includeHeader?: boolean;
}

const AuthForm = ({color, includeHeader = false}: AuthFormProps) => (
  <div className={styles.formWrapper}>
    {includeHeader && (
      <div className={styles.logoWrapper}>
        <div className={styles.logo}></div>
        <p className={styles.logoTitle}>MyAppLogo</p>
      </div>
    )}

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

export default AuthForm;
