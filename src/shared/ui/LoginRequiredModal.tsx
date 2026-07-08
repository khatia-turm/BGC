import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";
import styles from "./LoginRequiredModal.module.scss";

type LoginRequiredModalProps = {
  open: boolean;
  onClose: () => void;
};

export const LoginRequiredModal = ({
  open,
  onClose,
}: LoginRequiredModalProps) => {
  const { t } = useTranslation();
  const location = useLocation();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-required-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.controls}>
          <LanguageSwitcher contained />
          <button ref={closeButtonRef} className={styles.close} type="button" onClick={onClose} aria-label={t("tournaments.closeLoginPrompt")}>
            <span aria-hidden="true" />
          </button>
        </div>
        <div className={styles.icon} aria-hidden="true">
          ♟
        </div>
        <p>{t("tournaments.loginRequiredEyebrow")}</p>
        <h2 id="login-required-title">{t("tournaments.loginRequiredTitle")}</h2>
        <span>{t("tournaments.loginRequiredCopy")}</span>
        <Link
          className={styles.cta}
          to="/login"
          state={{ from: location.pathname }}
        >
          {t("tournaments.loginRequiredCta")} <b aria-hidden="true">→</b>
        </Link>
      </section>
    </div>
  );
};
