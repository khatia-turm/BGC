import { Link, useNavigate, useParams } from "react-router-dom";
import { useClubGames } from "@entities/club/api";
import { useCreateTournament } from "@entities/tournament/api";
import { TournamentForm } from "./TournamentForm";
import styles from "./ClubAdminPages.module.scss";

export const TournamentBuilderPage = () => {
  const clubId = Number(useParams().clubId);
  const navigate = useNavigate();
  const games = useClubGames(clubId);
  const createTournament = useCreateTournament();

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p>Tournament setup</p>
          <h1>Create tournament</h1>
        </div>
        <Link
          className={styles.button}
          to={`/club-admin/${clubId}/tournaments`}
        >
          Back to tournaments
        </Link>
      </header>
      {games.isPending ? (
        <div className={styles.empty}>Loading club games...</div>
      ) : (
        <TournamentForm
          clubId={clubId}
          games={games.data ?? []}
          isPending={createTournament.isPending}
          submitLabel="Create draft"
          onSubmit={(payload) =>
            createTournament.mutate(payload, {
              onSuccess: (tournament) =>
                navigate(
                  `/club-admin/${clubId}/tournaments/${tournament.id}/edit`,
                ),
            })
          }
        />
      )}
      {createTournament.error && (
        <p className={styles.error}>{createTournament.error.message}</p>
      )}
    </main>
  );
};
