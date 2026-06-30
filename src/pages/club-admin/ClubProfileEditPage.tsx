import { type FormEvent,useState } from "react";
import { Link,useParams } from "react-router-dom";
import { useClub,useUpdateClub,type CreateClubPayload } from "@entities/club/api";
import styles from "./ClubSettingsPage.module.scss";

export const ClubProfileEditPage=()=>{const clubId=Number(useParams().clubId);const club=useClub(clubId);if(!club.data)return <main className={styles.page}>Loading club settings…</main>;return <Editor key={club.data.updatedAt} clubId={clubId} initial={{name:club.data.name,logoUrl:club.data.logoUrl,description:club.data.description??"",address:club.data.address,city:club.data.city,email:club.data.email??"",phone:club.data.phone??"",workingHours:club.data.workingHours??""}}/>};

const Editor=({clubId,initial}:{clubId:number;initial:CreateClubPayload})=>{
  const [form,setForm]=useState(initial);const [saved,setSaved]=useState(false);const update=useUpdateClub(clubId);
  const field=(key:keyof CreateClubPayload)=>(event:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>{setSaved(false);setForm({...form,[key]:event.target.value})};
  const submit=(event:FormEvent)=>{event.preventDefault();update.mutate(form,{onSuccess:()=>setSaved(true)})};
  return <main className={styles.page}><header><div><h1>Settings</h1><p>Manage your club’s public identity and contact information</p></div><Link to={`/clubs/${clubId}`}>View public profile ↗</Link></header>
    <form onSubmit={submit}>
      <section className={styles.section}><div className={styles.sectionHeading}><span>01</span><div><h2>Club identity</h2><p>This is how players recognize your club across MeepleHub.</p></div></div><div className={styles.identity}><div className={styles.logoPreview}>{form.logoUrl?<img src={form.logoUrl} alt="Club logo preview"/>:<span>{form.name.slice(0,2).toUpperCase()}</span>}</div><div className={styles.identityFields}><label>Club name<input value={form.name} onChange={field("name")} required/></label><label>Logo URL<input type="url" value={form.logoUrl} onChange={field("logoUrl")} placeholder="https://example.com/club-logo.png"/><small>Square images work best.</small></label></div></div><label>About the club<textarea rows={5} value={form.description} onChange={field("description")} maxLength={1000} required/><small>{form.description.length}/1000 characters</small></label></section>
      <section className={styles.section}><div className={styles.sectionHeading}><span>02</span><div><h2>Location & hours</h2><p>Help players find your tables and know when you’re open.</p></div></div><div className={styles.twoColumns}><label>City<input value={form.city} onChange={field("city")} required/></label><label>Working hours<input value={form.workingHours} onChange={field("workingHours")} placeholder="Mon–Sun 14:00–22:00" required/></label></div><label>Street address<input value={form.address} onChange={field("address")} required/></label></section>
      <section className={styles.section}><div className={styles.sectionHeading}><span>03</span><div><h2>Contact details</h2><p>Public contact information for tournament participants.</p></div></div><div className={styles.twoColumns}><label>Club email<input type="email" value={form.email} onChange={field("email")} required/></label><label>Phone number<input type="tel" value={form.phone} onChange={field("phone")} required/></label></div></section>
      <footer className={styles.saveBar}><div>{saved?<strong>✓ Changes saved</strong>:<span>Unsaved changes are not visible publicly.</span>}{update.error&&<em>{update.error.message}</em>}</div><button disabled={update.isPending}>{update.isPending?"Saving…":"Save Changes"}</button></footer>
    </form>
  </main>;
};
