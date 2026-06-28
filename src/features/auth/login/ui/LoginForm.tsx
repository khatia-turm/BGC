import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLoginForm } from "../model/useLoginForm";
import styles from "../../ui/AuthForm.module.scss";

export const LoginForm = () => {
  const { t } = useTranslation();
  const form = useLoginForm();

  return <main className={styles.page}>
    <section className={styles.storyPanel}>
      <div><p className={styles.eyebrow}>{t("auth.loginStoryEyebrow")}</p><h1>{t("auth.loginStoryTitle")}</h1><p className={styles.storyCopy}>{t("auth.loginStoryCopy")}</p></div>
      <div className={styles.tableScene} aria-hidden="true"><span className={styles.board}>♟</span><span className={styles.die}>6</span><span className={styles.card}>★</span><span className={styles.token}>M</span></div>
    </section>
    <section className={styles.formPanel}>
      <div className={styles.formWrap}>
        <p className={styles.step}>{form.recoveryMode ? t("auth.recoveryEyebrow") : t("auth.welcomeBack")}</p>
        <h2>{form.recoveryMode ? t("auth.recoveryTitle") : t("auth.loginTitle")}</h2>
        <p className={styles.intro}>{form.recoveryMode ? t("auth.recoveryCopy") : t("auth.loginCopy")}</p>
        <form onSubmit={form.submit} className={styles.form}>
          <label><span>{t("auth.email")}</span><div className={styles.inputWrap}><span aria-hidden="true">@</span><input type="email" value={form.email} onChange={(event) => form.setEmail(event.target.value)} placeholder="name@example.com" autoComplete="email" required /></div></label>
          {!form.recoveryMode && <label><div className={styles.labelRow}><span>{t("auth.password")}</span><button type="button" onClick={form.openRecovery}>{t("auth.forgotPassword")}</button></div><div className={styles.inputWrap}><span aria-hidden="true">◆</span><input type={form.showPassword ? "text" : "password"} value={form.password} onChange={(event) => form.setPassword(event.target.value)} placeholder="••••••••" autoComplete="current-password" required /><button type="button" className={styles.reveal} onClick={form.togglePassword} aria-label={t("auth.togglePassword")}>{form.showPassword ? "◉" : "◎"}</button></div></label>}
          {form.error && <p className={styles.error} role="alert">{form.error.message}</p>}
          {form.recoverySent && <p className={styles.success} role="status">{t("auth.recoverySent")}</p>}
          <button className={styles.submit} type="submit" disabled={form.isPending}>{form.isPending ? t("auth.working") : form.recoveryMode ? t("auth.sendRecovery") : t("auth.loginAction")} <span>→</span></button>
        </form>
        {form.recoveryMode ? <button className={styles.textButton} type="button" onClick={form.closeRecovery}>← {t("auth.backToLogin")}</button> : <p className={styles.switch}>{t("auth.noAccount")} <Link to="/register">{t("auth.createAccount")}</Link></p>}
      </div>
    </section>
  </main>;
};
