import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { maximumBirthday, useRegisterForm } from "../model/useRegisterForm";
import styles from "../../ui/AuthForm.module.scss";
import { useGames } from "@entities/game/api";

export const RegisterForm = () => {
  const { t } = useTranslation();
  const form = useRegisterForm();
  const { values } = form;
  const { data: games = [] } = useGames();

  return <main className={`${styles.page} ${styles.registerPage}`}>
    <section className={styles.storyPanel}>
      <div><p className={styles.eyebrow}>{t("auth.registerStoryEyebrow")}</p><h1>{t("auth.registerStoryTitle")}</h1><p className={styles.storyCopy}>{t("auth.registerStoryCopy")}</p></div>
      <ol className={styles.benefits}><li><span>01</span>{t("auth.benefitEvents")}</li><li><span>02</span>{t("auth.benefitStats")}</li><li><span>03</span>{t("auth.benefitCommunity")}</li></ol>
      <p className={styles.memberCount}><strong>2,400+</strong> {t("auth.playersJoined")}</p>
    </section>
    <section className={styles.formPanel}>
      <div className={`${styles.formWrap} ${styles.registerWrap}`}>
        <p className={styles.step}>{t("auth.joinCommunity")}</p><h2>{t("auth.registerTitle")}</h2><p className={styles.intro}>{t("auth.registerCopy")}</p>
        <form onSubmit={form.submit} className={styles.form}>
          <div className={styles.avatarRow}><div className={styles.avatar}>{form.avatarUrl ? <img src={form.avatarUrl} alt="" /> : <span aria-hidden="true">♙</span>}</div><div><strong>{t("auth.profilePhoto")}</strong><p>{t("auth.photoHint")}</p><label className={styles.upload}>{t("auth.choosePhoto")}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={form.chooseAvatar} /></label></div></div>
          <div className={styles.twoColumns}><label><span>{t("auth.firstName")}</span><input value={values.firstName} onChange={form.update("firstName")} autoComplete="given-name" required /></label><label><span>{t("auth.lastName")}</span><input value={values.lastName} onChange={form.update("lastName")} autoComplete="family-name" required /></label></div>
          <label><span>{t("auth.nickname")}</span><div className={styles.inputWrap}><span aria-hidden="true">♟</span><input value={values.nickname} onChange={form.update("nickname")} placeholder="TabletopKing" autoComplete="nickname" required /></div></label>
          <div className={styles.twoColumns}><label><span>{t("auth.email")}</span><input type="email" value={values.email} onChange={form.update("email")} placeholder="name@example.com" autoComplete="email" required /></label><label><span>{t("auth.phone")}</span><input type="tel" value={values.phone} onChange={form.update("phone")} placeholder="+995 555 123 456" autoComplete="tel" required /></label></div>
          <div className={styles.twoColumns}><label><span>Birthday</span><input type="date" value={values.birthday} onChange={form.update("birthday")} max={maximumBirthday} required /></label><label><span>Gender</span><select value={values.gender} onChange={form.update("gender")} required><option value="" disabled>Select gender</option><option value="0">Male</option><option value="1">Female</option><option value="2">Other</option></select></label></div>
          <div className={styles.twoColumns}><label><span>{t("auth.password")}</span><div className={styles.inputWrap}><span aria-hidden="true">◆</span><input type={form.showPassword ? "text" : "password"} value={values.password} onChange={form.update("password")} autoComplete="new-password" minLength={8} required /><button type="button" className={styles.reveal} onClick={form.togglePassword} aria-label={t("auth.togglePassword")}>{form.showPassword ? "◉" : "◎"}</button></div><div className={styles.strength} aria-label={t("auth.passwordStrength")}><i className={form.passwordScore > 0 ? styles.filled : ""} /><i className={form.passwordScore > 1 ? styles.filled : ""} /><i className={form.passwordScore > 2 ? styles.filled : ""} /><i className={form.passwordScore > 3 ? styles.filled : ""} /></div></label><label><span>{t("auth.confirmPassword")}</span><input type="password" value={values.confirmPassword} onChange={form.update("confirmPassword")} autoComplete="new-password" required />{form.passwordsMismatch && <small className={styles.fieldError}>{t("auth.passwordMismatch")}</small>}</label></div>
          <fieldset className={styles.gameChoices}><legend>Favorite board games <small>(optional)</small></legend>{games.map((game) => <label key={game.id}><input type="checkbox" checked={form.favoriteGameIds.includes(game.id)} onChange={() => form.toggleFavoriteGame(game.id)} /><span>{game.title}</span></label>)}</fieldset>
          <label className={styles.terms}><input type="checkbox" required /><span>{t("auth.termsPrefix")} <a href="#terms">{t("auth.terms")}</a> {t("auth.and")} <a href="#privacy">{t("auth.privacy")}</a>.</span></label>
          <label className={styles.terms}><input type="checkbox" checked={form.rememberMe} onChange={(event) => form.setRememberMe(event.target.checked)} /><span>{t("auth.rememberMe")}</span></label>
          {form.error && <p className={styles.error} role="alert">{form.error.message}</p>}
          <button className={styles.submit} type="submit" disabled={form.isPending || form.passwordsMismatch || !form.passwordValid}>{form.isPending ? t("auth.working") : t("auth.registerAction")} <span>→</span></button>
        </form>
        <p className={styles.switch}>{t("auth.haveAccount")} <Link to="/login">{t("auth.loginAction")}</Link></p>
      </div>
    </section>
  </main>;
};
