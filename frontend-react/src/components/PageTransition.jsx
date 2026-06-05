import { motion } from "framer-motion";

// Komponen pembungkus (wrapper) untuk memberikan efek animasi transisi saat pindah halaman
function PageTransition({ children }) {
  return (
    // framer-motion akan menganimasikan elemen ini saat muncul (initial->animate) dan saat dihapus (exit)
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