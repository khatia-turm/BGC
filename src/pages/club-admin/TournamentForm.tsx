import { type FormEvent, useMemo, useState } from "react";
import type { Game } from "@entities/game/model/types";
import type { TournamentPayload } from "@entities/tournament/api";
import type {
  Tournament,
  TournamentType,
} from "@entities/tournament/model/types";
import styles from "./ClubAdminPages.module.scss";

type TournamentFormProps = {
  clubId: number;
  games: Game[];
  tournament?: Tournament;
  isPending: boolean;
  submitLabel: string;
  onSubmit: (payload: TournamentPayload) => void;
};

type FormState = {
  name: string;
  description: string;
  tournamentType: TournamentType;
  registrationOpensAt: string;
  registrationClosesAt: string;
  cancellationDeadline: string;
  startsAt: string;
  endsAt: string;
  minParticipants: number;
  maxParticipants: number;
  location: string;
  entryFee: number;
  boardGameIds: number[];
};

const inHours = (hours: number) => {
  const date = new Date(Date.now() + hours * 60 * 60 * 1000);
  date.setMinutes(0, 0, 0);
  return toLocalInputValue(date.toISOString());
};

const toLocalInputValue = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const toUtcIso = (value: string) => new Date(value).toISOString();

const getInitialState = (
  clubId: number,
  tournament: Tournament | undefined,
): FormState => ({
  name: tournament?.name ?? "",
  description: tournament?.description ?? "",
  tournamentType: tournament?.tournamentType ?? 0,
  registrationOpensAt:
    toLocalInputValue(tournament?.registrationOpensAt) || inHours(24),
  registrationClosesAt:
    toLocalInputValue(tournament?.registrationClosesAt) || inHours(72),
  cancellationDeadline:
    toLocalInputValue(tournament?.cancellationDeadline) || inHours(84),
  startsAt: toLocalInputValue(tournament?.startsAt) || inHours(96),
  endsAt: toLocalInputValue(tournament?.endsAt) || inHours(100),
  minParticipants: tournament?.minParticipants ?? 4,
  maxParticipants: tournament?.maxParticipants ?? 16,
  location: tournament?.location ?? "",
  entryFee: tournament?.entryFee ?? 0,
  boardGameIds:
    tournament?.boardGames?.map((boardGame) => boardGame.boardGameId) ??
    (clubId ? [] : []),
});

export const TournamentForm = ({
  clubId,
  games,
  tournament,
  isPending,
  submitLabel,
  onSubmit,
}: TournamentFormProps) => {
  const [form, setForm] = useState<FormState>(() =>
    getInitialState(clubId, tournament),
  );
  const selectedGames = useMemo(
    () => games.filter((game) => form.boardGameIds.includes(game.id)),
    [form.boardGameIds, games],
  );

  const setValue =
    <Key extends keyof FormState>(key: Key) =>
    (value: FormState[Key]) =>
      setForm((current) => ({ ...current, [key]: value }));

  const toggleGame = (id: number) => {
    setForm((current) => ({
      ...current,
      boardGameIds: current.boardGameIds.includes(id)
        ? current.boardGameIds.filter((gameId) => gameId !== id)
        : [...current.boardGameIds, id],
    }));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({
      clubId,
      name: form.name.trim(),
      description: form.description.trim(),
      tournamentType: form.tournamentType,
      registrationOpensAt: toUtcIso(form.registrationOpensAt),
      registrationClosesAt: toUtcIso(form.registrationClosesAt),
      cancellationDeadline: toUtcIso(form.cancellationDeadline),
      startsAt: toUtcIso(form.startsAt),
      endsAt: form.endsAt ? toUtcIso(form.endsAt) : null,
      minParticipants: Number(form.minParticipants),
      maxParticipants: Number(form.maxParticipants),
      location: form.location.trim(),
      entryFee: Number(form.entryFee),
      boardGameIds: form.boardGameIds,
    });
  };

  return (
    <form className={styles.form} onSubmit={submit}>
      <label className={styles.wide}>
        <span>Name</span>
        <input
          required
          value={form.name}
          onChange={(event) => setValue("name")(event.target.value)}
        />
      </label>
      <label className={styles.wide}>
        <span>Description</span>
        <textarea
          required
          rows={4}
          value={form.description}
          onChange={(event) => setValue("description")(event.target.value)}
        />
      </label>
      <label>
        <span>Format</span>
        <select
          value={form.tournamentType}
          onChange={(event) =>
            setValue("tournamentType")(
              Number(event.target.value) as TournamentType,
            )
          }
        >
          <option value={0}>League</option>
          <option value={1}>Knockout</option>
          <option value={2}>Multi-stage</option>
        </select>
      </label>
      <label>
        <span>Location</span>
        <input
          required
          value={form.location}
          onChange={(event) => setValue("location")(event.target.value)}
        />
      </label>
      <label>
        <span>Registration opens</span>
        <input
          required
          type="datetime-local"
          value={form.registrationOpensAt}
          onChange={(event) =>
            setValue("registrationOpensAt")(event.target.value)
          }
        />
      </label>
      <label>
        <span>Registration closes</span>
        <input
          required
          type="datetime-local"
          value={form.registrationClosesAt}
          onChange={(event) =>
            setValue("registrationClosesAt")(event.target.value)
          }
        />
      </label>
      <label>
        <span>Cancellation deadline</span>
        <input
          required
          type="datetime-local"
          value={form.cancellationDeadline}
          onChange={(event) =>
            setValue("cancellationDeadline")(event.target.value)
          }
        />
      </label>
      <label>
        <span>Starts at</span>
        <input
          required
          type="datetime-local"
          value={form.startsAt}
          onChange={(event) => setValue("startsAt")(event.target.value)}
        />
      </label>
      <label>
        <span>Ends at</span>
        <input
          type="datetime-local"
          value={form.endsAt}
          onChange={(event) => setValue("endsAt")(event.target.value)}
        />
      </label>
      <label>
        <span>Minimum participants</span>
        <input
          required
          min={1}
          type="number"
          value={form.minParticipants}
          onChange={(event) =>
            setValue("minParticipants")(Number(event.target.value))
          }
        />
      </label>
      <label>
        <span>Maximum participants</span>
        <input
          required
          min={form.minParticipants}
          type="number"
          value={form.maxParticipants}
          onChange={(event) =>
            setValue("maxParticipants")(Number(event.target.value))
          }
        />
      </label>
      <label>
        <span>Entry fee</span>
        <input
          min={0}
          step="0.01"
          type="number"
          value={form.entryFee}
          onChange={(event) => setValue("entryFee")(Number(event.target.value))}
        />
      </label>
      <fieldset className={styles.wide}>
        <legend>Board games</legend>
        <div className={styles.filters}>
          {games.map((game) => (
            <button
              className={
                form.boardGameIds.includes(game.id) ? styles.button : undefined
              }
              key={game.id}
              onClick={() => toggleGame(game.id)}
              type="button"
            >
              {game.title}
            </button>
          ))}
        </div>
        {!games.length && (
          <p className={styles.error}>Add games to this club first.</p>
        )}
        {selectedGames.length > 0 && (
          <p className={styles.success}>
            Selected: {selectedGames.map((game) => game.title).join(", ")}
          </p>
        )}
      </fieldset>
      <button
        className={styles.button}
        disabled={isPending || form.boardGameIds.length === 0}
        type="submit"
      >
        {isPending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
};
