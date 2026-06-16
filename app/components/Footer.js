export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", padding: "24px 20px", textAlign: "center", background: "var(--bg)" }}>
      <div style={{ fontFamily: "var(--display)", fontSize: 16, marginBottom: 4 }}>Rede de Profissionais do Parque dos Sinos</div>
      <div style={{ fontSize: 11, color: "var(--grey-light)" }}>Jacareí – SP · Uma iniciativa comunitária</div>
      <div style={{ width: 40, height: 3, background: "var(--red)", margin: "12px auto 0", borderRadius: 2 }} />
    </footer>
  );
}
