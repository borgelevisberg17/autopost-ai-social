import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Store, Package, Bot, BarChart3, ShieldCheck, MessageCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const features = [
  { icon: Package, title: "Stock centralizado", text: "Um único stock para website, Instagram, Facebook e WhatsApp. Vendeu num canal, atualiza em todos." },
  { icon: Store, title: "Loja pública", text: "Catálogo com preços, promoções, stock em tempo real, carrinho e acompanhamento do pedido." },
  { icon: Bot, title: "Agente de marketing", text: "Cria textos diferentes para cada rede a partir dos seus produtos reais — nunca inventa preços." },
  { icon: ShieldCheck, title: "Agentes controlados", text: "Antes de publicar: o produto existe? Tem stock? O preço é válido? Tudo fica registado." },
  { icon: BarChart3, title: "Painel de vendas", text: "Receita, pedidos, mais vendidos e alertas de stock baixo." },
  { icon: MessageCircle, title: "Várias empresas", text: "Cada empresa com o seu catálogo, moeda, equipa e dados isolados." },
];

export default function Index() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 inset-x-0 z-40 glass border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-primary grid place-items-center"><Store className="w-5 h-5 text-primary-foreground" /></div>
            <span className="font-display font-bold text-xl">Vendora</span>
          </Link>
          <div className="flex gap-2">
            {user ? <Button asChild><Link to="/dashboard">Abrir painel</Link></Button> : <>
              <Button variant="ghost" asChild><Link to="/login">Entrar</Link></Button>
              <Button asChild><Link to="/signup">Começar</Link></Button>
            </>}
          </div>
        </div>
      </header>

      <section className="pt-36 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-20 blur-3xl" />
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="inline-block rounded-full border border-border px-4 py-1 text-sm text-muted-foreground mb-6">Comércio omnichannel com agentes de IA</p>
          <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight mb-6">
            As suas redes sociais a <span className="gradient-text">vender</span>, com base nos dados reais do negócio
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">Catálogo, stock, pedidos e marketing automático num só sistema. Os agentes consultam os seus produtos antes de escrever qualquer coisa.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild><Link to={user ? "/dashboard" : "/signup"}>Criar a minha loja <ArrowRight className="w-4 h-4" /></Link></Button>
          </div>
        </div>
      </section>

      <section className="px-4 pb-24">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="glass-card rounded-2xl p-6">
              <f.icon className="w-6 h-6 text-primary mb-4" />
              <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">© {new Date().getFullYear()} Vendora</footer>
    </div>
  );
}
