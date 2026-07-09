import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useCreateClub,
  useMyClubRequest,
  type CreateClubPayload,
  type CreateClubResponse,
} from "@entities/club/api";
import { readImageFileAsDataUrl } from "@shared/lib/imageDataUrl";
import styles from "./ClubRegisterPage.module.scss";

const initialForm: CreateClubPayload = {
  name: "",
  logoUrl: "",
  description: "",
  address: "",
  city: "",
  email: "",
  phone: "",
  workingHours: "",
};

export const ClubRegisterPage = () => {
  const { t } = useTranslation();
  const createClub = useCreateClub();
  const request = useMyClubRequest();
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState<CreateClubResponse>();
  const [imageError, setImageError] = useState<string | null>(null);

  const update =
    (field: keyof CreateClubPayload) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [field]: event.target.value }));

  const chooseLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageError(null);
    try {
      const logoUrl = await readImageFileAsDataUrl(file);
      setForm((current) => ({
        ...current,
        logoUrl,
      }));
    } catch (error) {
      setImageError(
        error instanceof Error ? error.message : t("common.imageReadError"),
      );
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    createClub.mutate(form, { onSuccess: setResult });
  };

  const pendingRequest =
    request.data?.status === "Pending" ? request.data : undefined;

  if (result || pendingRequest)
    return (
      <main className={styles.page}>
        <section className={styles.success}>
          <span className={styles.successIcon} aria-hidden="true">
            OK
          </span>
          <p className={styles.eyebrow}>
            {t("clubRegistration.receivedEyebrow")}
          </p>
          <h1>{t("clubRegistration.receivedTitle")}</h1>
          <p>
            {result?.message ??
              t("clubRegistration.pendingMessage", {
                name: pendingRequest?.clubName,
              })}
          </p>
          <div className={styles.status}>
            <span>{t("clubRegistration.playerAccount")}</span>
            <strong>{t("clubRegistration.active")}</strong>
            <span>{t("clubRegistration.clubRequest")}</span>
            <strong>{t("clubRegistration.pending")}</strong>
          </div>
          <p className={styles.note}>{t("clubRegistration.reviewNote")}</p>
          <Link className={styles.primaryAction} to="/me/profile">
            {t("clubRegistration.backToProfile")}
          </Link>
        </section>
      </main>
    );

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{t("clubRegistration.eyebrow")}</p>
        <h1>{t("clubRegistration.title")}</h1>
        <p>{t("clubRegistration.description")}</p>
      </header>

      <div
        className={styles.flow}
        aria-label={t("clubRegistration.progressLabel")}
      >
        <span className={styles.done}>
          1 <b>{t("clubRegistration.playerAccount")}</b>
        </span>
        <i />
        <span className={styles.current}>
          2 <b>{t("clubRegistration.clubDetails")}</b>
        </span>
        <i />
        <span>
          3 <b>{t("clubRegistration.approval")}</b>
        </span>
      </div>

      <form className={styles.form} onSubmit={submit}>
        <label>
          {t("clubRegistration.clubName")}
          <input
            value={form.name}
            onChange={update("name")}
            required
            maxLength={120}
          />
        </label>
        <label>
          {t("clubs.cityLabel")}
          <input
            value={form.city}
            onChange={update("city")}
            required
            maxLength={80}
          />
        </label>
        <label className={styles.wide}>
          {t("clubs.address")}
          <input
            value={form.address}
            onChange={update("address")}
            required
            maxLength={200}
          />
        </label>
        <label>
          {t("clubs.email")}
          <input
            type="email"
            value={form.email}
            onChange={update("email")}
            required
          />
        </label>
        <label>
          {t("clubs.phone")}
          <input
            type="tel"
            value={form.phone}
            onChange={update("phone")}
            required
          />
        </label>
        <label className={styles.wide}>
          {t("clubs.hours")}
          <input
            value={form.workingHours}
            onChange={update("workingHours")}
            placeholder="Mon-Sun 14:00-22:00"
            required
          />
        </label>
        <label className={styles.wide}>
          {t("clubRegistration.clubLogo")} <small>{t("common.optional")}</small>
          <input
            type="text"
            value={form.logoUrl}
            onChange={update("logoUrl")}
            placeholder={t("common.imageUrlPlaceholder")}
          />
          <span className={styles.imageTools}>
            <label>
              {t("common.chooseImage")}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={chooseLogo}
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setImageError(null);
                setForm({ ...form, logoUrl: "" });
              }}
            >
              {t("common.remove")}
            </button>
          </span>
        </label>
        {form.logoUrl && (
          <div className={styles.logoPreview}>
            <img src={form.logoUrl} alt={t("clubRegistration.logoPreview")} />
          </div>
        )}
        {imageError && (
          <p className={styles.error} role="alert">
            {imageError}
          </p>
        )}
        <label className={styles.wide}>
          {t("clubRegistration.about")}
          <textarea
            value={form.description}
            onChange={update("description")}
            rows={5}
            required
            maxLength={1000}
          />
        </label>
        <aside className={styles.notice}>
          <strong>{t("clubRegistration.nextTitle")}</strong>
          <p>{t("clubRegistration.nextDescription")}</p>
        </aside>
        {createClub.error && (
          <p className={styles.error} role="alert">
            {createClub.error.message}
          </p>
        )}
        <button className={styles.submit} disabled={createClub.isPending}>
          {createClub.isPending
            ? t("clubRegistration.submitting")
            : t("clubRegistration.submit")}
        </button>
      </form>
    </main>
  );
};
