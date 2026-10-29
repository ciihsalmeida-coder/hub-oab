import { dias } from "@/data/programacao";
import { exigirEquipe } from "@/lib/equipe";
import { Resumo } from "./Resumo";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export default async function ResumoDoDia() {
  const { db } = await exigirEquipe();
  const { data } = await db.from("resumos_dia").select("dia, texto, gerado_em");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">Resumo do dia</h1>
        <p className="mt-1 text-muted">
          A IA junta os painéis do dia num texto para a comissão organizadora. Revise e envie pelo WhatsApp no fim de cada dia.
        </p>
      </div>
      {dias.map((d) => {
        const salvo = data?.find((r) => r.dia === d.data);
        return <Resumo key={d.data} dia={d.data} rotulo={d.rotulo} texto={salvo?.texto ?? ""} geradoEm={salvo?.gerado_em ?? null} />;
      })}
    </div>
  );
}
