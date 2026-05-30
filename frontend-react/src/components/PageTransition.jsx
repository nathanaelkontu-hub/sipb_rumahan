import { motion } from "framer-motion";

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        duration: 0.35,
        ease: "easeOut",
      }}
      style={{ minHeight: "100%" }}
    >
      {children}
    </motion.div>
  );
}

export default PageTransition;