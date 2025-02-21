import {useState} from "react";
import {useForm, SubmitHandler} from "react-hook-form";
import cn from "@edgedb/common/utils/classNames";
import {CloseIconDefault, GitHubIcon} from "@/components/icons";
import {useOverlayTypeActive} from "@edgedb-site/shared/hooks/useOverlayActive";
import Spinner from "@edgedb/common/ui/spinner";
import getLoginUrl, {Tiers} from "@edgedb-site/shared/utils/getLoginUrl";
import styles from "./pricingModal.module.scss";

const emailRegex = /.+@.+\..+/;

const Free = () => {
  const loginUrl = getLoginUrl(Tiers.free);

  return (
    <div className={cn(styles.modal, styles.padding)}>
      <h2>Let's do it</h2>
      <ul>
        <li>
          As a next step, we'll ask you to authenticate with your GitHub
          account.
        </li>
        <li>
          After that you will be redirected to cloud.edgedb.com, where you can
          create a free cloud instance of EdgeDB!
        </li>
        <li>You can upgrade to the “Pro” plan anytime!</li>
      </ul>
      <a href={loginUrl} className={styles.submit}>
        <GitHubIcon /> Login with GitHub
      </a>
    </div>
  );
};

const Pro = () => {
  const loginUrl = getLoginUrl(Tiers.pro);

  return (
    <div className={cn(styles.modal, styles.padding)}>
      <h2>Let's do it!</h2>
      <ul>
        <li>
          As a next step, we'll ask you to authenticate with your GitHub
          account.
        </li>
        <li>
          After that you will be redirected to cloud.edgedb.com, where you will
          be prompted to enter your billing details and configure your cloud
          instance!
        </li>
      </ul>
      <a href={loginUrl} className={styles.submit}>
        <GitHubIcon /> Login with GitHub
      </a>
    </div>
  );
};

export interface ContactFormValues {
  name: string;
  company: string;
  email: string;
  message: string;
}

const Enterprise = () => {
  const [, setActiveModal] = useOverlayTypeActive<Tiers>("Pricing");
  const [showThanksMessage, setShowThanksMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: {errors, isValid},
  } = useForm<ContactFormValues>({
    defaultValues: {name: "", company: "", email: "", message: ""},
    mode: "onChange",
  });

  const clientError =
    Object.keys(errors).length > 1
      ? "Please provide all required fields."
      : errors.name?.message ||
        errors.company?.message ||
        errors.email?.message ||
        "";

  const onSubmit: SubmitHandler<ContactFormValues> = async (values) => {
    if (!isValid) return;
    setIsLoading(true);

    const res = await fetch(`api/submitContactForm`, {
      method: "POST",
      body: JSON.stringify({
        values,
      }),
    });

    if (res.ok) {
      setShowThanksMessage(true);
      setTimeout(() => setActiveModal(null), 2000);
    } else setServerError(await res.json());
  };

  return (
    <div className={styles.modal}>
      <h2>Let's connect</h2>
      {showThanksMessage ? (
        <p className={styles.thanksMessage}>
          Thanks for your message! We'll get back to you ASAP via your email.
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <p className={styles.subtitle}>
            We need a few details from you to start the process.
          </p>
          <div>
            <label htmlFor="name">
              Your name*
              <input
                type="text"
                id="name"
                {...register("name", {required: "Please enter your name."})}
                aria-invalid={errors.name ? "true" : "false"}
                className={cn({[styles.error]: !!errors.name})}
              />
            </label>
            <label htmlFor="company">
              Company name*
              <input
                type="text"
                id="company"
                {...register("company", {
                  required: "Please enter the company name.",
                })}
                aria-invalid={errors.company ? "true" : "false"}
                className={cn({[styles.error]: !!errors.company})}
              />
            </label>
            <label htmlFor="email">
              Business email*
              <input
                type="email"
                id="email"
                {...register("email", {
                  required: "Please enter your business email.",
                  pattern: {
                    value: emailRegex,
                    message: "Entered email address is not valid.",
                  },
                })}
                aria-invalid={errors.email ? "true" : "false"}
                className={cn({[styles.error]: !!errors.email})}
              />
            </label>
          </div>
          <div className={styles.optionalField}>
            <label htmlFor="message">
              Additional details you want to share
              <textarea id="message" {...register("message")} rows={4} />
            </label>
          </div>
          <p className={styles.errorText}>{clientError || serverError}</p>
          <div className={styles.submitWrapper}>
            <button
              type="submit"
              className={styles.submit}
              disabled={isLoading}
            >
              Send
            </button>
            {isLoading && (
              <Spinner
                size={30}
                strokeWidth={3}
                angle={270}
                className={styles.spinner}
              />
            )}
          </div>
        </form>
      )}
    </div>
  );
};

const PricingModal = () => {
  const [activeModal, setActiveModal] = useOverlayTypeActive<Tiers>("Pricing");

  const modal = {
    [Tiers.free]: <Free />,
    [Tiers.pro]: <Pro />,
    [Tiers.enterprise]: <Enterprise />,
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.background} />
        <button onClick={() => setActiveModal(null)} className={styles.close}>
          <CloseIconDefault />
        </button>
        {modal[activeModal as Tiers]}
      </div>
    </div>
  );
};

export default PricingModal;
