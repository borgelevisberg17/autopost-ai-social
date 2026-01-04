import { Sparkles, Instagram, Twitter, Linkedin, Youtube } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="relative py-16 lg:py-20 border-t border-border/50">
      <div className="w-full edge-padding">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <Link to="/" className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl gradient-primary flex items-center justify-center shadow-soft">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-display font-bold text-xl">AutoPost</span>
              </Link>
              <p className="text-muted-foreground max-w-sm mb-6 leading-relaxed">
                Automatize seu marketing de conteúdo com IA. 
                Crie, agende e publique em todas as redes.
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors">
                  <Youtube className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-display font-semibold mb-5">Produto</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Recursos</a></li>
                <li><a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Preços</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Integrações</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Changelog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-display font-semibold mb-5">Suporte</h4>
              <ul className="space-y-3">
                <li><a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Contato</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacidade</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 AutoPost. Todos os direitos reservados.
            </p>
            <p className="text-sm text-muted-foreground">
              Feito com 💜 para criadores
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
