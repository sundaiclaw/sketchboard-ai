import { useEffect, useMemo, useState } from 'react';
import JSZip from 'jszip';

const SAMPLE_ZIP_URL = '/sample';
const ACCEPTED = '.zip,.png,.jpg,.jpeg,.webp';

function summarizeInk(data) {
  const elements = Array.isArray(data?.elements) ? data.elements : [];
  const strokes = [];

  elements.forEach((element) => {
    (element.strokes || []).forEach((stroke) => {
      const points = stroke?.inputs?.inputs || [];
      if (!points.length) return;
      const xs = points.map((p) => p.x);
      const ys = points.map((p) => p.y);
      strokes.push({
        points: points.length,
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
      });
    });
  });

  const shapes = strokes
    .map((stroke, index) => {
      const width = Math.round(stroke.maxX - stroke.minX);
      const height = Math.round(stroke.maxY - stroke.minY);
      const ratio = height === 0 ? 99 : width / height;
      let kind = 'line';
      if (ratio > 0.7 && ratio < 1.3 && width > 60 && height > 60) kind = 'circle-or-square';
      else if (width > 90 && height > 90) kind = 'panel';
      else if (width > 130 && height < 40) kind = 'header-line';
      return {
        id: index + 1,
        kind,
        x: Math.round(stroke.minX),
        y: Math.round(stroke.minY),
        width,
        height,
        points: stroke.points,
      };
    })
    .sort((a, b) => a.y - b.y || a.x - b.x);

  const bounds = shapes.reduce(
    (acc, shape) => ({
      minX: Math.min(acc.minX, shape.x),
      minY: Math.min(acc.minY, shape.y),
      maxX: Math.max(acc.maxX, shape.x + shape.width),
      maxY: Math.max(acc.maxY, shape.y + shape.height),
    }),
    { minX: Infinity, minY: Infinity, maxX: 0, maxY: 0 },
  );

  return {
    elementCount: elements.length,
    strokeCount: strokes.length,
    inferredShapes: shapes.slice(0, 12),
    canvasBounds:
      Number.isFinite(bounds.minX)
        ? {
            width: Math.round(bounds.maxX - bounds.minX),
            height: Math.round(bounds.maxY - bounds.minY),
          }
        : null,
  };
}

async function readZip(file) {
  const zip = await JSZip.loadAsync(file);
  const files = Object.keys(zip.files);
  const dataEntry = files.find((name) => name.endsWith('data.json'));
  const canvasEntry = files.find((name) => name.endsWith('canvas.png'));
  const data = dataEntry ? JSON.parse(await zip.file(dataEntry).async('text')) : null;
  const canvasDataUrl = canvasEntry
    ? `data:image/png;base64,${await zip.file(canvasEntry).async('base64')}`
    : null;

  return {
    kind: 'zip',
    data,
    canvasDataUrl,
    summary: data ? summarizeInk(data) : null,
    fileNames: files,
  };
}

async function readImage(file) {
  return {
    kind: 'image',
    data: null,
    canvasDataUrl: await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    }),
    summary: null,
    fileNames: [file.name],
  };
}

function App() {
  const [sketch, setSketch] = useState(null);
  const [notes, setNotes] = useState('A clean landing page or dashboard with a round focal element above two content cards.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [dataResp, imageResp] = await Promise.all([
        fetch(`${SAMPLE_ZIP_URL}/data.json`),
        fetch(`${SAMPLE_ZIP_URL}/canvas.png`),
      ]);
      const data = await dataResp.json();
      const imageBlob = await imageResp.blob();
      if (cancelled) return;
      setSketch({
        kind: 'sample',
        data,
        canvasDataUrl: URL.createObjectURL(imageBlob),
        summary: summarizeInk(data),
        fileNames: ['sample/data.json', 'sample/canvas.png'],
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const structuralSummary = useMemo(() => {
    if (!sketch?.summary) return 'Image-only upload. Use notes to describe intent.';
    const shapes = sketch.summary.inferredShapes
      .slice(0, 6)
      .map((shape) => `${shape.kind} at (${shape.x},${shape.y}) size ${shape.width}x${shape.height}`)
      .join('; ');
    return `${sketch.summary.strokeCount} strokes, ${sketch.summary.elementCount} elements. ${shapes}`;
  }, [sketch]);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setResult(null);
    try {
      const parsed = file.name.endsWith('.zip') ? await readZip(file) : await readImage(file);
      setSketch(parsed);
    } catch (err) {
      setError(err.message || 'Could not read this sketch file.');
    }
  }

  async function analyze() {
    if (!sketch) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/analyze-sketch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes,
          fileNames: sketch.fileNames,
          structuralSummary,
          summary: sketch.summary,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Analysis failed.');
      setResult(json.result);
    } catch (err) {
      setError(err.message || 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Sketch to product concept</p>
          <h1>Sketchboard AI</h1>
          <p className="lede">
            Upload a rough wireframe export and turn it into a product concept, launch copy, UI breakdown,
            and live mock preview.
          </p>
        </div>
        <button className="primary" onClick={analyze} disabled={!sketch || loading}>
          {loading ? 'Analyzing sketch…' : 'Analyze with AI'}
        </button>
      </section>

      <section className="grid two-up">
        <div className="panel">
          <h2>1. Load a sketch</h2>
          <label className="upload">
            <input type="file" accept={ACCEPTED} onChange={handleFile} />
            <span>Upload zip or image</span>
          </label>
          <p className="muted">A built-in sample is already loaded from your uploaded sketch export.</p>
          {sketch?.canvasDataUrl ? <img className="canvas-preview" src={sketch.canvasDataUrl} alt="Sketch preview" /> : null}
        </div>

        <div className="panel">
          <h2>2. Refine the intent</h2>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={7} />
          <div className="summary-box">
            <strong>Detected structure</strong>
            <p>{structuralSummary}</p>
          </div>
          <div className="chips">
            {(sketch?.fileNames || []).slice(0, 6).map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      {error ? <div className="error">{error}</div> : null}

      <section className="grid results-grid">
        <div className="panel tall">
          <h2>3. AI interpretation</h2>
          {result ? (
            <>
              <div className="result-head">
                <div>
                  <p className="eyebrow">{result.audience}</p>
                  <h3>{result.productName}</h3>
                </div>
                <span className="badge">{result.category}</span>
              </div>
              <p>{result.summary}</p>
              <div className="copy-block">
                <h4>Hero copy</h4>
                <p><strong>{result.hero.headline}</strong></p>
                <p>{result.hero.subheadline}</p>
                <p className="muted">CTA: {result.hero.cta}</p>
              </div>
              <div className="lists two-up-mini">
                <div>
                  <h4>Core features</h4>
                  <ul>{result.features.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
                <div>
                  <h4>Components</h4>
                  <ul>{result.components.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              </div>
            </>
          ) : (
            <p className="muted">Run the AI step to get a named concept, copy, and structured UI plan.</p>
          )}
        </div>

        <div className="panel tall preview-panel">
          <h2>4. Generated live mock</h2>
          {result ? (
            <div className="mock-screen">
              <div className="mock-header">
                <div className="mock-avatar" />
                <div>
                  <strong>{result.productName}</strong>
                  <p>{result.hero.headline}</p>
                </div>
              </div>
              <div className="mock-grid">
                {result.cards.map((card) => (
                  <article key={card.title} className={`mock-card span-${card.span || 1}`}>
                    <p className="eyebrow">{card.kicker}</p>
                    <h3>{card.title}</h3>
                    <p>{card.body}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="mock-empty">The preview will render here from the AI JSON response.</div>
          )}
        </div>
      </section>
    </div>
  );
}

export default App;
