import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLoginForm } from "../model/useLoginForm";
import { FieldError } from "@shared/ui/FieldError";
import styles from "../../ui/AuthForm.module.scss";

export const LoginForm = () => {
  const { t } = useTranslation();
  const form = useLoginForm();

  return (
    <main className={styles.page}>
      <section className={styles.storyPanel}>
        <div>
          <p className={styles.eyebrow}>{t("auth.loginStoryEyebrow")}</p>
          <h1>{t("auth.loginStoryTitle")}</h1>
          <p className={styles.storyCopy}>{t("auth.loginStoryCopy")}</p>
        </div>
        <div className={styles.tableScene} aria-hidden="true">
          <span className={styles.board}>P</span>
          <span className={styles.die}>6</span>
          <span className={styles.card}>*</span>
          <span className={styles.token}>M</span>
        </div>
      </section>
      <section className={styles.formPanel}>
        <div className={styles.formWrap}>
          <p className={styles.step}>{t("auth.welcomeBack")}</p>
          <h2>{t("auth.loginTitle")}</h2>
          <p className={styles.intro}>{t("auth.loginCopy")}</p>
          <form onSubmit={form.submit} className={styles.form}>
            <label>
              <span>{t("auth.email")}</span>
              <div className={styles.inputWrap}>
                <span aria-hidden="true">@</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => form.setEmail(event.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                />
              </div>
              <FieldError error={form.getFieldError("email")} />
            </label>
            <label>
              <span>{t("auth.password")}</span>
              <div className={styles.inputWrap}>
                <span aria-hidden="true">*</span>
                <input
                  type={form.showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) => form.setPassword(event.target.value)}
                  placeholder="********"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className={styles.reveal}
                  onClick={form.togglePassword}
                  aria-label={t("auth.togglePassword")}
                >
                  {form.showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <FieldError error={form.getFieldError("password")} />
            </label>
            <label className={styles.terms}>
              <input
                type="checkbox"
                checked={form.rememberMe}
                onChange={(event) => form.setRememberMe(event.target.checked)}
              />
              <span>{t("auth.rememberMe")}</span>
            </label>
            {form.error && (
              <p className={styles.error} role="alert">
                {form.error.message}
              </p>
            )}
            <button
              className={styles.submit}
              type="submit"
              disabled={form.isPending}
            >
              {form.isPending ? t("auth.working") : t("auth.loginAction")}{" "}
              <span>-&gt;</span>
            </button>
          </form>
          <p className={styles.switch}>
            {t("auth.noAccount")}{" "}
            <Link to="/register">{t("auth.createAccount")}</Link>
          </p>
        </div>
      </section>
    </main>
  );
};
