import { describe, it, expect } from "vitest";
import { iniciais, validarFoto, FOTO_TAMANHO_MAX } from "../avatar";

describe("iniciais", () => {
  it("usa as duas primeiras palavras", () => {
    expect(iniciais("João Silva")).toBe("JS");
  });

  it("limita a duas letras mesmo com nome longo", () => {
    expect(iniciais("Ana Paula de Souza")).toBe("AP");
  });

  it("funciona com um único nome", () => {
    expect(iniciais("Carlos")).toBe("C");
  });

  it("ignora espaços extras", () => {
    expect(iniciais("  maria   clara ")).toBe("MC");
  });

  it("retorna vazio para valor ausente", () => {
    expect(iniciais("")).toBe("");
    expect(iniciais(null)).toBe("");
    expect(iniciais(undefined)).toBe("");
  });
});

describe("validarFoto", () => {
  const arquivo = (name, size) => ({ name, size });

  it("aceita ausência de foto (campo opcional)", () => {
    expect(validarFoto(null)).toEqual({ ok: true });
  });

  it("aceita formatos válidos", () => {
    expect(validarFoto(arquivo("foto.jpg", 1000)).ok).toBe(true);
    expect(validarFoto(arquivo("foto.PNG", 1000)).ok).toBe(true);
    expect(validarFoto(arquivo("foto.webp", 1000)).ok).toBe(true);
  });

  it("rejeita formato inválido", () => {
    const r = validarFoto(arquivo("documento.pdf", 1000));
    expect(r.ok).toBe(false);
    expect(r.erro).toMatch(/Formato/);
  });

  it("rejeita arquivo acima do tamanho máximo", () => {
    const r = validarFoto(arquivo("foto.jpg", FOTO_TAMANHO_MAX + 1));
    expect(r.ok).toBe(false);
    expect(r.erro).toMatch(/grande/);
  });
});
