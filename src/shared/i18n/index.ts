import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import ka from "./ka.json";

const savedLanguage = localStorage.getItem("language")?.split("-")[0];
const initialLanguage = savedLanguage === "en" || savedLanguage === "ka"
  ? savedLanguage
  : "ka";

i18n.use(initReactI18next).init({
  initAsync: false,
  resources: {
    en: { translation: en },
    ka: { translation: ka },
  },
  lng: initialLanguage,
  supportedLngs: ["en", "ka"],
  load: "languageOnly",
  fallbackLng: "en",
  defaultNS: "translation",
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
