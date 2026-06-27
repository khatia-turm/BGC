import logoDark from "@shared/assets/logo-dark.png";
import styles from "./Logo.module.scss";

type LogoProps = {
  className?: string;
};

export const Logo = ({ className = "" }: LogoProps) => (
  <span className={`${styles.logo} ${className}`}>
    <span className={styles.imageFrame} aria-hidden="true">
      <img className={styles.image} src={logoDark} alt="" />
    </span>
    <span className={styles.name}>MeepleHub</span>
  </span>
);
