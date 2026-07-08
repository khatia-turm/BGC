import styles from "./Pagination.module.scss";
type Props = {
  page: number;
  totalPages: number;
  isPending?: boolean;
  onPageChange: (page: number) => void;
};
export const Pagination = ({
  page,
  totalPages,
  isPending = false,
  onPageChange,
}: Props) =>
  totalPages <= 1 ? null : (
    <nav className={styles.pagination} aria-label="Pagination">
      <button
        type="button"
        disabled={page <= 1 || isPending}
        onClick={() => onPageChange(page - 1)}
      >
        ← Previous
      </button>
      <span>
        Page <strong>{page}</strong> of {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages || isPending}
        onClick={() => onPageChange(page + 1)}
      >
        Next →
      </button>
    </nav>
  );
