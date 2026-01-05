import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function EmptyState() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col items-center justify-center text-center px-4"
    >
      <motion.div 
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-secondary flex items-center justify-center mb-4"
      >
        <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
      </motion.div>
      <h3 className="font-display font-semibold text-base sm:text-lg mb-2">
        Nenhum conteúdo gerado
      </h3>
      <p className="text-muted-foreground text-sm max-w-xs">
        Preencha as configurações e clique em "Gerar" para começar.
      </p>
    </motion.div>
  );
}
