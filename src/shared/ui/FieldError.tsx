import styles from "./FieldError.module.scss";

type FieldErrorProps = {
  error?: string | string[] | null;
};

export const FieldError = ({ error }: FieldErrorProps) => {
  if (!error) return null;
  if (Array.isArray(error)) {
    const messages = error.filter(Boolean);
    if (!messages.length) return null;
    return (
      <ul className={styles.list} role="alert">
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    );
  }
  return (
    <small className={styles.error} role="alert">
      {error}
    </small>
  );
};
