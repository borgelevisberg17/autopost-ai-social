import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ExternalLink,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Layers,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { SECTION_LABELS, type SectionId, type StoreTheme } from "@/lib/storeTheme";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export type EditorNodeId = "announcement" | "brand" | SectionId | "footer";

interface SectionInspectorProps {
  selected: EditorNodeId;
  theme: StoreTheme;
  onChange: (next: StoreTheme) => void;
  canToggleSections: boolean;
  companyName: string;
  productImages?: string[];
}

const CURATED_IMAGES = [
  {
    label: "Minimalista",
    url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=80",
  },
  {
    label: "Luxo Interiores",
    url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=80",
  },
  {
    label: "Moda & Atelier",
    url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=80",
  },
  {
    label: "Streetwear",
    url: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1400&q=80",
  },
  {
    label: "Tecnologia",
    url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1400&q=80",
  },
  {
    label: "Orgânico",
    url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=80",
  },
];

const NODE_META: Record<EditorNodeId, { title: string; subtitle: string }> = {
  announcement: {
    title: "Barra de Anúncios",
    subtitle: "Faixa superior para promoções, envios e avisos.",
  },
  brand: {
    title: "Cabeçalho & Marca",
    subtitle: "Logótipo e nome exibido na barra de navegação.",
  },
  hero: {
    title: SECTION_LABELS.hero,
    subtitle: "Primeira secção visível da loja com imagem e chamada à ação.",
  },
  categories: {
    title: SECTION_LABELS.categories,
    subtitle: "Carrossel horizontal gerado automaticamente das categorias dos produtos.",
  },
  products: {
    title: SECTION_LABELS.products,
    subtitle: "Grelha de produtos com pesquisa, filtros e carrinho instantâneo.",
  },
  banner: {
    title: SECTION_LABELS.banner,
    subtitle: "Bloco editorial de destaque para campanhas ou história da marca.",
  },
  testimonials: {
    title: SECTION_LABELS.testimonials,
    subtitle: "Avaliações reais de clientes para aumentar a confiança na compra.",
  },
  text: {
    title: SECTION_LABELS.text,
    subtitle: "Bloco de texto livre para políticas, história ou diferenciais.",
  },
  newsletter: {
    title: SECTION_LABELS.newsletter,
    subtitle: "Formulário de captação de e-mails ligado à sua lista de clientes.",
  },
  faq: {
    title: SECTION_LABELS.faq,
    subtitle: "Perguntas frequentes sobre envios, trocas e pagamentos.",
  },
  footer: {
    title: "Rodapé & Redes",
    subtitle: "Descrição da loja e links das redes sociais no fundo da página.",
  },
};

function ImageUrlInput({
  label,
  value,
  onChange,
  productImages = [],
  placeholder = "https://...",
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  productImages?: string[];
  placeholder?: string;
}) {
  const [broken, setBroken] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const validHttps = !value || value.startsWith("https://");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-semibold text-slate-700">{label}</label>
        <div className="flex items-center gap-2">
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-[10px] font-medium text-slate-400 hover:text-rose-600 flex items-center gap-0.5"
            >
              <X className="h-3 w-3" /> Limpar
            </button>
          )}
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-800"
          >
            {pickerOpen ? "Fechar galeria" : "Escolher imagem"}
          </button>
        </div>
      </div>

      <Input
        value={value}
        onChange={(e) => {
          setBroken(false);
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        className="h-9 text-xs font-mono"
      />

      {!validHttps && (
        <p className="text-[11px] text-rose-600">
          Use um link externo seguro iniciado por https://
        </p>
      )}

      {pickerOpen && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 space-y-2.5">
          {productImages.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Dos seus produtos
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {productImages.slice(0, 8).map((imgUrl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setBroken(false);
                      onChange(imgUrl);
                      setPickerOpen(false);
                    }}
                    className="overflow-hidden rounded-lg border border-slate-200 bg-white aspect-square hover:ring-2 hover:ring-slate-900 transition"
                  >
                    <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Galeria curada
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {CURATED_IMAGES.map((item) => (
                <button
                  key={item.url}
                  type="button"
                  onClick={() => {
                    setBroken(false);
                    onChange(item.url);
                    setPickerOpen(false);
                  }}
                  className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white aspect-[16/10] hover:ring-2 hover:ring-slate-900 transition"
                >
                  <img src={item.url} alt={item.label} className="h-full w-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-[9px] font-medium text-white truncate">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {value && validHttps && !broken ? (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 aspect-[16/9]">
          <img
            src={value}
            alt="Pré-visualização"
            onError={() => setBroken(true)}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] text-slate-400">
          <ImageIcon className="h-4 w-4 shrink-0" />
          <span>{broken ? "Não foi possível carregar a imagem." : "Cole um link https:// ou escolha na galeria"}</span>
        </div>
      )}
    </div>
  );
}

export function SectionInspector({
  selected,
  theme,
  onChange,
  canToggleSections,
  companyName,
  productImages = [],
}: SectionInspectorProps) {
  const meta = NODE_META[selected];
  const isPageSection = (id: EditorNodeId): id is SectionId =>
    id !== "announcement" && id !== "brand" && id !== "footer";

  const sectionState = isPageSection(selected)
    ? theme.sections?.find((s) => s.id === selected)
    : null;

  const toggleSectionVisibility = (visible: boolean) => {
    if (!isPageSection(selected)) return;
    const sections = (theme.sections ?? []).map((s) =>
      s.id === selected ? { ...s, visible } : s
    );
    onChange({ ...theme, sections });
  };

  return (
    <div className="space-y-5 pb-8">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{meta.title}</h3>
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
              {meta.subtitle}
            </p>
          </div>
          {sectionState && (
            <button
              type="button"
              disabled={!canToggleSections}
              onClick={() => toggleSectionVisibility(!sectionState.visible)}
              title={
                canToggleSections
                  ? sectionState.visible
                    ? "Ocultar secção"
                    : "Mostrar secção"
                  : "Disponível no plano Pro"
              }
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              {sectionState.visible ? (
                <Eye className="h-4 w-4 text-emerald-600" />
              ) : (
                <EyeOff className="h-4 w-4 text-slate-400" />
              )}
            </button>
          )}
        </div>
      </div>

      {selected === "announcement" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
            <div>
              <p className="text-xs font-semibold text-slate-900">Mostrar barra</p>
              <p className="text-[11px] text-slate-500">Exibir no topo da loja</p>
            </div>
            <Switch
              checked={theme.announcement.enabled}
              onCheckedChange={(enabled) =>
                onChange({
                  ...theme,
                  announcement: { ...theme.announcement, enabled },
                })
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-700">
              Texto do anúncio
            </label>
            <Input
              value={theme.announcement.text}
              maxLength={160}
              onChange={(e) =>
                onChange({
                  ...theme,
                  announcement: { ...theme.announcement, text: e.target.value },
                })
              }
              placeholder="Entrega rápida · Compra segura e confiável"
              className="h-9 text-xs"
            />
            <p className="mt-1 text-right text-[10px] text-slate-400">
              {theme.announcement.text.length}/160
            </p>
          </div>
        </div>
      )}

      {selected === "brand" && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-700">
              Nome exibido na loja
            </label>
            <Input
              value={theme.brand.displayName}
              maxLength={80}
              onChange={(e) =>
                onChange({
                  ...theme,
                  brand: { ...theme.brand, displayName: e.target.value },
                })
              }
              placeholder={companyName}
              className="h-9 text-xs"
            />
          </div>
          <ImageUrlInput
            label="Logótipo (URL https://)"
            value={theme.brand.logoUrl}
            productImages={productImages}
            onChange={(logoUrl) =>
              onChange({
                ...theme,
                brand: { ...theme.brand, logoUrl },
              })
            }
          />
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-700">
              Tagline da marca
            </label>
            <Input
              value={theme.brand.tagline}
              maxLength={140}
              onChange={(e) =>
                onChange({
                  ...theme,
                  brand: { ...theme.brand, tagline: e.target.value },
                })
              }
              placeholder="Qualidade e confiança em cada entrega"
              className="h-9 text-xs"
            />
          </div>
        </div>
      )}

      {selected === "hero" && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-700">
              Etiqueta superior (Eyebrow)
            </label>
            <Input
              value={theme.hero.eyebrow}
              maxLength={60}
              onChange={(e) =>
                onChange({
                  ...theme,
                  hero: { ...theme.hero, eyebrow: e.target.value },
                })
              }
              placeholder={companyName}
              className="h-9 text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-700">
              Título principal
            </label>
            <Input
              value={theme.hero.title}
              maxLength={80}
              onChange={(e) =>
                onChange({
                  ...theme,
                  hero: { ...theme.hero, title: e.target.value },
                })
              }
              placeholder="Produtos que fazem sentido"
              className="h-9 text-xs"
            />
            <p className="mt-1 text-right text-[10px] text-slate-400">
              {theme.hero.title.length}/80
            </p>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-700">
              Subtítulo
            </label>
            <Textarea
              value={theme.hero.subtitle}
              maxLength={240}
              rows={3}
              onChange={(e) =>
                onChange({
                  ...theme,
                  hero: { ...theme.hero, subtitle: e.target.value },
                })
              }
              placeholder="Estilo, qualidade e escolhas feitas para si."
              className="text-xs resize-none"
            />
            <p className="mt-1 text-right text-[10px] text-slate-400">
              {theme.hero.subtitle.length}/240
            </p>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-700">
              Texto do botão (CTA)
            </label>
            <Input
              value={theme.hero.cta}
              maxLength={40}
              onChange={(e) =>
                onChange({
                  ...theme,
                  hero: { ...theme.hero, cta: e.target.value },
                })
              }
              placeholder="Explorar produtos"
              className="h-9 text-xs"
            />
          </div>
          <ImageUrlInput
            label="Imagem do banner (URL https://)"
            value={theme.hero.imageUrl}
            productImages={productImages}
            onChange={(imageUrl) =>
              onChange({
                ...theme,
                hero: { ...theme.hero, imageUrl },
              })
            }
          />
        </div>
      )}

      {selected === "banner" && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-700">
              Título da promoção
            </label>
            <Input
              value={theme.banner.title}
              maxLength={80}
              onChange={(e) =>
                onChange({
                  ...theme,
                  banner: { ...theme.banner, title: e.target.value },
                })
              }
              className="h-9 text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-700">
              Subtítulo
            </label>
            <Textarea
              value={theme.banner.subtitle}
              maxLength={200}
              rows={3}
              onChange={(e) =>
                onChange({
                  ...theme,
                  banner: { ...theme.banner, subtitle: e.target.value },
                })
              }
              className="text-xs resize-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-700">
              Botão
            </label>
            <Input
              value={theme.banner.cta}
              maxLength={40}
              onChange={(e) =>
                onChange({
                  ...theme,
                  banner: { ...theme.banner, cta: e.target.value },
                })
              }
              className="h-9 text-xs"
            />
          </div>
          <ImageUrlInput
            label="Imagem promocional (URL https://)"
            value={theme.banner.imageUrl}
            productImages={productImages}
            onChange={(imageUrl) =>
              onChange({
                ...theme,
                banner: { ...theme.banner, imageUrl },
              })
            }
          />
        </div>
      )}

      {selected === "testimonials" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">
              {theme.testimonials.length}/8 testemunhos
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={theme.testimonials.length >= 8}
              onClick={() =>
                onChange({
                  ...theme,
                  testimonials: [
                    ...theme.testimonials,
                    { name: "Cliente verificado", quote: "Entrega rápida e excelente qualidade!" },
                  ],
                })
              }
              className="h-7 text-[11px]"
            >
              <Plus className="mr-1 h-3 w-3" /> Adicionar
            </Button>
          </div>
          {theme.testimonials.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
              Adicione avaliações de clientes para exibir esta secção na loja.
            </div>
          ) : (
            <div className="space-y-3">
              {theme.testimonials.map((item, idx) => (
                <div
                  key={idx}
                  className="space-y-2 rounded-xl border border-slate-200 bg-white p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Testemunho #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          ...theme,
                          testimonials: theme.testimonials.filter((_, i) => i !== idx),
                        })
                      }
                      className="text-slate-400 hover:text-rose-600"
                      aria-label="Remover testemunho"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <Input
                    value={item.name}
                    maxLength={60}
                    onChange={(e) => {
                      const next = [...theme.testimonials];
                      next[idx] = { ...item, name: e.target.value };
                      onChange({ ...theme, testimonials: next });
                    }}
                    placeholder="Nome do cliente"
                    className="h-8 text-xs"
                  />
                  <Textarea
                    value={item.quote}
                    maxLength={280}
                    rows={2}
                    onChange={(e) => {
                      const next = [...theme.testimonials];
                      next[idx] = { ...item, quote: e.target.value };
                      onChange({ ...theme, testimonials: next });
                    }}
                    placeholder="Comentário do cliente..."
                    className="text-xs resize-none"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selected === "text" && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-700">
              Título do bloco
            </label>
            <Input
              value={theme.textBlock.title}
              maxLength={80}
              onChange={(e) =>
                onChange({
                  ...theme,
                  textBlock: { ...theme.textBlock, title: e.target.value },
                })
              }
              className="h-9 text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-700">
              Conteúdo
            </label>
            <Textarea
              value={theme.textBlock.body}
              maxLength={1500}
              rows={6}
              onChange={(e) =>
                onChange({
                  ...theme,
                  textBlock: { ...theme.textBlock, body: e.target.value },
                })
              }
              placeholder="Conte a história da sua marca ou explique os seus prazos de entrega..."
              className="text-xs"
            />
          </div>
        </div>
      )}

      {(selected === "categories" ||
        selected === "products" ||
        selected === "newsletter" ||
        selected === "faq") && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <Layers className="h-4 w-4 text-emerald-600" />
            Secção dinâmica da loja
          </div>
          <p>
            Esta secção sincroniza automaticamente com o seu catálogo e configurações da empresa.
            Arraste na árvore à esquerda para alterar a ordem ou clique no ícone de olho para ocultar.
          </p>
          {(selected === "categories" || selected === "products") && (
            <Link
              to="/admin/produtos"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-800 hover:bg-slate-100 transition"
            >
              Gerir produtos do catálogo <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
      )}

      {selected === "footer" && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-700">
              Sobre a loja no rodapé
            </label>
            <Textarea
              value={theme.footer.about}
              maxLength={400}
              rows={3}
              onChange={(e) =>
                onChange({
                  ...theme,
                  footer: { ...theme.footer, about: e.target.value },
                })
              }
              placeholder="Descrição curta exibida no rodapé da loja..."
              className="text-xs resize-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-700">
              Instagram (URL https://)
            </label>
            <Input
              value={theme.footer.instagram}
              onChange={(e) =>
                onChange({
                  ...theme,
                  footer: { ...theme.footer, instagram: e.target.value },
                })
              }
              placeholder="https://instagram.com/sua_loja"
              className="h-9 text-xs font-mono"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-700">
              Facebook (URL https://)
            </label>
            <Input
              value={theme.footer.facebook}
              onChange={(e) =>
                onChange({
                  ...theme,
                  footer: { ...theme.footer, facebook: e.target.value },
                })
              }
              placeholder="https://facebook.com/sua_loja"
              className="h-9 text-xs font-mono"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-700">
              TikTok (URL https://)
            </label>
            <Input
              value={theme.footer.tiktok}
              onChange={(e) =>
                onChange({
                  ...theme,
                  footer: { ...theme.footer, tiktok: e.target.value },
                })
              }
              placeholder="https://tiktok.com/@sua_loja"
              className="h-9 text-xs font-mono"
            />
          </div>
        </div>
      )}
    </div>
  );
}
