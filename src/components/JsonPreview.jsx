import { useState } from "react";
import { copyJson, downloadJson } from "../lib/io.js";

export default function JsonPreview({ jsonText, errors, filename }) {
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const valid = errors.length === 0;

  const flash = (text, error = false) => {
    setMsg(text);
    setIsError(error);
    if (!error) setTimeout(() => setMsg(""), 2500);
  };

  const onCopy = async () => {
    const ok = await copyJson(jsonText);
    flash(ok ? "Copied to clipboard." : "Copy failed — select and copy manually.", !ok);
  };

  const onDownload = () => {
    downloadJson(filename, jsonText);
    flash(`Downloaded ${filename}.`);
  };

  return (
    <section className="card">
      <div className="hd">
        <h2>JSON Output</h2>
        <span className={`badge ${valid ? "good" : "bad"}`}>
          {valid ? "Valid" : `${errors.length} issue${errors.length === 1 ? "" : "s"}`}
        </span>
      </div>
      <div className="bd">
        <div className="muted-text">
          One <b>surveysV2</b> object — paste it into the <code>surveysV2</code> array in
          ChallengeAssets.json.
        </div>
        <div className="spacer-sm" />
        <pre className="json-pre">{jsonText}</pre>

        <div className="row">
          <button className="btn" onClick={onCopy} disabled={!valid}>
            Copy JSON
          </button>
          <button className="btn secondary" onClick={onDownload} disabled={!valid}>
            Download .json
          </button>
        </div>

        {msg && <div className={`status${isError ? " error" : ""}`}>{msg}</div>}

        {!valid && (
          <ul className="errors">
            {errors.map((e, i) => (
              <li key={i}>• {e}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
