"use client";
import { useEffect, useRef, useState } from "react";

// Modal de recorte/posicionamento da foto do profissional. Sem dependências:
// um <canvas> faz o recorte na confirmação. A saída é sempre um quadrado 1:1
// (a foto aparece em caixa quadrada com object-cover no catálogo e no perfil),
// exportado como JPEG ~512px para manter o upload leve.
//
// Uso: renderize sempre e controle pela prop `file` (null = fechado).
//   <CropFotoModal file={cropFile} onCancel={...} onConfirm={(blob, url) => ...} />
const SAIDA_PX = 512;
const QUALIDADE = 0.85;

export default function CropFotoModal({ file, onCancel, onConfirm }) {
  const [src, setSrc] = useState(null);
  const [box, setBox] = useState(280); // lado do quadrado de recorte (px)
  const [nat, setNat] = useState(null); // dimensões naturais { w, h }
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 }); // deslocamento do centro (px)
  const drag = useRef(null); // { px, py, ox, oy } durante o arraste
  const imgRef = useRef(null);

  // Object URL do arquivo selecionado (revogada ao trocar/fechar).
  useEffect(() => {
    if (!file) {
      setSrc(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setSrc(url);
    setNat(null);
    setZoom(1);
    setOff({ x: 0, y: 0 });
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Ajusta o lado do quadrado ao viewport (telas pequenas).
  useEffect(() => {
    const calc = () => setBox(Math.min(300, window.innerWidth - 72));
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  if (!file || !src) return null;

  // Escala "cover": a menor dimensão preenche o quadrado; o zoom multiplica.
  const s0 = nat ? box / Math.min(nat.w, nat.h) : 1;
  const s = s0 * zoom;
  const dispW = nat ? nat.w * s : box;
  const dispH = nat ? nat.h * s : box;
  const maxX = Math.max(0, (dispW - box) / 2);
  const maxY = Math.max(0, (dispH - box) / 2);

  const clamp = (v, m) => Math.max(-m, Math.min(m, v));

  function onImgLoad(e) {
    setNat({ w: e.target.naturalWidth, h: e.target.naturalHeight });
  }

  // Ao mudar o zoom, re-limita o deslocamento para a imagem seguir cobrindo
  // o quadrado (sem cantos vazios).
  function aplicarZoom(z) {
    setZoom(z);
    if (nat) {
      const ns = (box / Math.min(nat.w, nat.h)) * z;
      const mx = Math.max(0, (nat.w * ns - box) / 2);
      const my = Math.max(0, (nat.h * ns - box) / 2);
      setOff((o) => ({ x: clamp(o.x, mx), y: clamp(o.y, my) }));
    }
  }

  function onPointerDown(e) {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, ox: off.x, oy: off.y };
  }
  function onPointerMove(e) {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.px;
    const dy = e.clientY - drag.current.py;
    setOff({ x: clamp(drag.current.ox + dx, maxX), y: clamp(drag.current.oy + dy, maxY) });
  }
  function onPointerUp() {
    drag.current = null;
  }

  async function confirmar() {
    if (!imgRef.current || !nat) return;
    const canvas = document.createElement("canvas");
    canvas.width = SAIDA_PX;
    canvas.height = SAIDA_PX;
    const ctx = canvas.getContext("2d");
    // Geometria espelha a do preview: top-left da imagem no sistema do quadrado.
    const imgLeft = box / 2 + off.x - dispW / 2;
    const imgTop = box / 2 + off.y - dispH / 2;
    // Região visível (0..box) convertida para coordenadas naturais da imagem.
    const sx = (0 - imgLeft) / s;
    const sy = (0 - imgTop) / s;
    const sw = box / s;
    const sh = box / s;
    ctx.drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, SAIDA_PX, SAIDA_PX);
    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", QUALIDADE));
    if (blob) onConfirm(blob, URL.createObjectURL(blob));
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-brand-card border border-brand-border rounded-[14px] p-4 w-full max-w-[360px]">
        <h4 className="font-display text-[18px] mb-1">Ajustar foto</h4>
        <p className="text-[12px] text-brand-grey-light mb-3">
          Arraste para posicionar e use o zoom.
        </p>

        <div
          className="relative mx-auto overflow-hidden rounded-[12px] border border-brand-border bg-brand-surface touch-none select-none cursor-grab active:cursor-grabbing"
          style={{ width: box, height: box }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={src}
            alt="Pré-visualização da foto"
            onLoad={onImgLoad}
            draggable={false}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: dispW,
              height: dispH,
              maxWidth: "none",
              transform: `translate(calc(-50% + ${off.x}px), calc(-50% + ${off.y}px))`,
            }}
          />
        </div>

        <div className="flex items-center gap-2 mt-4">
          <span className="text-brand-grey-light text-[16px] leading-none">−</span>
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(e) => aplicarZoom(parseFloat(e.target.value))}
            className="flex-1 accent-brand-red"
            aria-label="Zoom da foto"
          />
          <span className="text-brand-grey-light text-[16px] leading-none">+</span>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 border border-brand-border text-brand-text rounded-lg py-2.5 text-[14px] font-bold"
          >
            Cancelar
          </button>
          <button
            onClick={confirmar}
            className="flex-1 bg-brand-red text-white rounded-lg py-2.5 text-[14px] font-bold"
          >
            Usar foto
          </button>
        </div>
      </div>
    </div>
  );
}
