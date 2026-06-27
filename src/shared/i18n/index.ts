import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import ka from "./ka.json";

const initialLanguage = localStorage.getItem("language") ?? "ka";

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ka: { translation: ka },
  },
  lng: initialLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

document.documentElement.lang = initialLanguage;

i18n.on("languageChanged", (language) => {
  localStorage.setItem("language", language);
  document.documentElement.lang = language;
});

export default i18n;
