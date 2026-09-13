import { motion } from 'framer-motion';
import styles from './CipherRefreshButton.module.css';

interface CipherRefreshButtonProps {
  onClick: () => void;
}

export default function CipherRefreshButton({ onClick }: CipherRefreshButtonProps) {
  return (
    <motion.button
      className={styles.btn}
      onClick={onClick}
      title="Regenerate"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <motion.svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        whileHover={{ rotate: -90 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" />
        <path d="M3 21v-5h5" />
      </motion.svg>
    </motion.button>
  );
}
