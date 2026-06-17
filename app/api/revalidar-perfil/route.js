// Revalidação sob demanda do perfil público (ISR). Chamado após o dono salvar
// uma edição no /painel, para que /profissional/[id] reflita a mudança na hora
// em vez de esperar o revalidate de 60s.
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request) {
  const { id } = await request.json().catch(() => ({}));
  if (!id || typeof id !== "string") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  revalidatePath(`/profissional/${id}`);
  return NextResponse.json({ ok: true });
}
