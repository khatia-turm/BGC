import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import type { UserProfile } from "@entities/user/model/types";
import { useCurrentUser, useUpdateUser, useUser } from "@entities/user/api";
import { useGames } from "@entities/game/api";
import { readImageFileAsDataUrl } from "@shared/lib/imageDataUrl";
import styles from "./MePage.module.scss";

type Preferences = { favoriteGameIds: number[] };
const readPreferences = (): Preferences => {
  try {
    return JSON.parse(
      localStorage.getItem("playerPreferences") ?? "",
    ) as Preferences;
  } catch {
    return { favoriteGameIds: [] };
  }
};

export const MyProfilePage = () => {
  const { t } = useTranslation();
  const current = useCurrentUser();
  const detail = useUser(current.data?.id ?? Number.NaN);
  const games = useGames();
  if (!current.data || !detail.data)
    return <main className={styles.page}>{t("me.profile.loading")}</main>;
  return (
    <ProfileEditor
      key={"updatedAt" in detail.data ? detail.data.updatedAt : detail.data.id}
      userId={current.data.id}
      profile={detail.data}
      games={games.data ?? []}
    />
  );
};

const ProfileEditor = ({
  userId,
  profile,
  games,
}: {
  userId: number;
  profile: UserProfile;
  games: Array<{ id: number; title: string }>;
}) => {
  const updateUser = useUpdateUser();
  const { t } = useTranslation();
  const [saved, setSaved] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState(readPreferences);
  const [form, setForm] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    nickname: profile.nickname,
    phone: "phone" in profile ? profile.phone : "",
    avatarUrl: profile.avatarUrl ?? "",
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    updateUser.mutate(
      { id: userId, payload: form },
      {
        onSuccess: () => {
          localStorage.setItem(
            "playerPreferences",
            JSON.stringify(preferences),
          );
          setSaved(true);
        },
      },
    );
  };
  const chooseAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSaved(false);
    setImageError(null);
    try {
      const avatarUrl = await readImageFileAsDataUrl(file);
      setForm((current) => ({ ...current, avatarUrl }));
    } catch (error) {
      setImageError(
        error instanceof Error ? error.message : t("common.imageReadError"),
      );
    }
  };
  const toggleGame = (id: number) =>
    setPreferences((value) => ({
      ...value,
      favoriteGameIds: value.favoriteGameIds.includes(id)
        ? value.favoriteGameIds.filter((gameId) => gameId !== id)
        : [...value.favoriteGameIds, id],
    }));
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p>{t("me.profile.eyebrow")}</p>
        <h1>{t("me.profile.title")}</h1>
        <span>{t("me.profile.description")}</span>
      </header>
      <form className={styles.form} onSubmit={submit}>
        <div className={styles.profileTop}>
          <img
            className={styles.avatar}
            src={form.avatarUrl || profile.avatarUrl || ""}
            alt=""
          />
          <div>
            <strong>{form.nickname}</strong>
            <p>{profile.email}</p>
          </div>
        </div>
        <label>
          {t("auth.firstName")}
          <input
            value={form.firstName}
            onChange={(event) =>
              setForm({ ...form, firstName: event.target.value })
            }
            required
          />
        </label>
        <label>
          {t("auth.lastName")}
          <input
            value={form.lastName}
            onChange={(event) =>
              setForm({ ...form, lastName: event.target.value })
            }
            required
          />
        </label>
        <label>
          {t("auth.nickname")}
          <input
            value={form.nickname}
            onChange={(event) =>
              setForm({ ...form, nickname: event.target.value })
            }
            required
          />
        </label>
        <label>
          {t("auth.phone")}
          <input
            value={form.phone}
            onChange={(event) =>
              setForm({ ...form, phone: event.target.value })
            }
            required
          />
        </label>
        <label className={styles.wide}>
          {t("me.profile.picture")}
          <input
            type="text"
            value={form.avatarUrl}
            onChange={(event) =>
              setForm({ ...form, avatarUrl: event.target.value })
            }
            placeholder={t("common.imageUrlPlaceholder")}
          />
          <span className={styles.imageTools}>
            <label>
              {t("common.chooseImage")}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={chooseAvatar}
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setSaved(false);
                setImageError(null);
                setForm({ ...form, avatarUrl: "" });
              }}
            >
              {t("common.remove")}
            </button>
          </span>
        </label>
        {imageError && <p className={styles.error}>{imageError}</p>}
        <fieldset className={`${styles.wide} ${styles.choices}`}>
          <legend>{t("me.profile.favoriteGames")}</legend>
          {games.map((game) => (
            <label key={game.id}>
              <input
                type="checkbox"
                checked={preferences.favoriteGameIds.includes(game.id)}
                onChange={() => toggleGame(game.id)}
              />
              {game.title}
            </label>
          ))}
        </fieldset>
        {saved && <p className={styles.success}>{t("me.profile.saved")}</p>}
        <button
          className={styles.button}
          disabled={updateUser.isPending}
          type="submit"
        >
          {updateUser.isPending ? t("common.saving") : t("me.profile.save")}
        </button>
      </form>
    </main>
  );
};
