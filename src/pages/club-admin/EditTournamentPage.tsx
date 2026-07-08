import { Link, useNavigate, useParams } from "react-router-dom";
import { useClubGames } from "@entities/club/api";
import { useTournament, useUpdateTournament } from "@entities/tournament/api";
import { TournamentForm } from "./TournamentForm";
import styles from "./ClubAdminPages.module.scss";

export const EditTournamentPage = () => {
  const clubId = Number(useParams().clubId);
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const games = useClubGames(clubId);
  const tournament = useTournament(id);
  const updateTournament = useUpdateTournament(id);

  if (tournament.isPending)
    return <main className={styles.page}>Loading tournament...</main>;
  if (!tournament.data)
    return <main className={styles.page}>Tournament not found.</main>;

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p>Tournament setup</p>
          <h1>Edit tournament</h1>
        </div>
        <Link className={styles.button} to={`/club-admin/${clubId}/tournaments`}>
          Back to tournaments
        </Link>
      </header>
      <TournamentForm
        clubId={clubId}
        games={games.data ?? []}
        tournament={tournament.data}
        isPending={updateTournament.isPending}
        submitLabel="Save changes"
        onSubmit={({ clubId: _clubId, ...payload }) =>
          updateTournament.mutate(payload, {
            onSuccess: () => navigate(`/club-admin/${clubId}/tournaments`),
          })
        }
      />
      {updateTournament.error && (
        <p className={styles.error}>{updateTournament.error.message}</p>
      )}
    </main>
  );
};
