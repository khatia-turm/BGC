import { type FormEvent, useState } from "react";
import type { UserProfile } from "@entities/user/model/types";
import { useCurrentUser, useUpdateUser, useUser } from "@entities/user/api";
import { useGames } from "@entities/game/api";
import styles from "./MePage.module.scss";

type Preferences = { favoriteGameIds: number[]; experienceLevel: string };
const readPreferences = (): Preferences => {
  try { return JSON.parse(localStorage.getItem("playerPreferences") ?? "") as Preferences; }
  catch { return { favoriteGameIds: [], experienceLevel: "Beginner" }; }
};

export const MyProfilePage = () => {
  const current = useCurrentUser();
  const detail = useUser(current.data?.id ?? Number.NaN);
  const games = useGames();
  if (!current.data || !detail.data) return <main className={styles.page}>Loading profile…</main>;
  return <ProfileEditor key={"updatedAt" in detail.data ? detail.data.updatedAt : detail.data.id} userId={current.data.id} profile={detail.data} games={games.data ?? []}/>;
};

const ProfileEditor = ({ userId, profile, games }: { userId:number; profile:UserProfile; games:Array<{id:number;title:string}> }) => {
  const updateUser = useUpdateUser(); const [saved,setSaved]=useState(false); const [preferences,setPreferences]=useState(readPreferences); const [form,setForm]=useState({firstName:profile.firstName,lastName:profile.lastName,nickname:profile.nickname,phone:"phone" in profile?profile.phone:"",avatarUrl:profile.avatarUrl??""});
  const submit = (event: FormEvent) => { event.preventDefault(); updateUser.mutate({ id:userId, payload:form }, { onSuccess:()=>{localStorage.setItem("playerPreferences",JSON.stringify(preferences));setSaved(true);} }); };
  const toggleGame = (id: number) => setPreferences((value) => ({ ...value, favoriteGameIds: value.favoriteGameIds.includes(id) ? value.favoriteGameIds.filter((gameId) => gameId !== id) : [...value.favoriteGameIds, id] }));
  return <main className={styles.page}><header className={styles.header}><p>Player profile</p><h1>My Profile</h1><span>Keep your identity, preferences and experience level up to date.</span></header><form className={styles.form} onSubmit={submit}>
    <div className={styles.profileTop}><img className={styles.avatar} src={form.avatarUrl || profile.avatarUrl || ""} alt=""/><div><strong>{form.nickname}</strong><p>{profile.email}</p></div></div>
    <label>First name<input value={form.firstName} onChange={(event) => setForm({ ...form, firstName:event.target.value })} required/></label><label>Last name<input value={form.lastName} onChange={(event) => setForm({ ...form, lastName:event.target.value })} required/></label><label>Nickname<input value={form.nickname} onChange={(event) => setForm({ ...form, nickname:event.target.value })} required/></label><label>Phone<input value={form.phone} onChange={(event) => setForm({ ...form, phone:event.target.value })} required/></label>
    <label className={styles.wide}>Profile picture URL<input type="url" value={form.avatarUrl} onChange={(event) => setForm({ ...form, avatarUrl:event.target.value })}/></label><label>Experience level<select value={preferences.experienceLevel} onChange={(event) => setPreferences({ ...preferences, experienceLevel:event.target.value })}><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>Competitive</option></select></label>
    <fieldset className={`${styles.wide} ${styles.choices}`}><legend>Favorite board games</legend>{games.map((game) => <label key={game.id}><input type="checkbox" checked={preferences.favoriteGameIds.includes(game.id)} onChange={() => toggleGame(game.id)}/>{game.title}</label>)}</fieldset>
    {saved && <p className={styles.success}>Profile saved successfully.</p>}<button className={styles.button} disabled={updateUser.isPending} type="submit">{updateUser.isPending ? "Saving…" : "Save profile"}</button>
  </form></main>;
};
