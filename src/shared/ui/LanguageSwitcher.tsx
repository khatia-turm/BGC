import { useTranslation } from "react-i18next";
import styles from "./LanguageSwitcher.module.scss";

const languages = [
  { code: "ka", label: "ქარ", name: "ქართული" },
  { code: "en", label: "EN", name: "English" },
] as const;

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.resolvedLanguage?.split("-")[0] ?? "ka";

  return (
    <div className={styles.switcher} role="group" aria-label="Language / ენა">
      {languages.map((language) => {
        const isActive = currentLanguage === language.code;

        return (
          <button
            className={`${styles.option} ${isActive ? styles.active : ""}`}
            type="button"
            key={language.code}
            aria-label={language.name}
            aria-pressed={isActive}
            onClick={() => void i18n.changeLanguage(language.code)}
          >
            {language.label}
          </button>
        );
      })}
    </div>
  );
};
