import { createRoot } from "react-dom/client";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Missing #root element");
}

const root = createRoot(rootElement);
const requiredEnvironmentVariables = [
  ["VITE_SUPABASE_URL", import.meta.env.VITE_SUPABASE_URL],
  [
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  ],
] as const;
const missingVariables = requiredEnvironmentVariables
  .filter(([, value]) => !value?.trim())
  .map(([name]) => name);

if (missingVariables.length > 0) {
  root.render(
    <main
      role="alert"
      className="mx-auto grid min-h-screen max-w-2xl content-center gap-4 bg-[#f8f7f4] px-6 py-12 text-[#202522]"
    >
      <h1 className="text-2xl font-semibold">Configuração incompleta</h1>
      <p>
        A aplicação não foi iniciada porque faltam variáveis de configuração do
        Supabase no ambiente de produção.
      </p>
      <p className="text-sm text-[#555]">
        Configure no alojamento: {missingVariables.join(", ")}.
      </p>
    </main>,
  );
} else {
  void import("./App")
    .then(({ default: App }) => root.render(<App />))
    .catch((error: unknown) => {
      console.error("Failed to initialize the application", error);
      root.render(
        <main
          role="alert"
          className="mx-auto grid min-h-screen max-w-2xl content-center gap-4 bg-[#f8f7f4] px-6 py-12 text-[#202522]"
        >
          <h1 className="text-2xl font-semibold">Não foi possível iniciar</h1>
          <p>
            Ocorreu um erro ao carregar a aplicação. Tente atualizar a página
            ou contacte o suporte se o problema continuar.
          </p>
        </main>,
      );
    });
}
