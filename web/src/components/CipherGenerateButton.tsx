import { motion } from 'framer-motion';
import styles from './CipherGenerateButton.module.css';

interface CipherGenerateButtonProps {
  onClick: () => void;
}

export default function CipherGenerateButton({ onClick }: CipherGenerateButtonProps) {
  return (
    <motion.button
      className={styles.btn}
      onClick={onClick}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <span className={styles.label}>DECRYPT</span>
      <svg
        className={styles.icon}
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="5" y="11" width="14" height="10" rx="1.5" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
    </motion.button>
  );
}