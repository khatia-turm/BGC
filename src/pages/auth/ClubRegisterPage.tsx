import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
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
        error instanceof Error ? error.message : "Could not read this image.",
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
          <p className={styles.eyebrow}>Application received</p>
          <h1>Your club request is waiting for approval</h1>
          <p>
            {result?.message ??
              `${pendingRequest?.clubName} was submitted and is awaiting administrator review.`}
          </p>
          <div className={styles.status}>
            <span>Player account</span>
            <strong>Active</strong>
            <span>Club request</span>
            <strong>Pending</strong>
          </div>
          <p className={styles.note}>
            You can keep using MeepleHub as a player while the platform team
            reviews your request. If it is rejected, your player account will
            stay active.
          </p>
          <Link className={styles.primaryAction} to="/me/profile">
            Back to my profile
          </Link>
        </section>
      </main>
    );

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>For community organizers</p>
        <h1>Register your club</h1>
        <p>
          Tell us about your venue. Your application will be reviewed before the
          club becomes public.
        </p>
      </header>

      <div className={styles.flow} aria-label="Club registration progress">
        <span className={styles.done}>
          1 <b>Player account</b>
        </span>
        <i />
        <span className={styles.current}>
          2 <b>Club details</b>
        </span>
        <i />
        <span>
          3 <b>Approval</b>
        </span>
      </div>

      <form className={styles.form} onSubmit={submit}>
        <label>
          Club name
          <input
            value={form.name}
            onChange={update("name")}
            required
            maxLength={120}
          />
        </label>
        <label>
          City
          <input
            value={form.city}
            onChange={update("city")}
            required
            maxLength={80}
          />
        </label>
        <label className={styles.wide}>
          Address
          <input
            value={form.address}
            onChange={update("address")}
            required
            maxLength={200}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={update("email")}
            required
          />
        </label>
        <label>
          Phone
          <input
            type="tel"
            value={form.phone}
            onChange={update("phone")}
            required
          />
        </label>
        <label className={styles.wide}>
          Working hours
          <input
            value={form.workingHours}
            onChange={update("workingHours")}
            placeholder="Mon-Sun 14:00-22:00"
            required
          />
        </label>
        <label className={styles.wide}>
          Club logo <small>Optional</small>
          <input
            type="text"
            value={form.logoUrl}
            onChange={update("logoUrl")}
            placeholder="Paste an image URL or choose a file below"
          />
          <span className={styles.imageTools}>
            <label>
              Choose image
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
              Remove
            </button>
          </span>
        </label>
        {form.logoUrl && (
          <div className={styles.logoPreview}>
            <img src={form.logoUrl} alt="Club logo preview" />
          </div>
        )}
        {imageError && (
          <p className={styles.error} role="alert">
            {imageError}
          </p>
        )}
        <label className={styles.wide}>
          About the club
          <textarea
            value={form.description}
            onChange={update("description")}
            rows={5}
            required
            maxLength={1000}
          />
        </label>
        <aside className={styles.notice}>
          <strong>What happens next?</strong>
          <p>
            The platform administrator reviews this request. You become the club
            administrator only after approval; until then, your player access is
            unchanged.
          </p>
        </aside>
        {createClub.error && (
          <p className={styles.error} role="alert">
            {createClub.error.message}
          </p>
        )}
        <button className={styles.submit} disabled={createClub.isPending}>
          {createClub.isPending ? "Submitting..." : "Submit club for approval"}
        </button>
      </form>
    </main>
  );
};
