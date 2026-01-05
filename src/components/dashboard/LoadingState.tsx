import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function LoadingState() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col items-center justify-center text-center px-4"
    >
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-6">
        {/* Outer spinning ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-4 border-primary/20"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary"
        />
        {/* Inner pulsing icon */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-3 rounded-full gradient-primary flex items-center justify-center"
        >
          <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
        </motion.div>
      </div>
      
      <h3 className="font-display font-semibold text-base sm:text-lg mb-2">
        Gerando seu conteúdo...
      </h3>
      <p className="text-muted-foreground text-sm max-w-xs mb-6">
        Nossa IA está criando um post incrível para você
      </p>
      
      {/* Animated dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            className="w-2 h-2 rounded-full bg-primary"
          />
        ))}
      </div>
    </motion.div>
  );
}
