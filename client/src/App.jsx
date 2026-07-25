import { useState, useRef } from "react";
import { jsPDF } from "jspdf";

const STATES = {
  IDLE: "idle",
  LOADING: "loading",
  DONE: "done",
  ERROR: "error",
};

const COLORS = {
  ink: [27, 36, 48],
  seal: [140, 47, 47],
  sealLight: [178, 84, 84],
  parchment: [242, 236, 224],
  parchmentDark: [230, 220, 200],
  line: [203, 191, 162],
  text: [43, 38, 32],
  muted: [107, 97, 82],
};

const UNICODE_REPLACEMENTS = [
  [/→/g, "->"],
  [/←/g, "<-"],
  [/↓/g, "v"],
  [/↑/g, "^"],
  [/■/g, "*"],
  [/▲/g, "^"],
  [/●/g, "-"],
  [/•/g, "-"],
  [/[""]/g, '"'],
  [/['']/g, "'"],
  [/–/g, "-"],
  [/—/g, "-"],
  [/…/g, "..."],
];

function sanitizeForPdf(str) {
  let out = UNICODE_REPLACEMENTS.reduce(
    (acc, [pattern, replacement]) => acc.replace(pattern, replacement),
    str
  );
  out = out.replace(/[^\x00-\xFF]/g, "");
  return out;
}

function isTableRowLine(line) {
  return /^\s*\|.*\|\s*$/.test(line);
}

function isSeparatorRowLine(line) {
  return /^\s*\|?[\s:-]+\|[\s:|-]+$/.test(line) && /-/.test(line);
}

function parseCells(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

function expandTables(rawLines) {
  const out = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];

    if (
      isTableRowLine(line) &&
      rawLines[i + 1] &&
      isSeparatorRowLine(rawLines[i + 1])
    ) {
      const header = parseCells(line);
      i += 2;
      const rows = [];
      while (i < rawLines.length && isTableRowLine(rawLines[i])) {
        rows.push(parseCells(rawLines[i]));
        i += 1;
      }

      rows.forEach((row) => {
        out.push(`##ROW## ${row[0] || ""}`);
        for (let c = 1; c < header.length; c += 1) {
          if (header[c] && row[c]) {
            out.push(`   - ${header[c]}: ${row[c]}`);
          }
        }
        out.push("");
      });
      continue;
    }

    out.push(line);
    i += 1;
  }

  return out;
}

function buildPdf(markdown, fileNameBase) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 56;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;
  let pageNum = 1;

  const paintPageChrome = () => {
    doc.setFillColor(...COLORS.parchment);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    doc.setDrawColor(...COLORS.seal);
    doc.setLineWidth(2);
    doc.line(margin, 40, pageWidth - margin, 40);

    doc.setFont("times", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.seal);
    doc.text("EXPEDIENTE DE CLASE", margin, 30);

    doc.setDrawColor(...COLORS.line);
    doc.setLineWidth(0.75);
    doc.line(margin, pageHeight - 36, pageWidth - margin, pageHeight - 36);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.muted);
    doc.text(fileNameBase, margin, pageHeight - 22);
    doc.text(`Pág. ${pageNum}`, pageWidth - margin, pageHeight - 22, {
      align: "right",
    });
  };

  const newPage = () => {
    doc.addPage();
    pageNum += 1;
    paintPageChrome();
    y = 68;
  };

  const ensureSpace = (lineHeight) => {
    if (y + lineHeight > pageHeight - 50) {
      newPage();
    }
  };

  // Portada
  doc.setFillColor(...COLORS.parchment);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  doc.setDrawColor(...COLORS.seal);
  doc.setLineWidth(2.5);
  doc.circle(pageWidth / 2, 190, 40, "S");
  doc.setFont("times", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.seal);
  doc.text("EXP.", pageWidth / 2, 195, { align: "center" });

  doc.setFont("times", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...COLORS.ink);
  const titleLines = doc.splitTextToSize(fileNameBase, maxWidth);
  doc.text(titleLines, pageWidth / 2, 280, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.muted);
  doc.text("Guía de aprendizaje — expediente completo", pageWidth / 2, 320, {
    align: "center",
  });

  newPage();

  const lines = expandTables(markdown.split("\n"));

  lines.forEach((rawLine) => {
    const line = sanitizeForPdf(rawLine.trimEnd());

    if (line.trim() === "```" || line.trim() === "---") {
      return;
    }

    if (!line.trim()) {
      y += 10;
      return;
    }

    let text = line;
    let fontSize = 11;
    let font = "helvetica";
    let fontStyle = "normal";
    let color = COLORS.text;
    let spacingBefore = 4;
    let isH1 = false;
    let isBullet = false;
    let isSubBullet = false;
    let isTableRow = false;
    let isRowLabel = false;

    if (line.startsWith("# ")) {
      text = line.replace(/^#\s+/, "");
      fontSize = 17;
      font = "times";
      fontStyle = "bold";
      color = COLORS.seal;
      spacingBefore = 24;
      isH1 = true;
    } else if (line.startsWith("## ")) {
      text = line.replace(/^##\s+/, "");
      fontSize = 13.5;
      font = "times";
      fontStyle = "bold";
      color = COLORS.ink;
      spacingBefore = 16;
    } else if (line.startsWith("### ")) {
      text = line.replace(/^###\s+/, "");
      fontSize = 11.5;
      fontStyle = "bold";
      color = COLORS.seal;
      spacingBefore = 12;
    } else if (/^\s*[-*]\s+/.test(line)) {
      const leadingSpaces = line.match(/^(\s*)/)[1].length;
      text = line.replace(/^\s*[-*]\s+/, "");
      isBullet = true;
      isSubBullet = leadingSpaces > 0;
      spacingBefore = 5;
    } else if (line.startsWith("##ROW## ")) {
      text = line.replace(/^##ROW##\s+/, "");
      fontSize = 11.5;
      fontStyle = "bold";
      color = COLORS.seal;
      spacingBefore = 12;
      isRowLabel = true;
    }

    text = text.replace(/\*\*(.*?)\*\*/g, "$1");

    y += spacingBefore;
    ensureSpace(fontSize * 1.6);

    if (isH1) {
      doc.setFillColor(...COLORS.seal);
      doc.rect(margin, y - 12, 26, 3, "F");
      y += 6;
    }

    if (isTableRow) {
      doc.setFillColor(...COLORS.parchmentDark);
      doc.rect(margin - 4, y - 10, maxWidth + 8, fontSize * 1.6, "F");
    }

    if (isRowLabel) {
      doc.setFillColor(...COLORS.parchmentDark);
      doc.rect(margin - 4, y - 12, maxWidth + 8, fontSize * 1.7, "F");
    }

    doc.setFont(font, fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);

    const indent = isSubBullet ? 30 : isBullet ? 16 : 0;
    const wrapWidth = maxWidth - indent;
    const wrapped = doc.splitTextToSize(text, wrapWidth);

    wrapped.forEach((w, i) => {
      ensureSpace(fontSize * 1.5);
      if (isBullet && i === 0) {
        doc.setFillColor(...COLORS.seal);
        doc.circle(margin + (isSubBullet ? 20 : 4), y - 3.5, isSubBullet ? 1.5 : 2, "F");
      }
      doc.text(w, margin + indent, y);
      y += fontSize * 1.5;
    });

    if (isH1) y += 4;
  });

  doc.save(`${fileNameBase}-resumen.pdf`);
}

export default function App() {
  const [status, setStatus] = useState(STATES.IDLE);
  const [fileName, setFileName] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".txt")) {
      setError("Sube un archivo .txt");
      setStatus(STATES.ERROR);
      return;
    }

    setStatus(STATES.LOADING);
    setError("");
    setFileName(file.name.replace(/\.txt$/i, ""));

    try {
      const transcript = await file.text();
      const API_URL = "https://resumirapp.onrender.com";

      const resp = await fetch(`${API_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Error del servidor");

      setMarkdown(data.markdown);
      if (data.truncated) {
        setError(
          "Se generó, pero pudo cortarse por límite de tokens en clases muy largas."
        );
      }
      setStatus(STATES.DONE);
    } catch (err) {
      setError(err.message || "Algo falló procesando la clase.");
      setStatus(STATES.ERROR);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  };

  const reset = () => {
    setStatus(STATES.IDLE);
    setMarkdown("");
    setError("");
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="app">
      <header className="header">
        <div className="seal">EXP.</div>
        <div>
          <h1>Expediente de Clase</h1>
          <p className="subtitle">
            Sube la transcripción. Recibe la guía de estudio en PDF.
          </p>
        </div>
      </header>

      <main className="main">
        {status !== STATES.DONE && (
          <section
            className={`dropzone ${status === STATES.LOADING ? "dropzone--busy" : ""}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => status !== STATES.LOADING && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              hidden
              onChange={(e) => handleFile(e.target.files?.[0])}
            />

            {status === STATES.IDLE && (
              <>
                <div className="dropzone__mark">Art.&nbsp;1</div>
                <p className="dropzone__title">Arrastra el .txt de la clase aquí</p>
                <p className="dropzone__hint">o haz clic para elegir el archivo</p>
              </>
            )}

            {status === STATES.LOADING && (
              <>
                <div className="stamp-spin">◆</div>
                <p className="dropzone__title">Procesando la transcripción…</p>
                <p className="dropzone__hint">
                  Extrayendo temas, artículos y anotaciones de {fileName}.txt
                </p>
              </>
            )}

            {status === STATES.ERROR && (
              <>
                <div className="dropzone__mark dropzone__mark--error">✕</div>
                <p className="dropzone__title">{error}</p>
                <p className="dropzone__hint">Haz clic para intentar de nuevo</p>
              </>
            )}
          </section>
        )}

        {status === STATES.DONE && (
          <section className="result">
            <div className="result__badge">EXPEDIENTE COMPLETO</div>
            <h2>{fileName}</h2>
            <p className="result__meta">
              Guía generada — cobertura total de temas, artículos y leyes mencionadas.
            </p>

            {error && <p className="result__warning">{error}</p>}

            <div className="result__actions">
              <button
                className="btn btn--primary"
                onClick={() => buildPdf(markdown, fileName || "clase")}
              >
                Descargar PDF
              </button>
              <button className="btn btn--ghost" onClick={reset}>
                Procesar otra clase
              </button>
            </div>

            <pre className="preview">{markdown}</pre>
          </section>
        )}
      </main>
    </div>
  );
}