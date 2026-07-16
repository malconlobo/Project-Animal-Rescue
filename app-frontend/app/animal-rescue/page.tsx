"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Organization = {
  id: number;
  name: string;
  city: string;
  area: string;
  type: string;
  responseTime: string;
  phone: string;
  verified: boolean;
};

const organizations: Organization[] = [
  { id: 1, name: "Wildlife SOS", city: "Delhi", area: "Delhi NCR", type: "Wildlife & domestic", responseTime: "15 min", phone: "+91 98765 43210", verified: true },
  { id: 2, name: "Friendicoes SECA", city: "Delhi", area: "Defence Colony", type: "Domestic animals", responseTime: "20 min", phone: "+91 98100 34212", verified: true },
  { id: 3, name: "Bombay Animal Rights", city: "Mumbai", area: "Andheri & Bandra", type: "Domestic animals", responseTime: "18 min", phone: "+91 98204 88019", verified: true },
  { id: 4, name: "People For Animals", city: "Bengaluru", area: "Bannerghatta", type: "Wildlife & domestic", responseTime: "25 min", phone: "+91 98450 41106", verified: true },
  { id: 5, name: "Blue Cross of India", city: "Chennai", area: "Guindy & Adyar", type: "Domestic animals", responseTime: "22 min", phone: "+91 94441 12001", verified: true },
  { id: 6, name: "ResQ Charitable Trust", city: "Pune", area: "Pune & PCMC", type: "Wildlife & domestic", responseTime: "20 min", phone: "+91 99230 46191", verified: true },
];

const cities = ["Delhi", "Mumbai", "Bengaluru", "Chennai", "Pune"];

function HeartMark() {
  return <span className="brand-mark" aria-hidden="true">♥</span>;
}

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>;
}

export default function Home() {
  const [city, setCity] = useState("Delhi");
  const [reportOpen, setReportOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [reportError, setReportError] = useState("");
  const [query, setQuery] = useState("");
  const [liveOrganizations, setLiveOrganizations] = useState(organizations);

  useEffect(() => {
    const controller = new AbortController();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    fetch(`${apiUrl}/api/organizations?city=${encodeURIComponent(city)}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load organizations")))
      .then(({ data }) => setLiveOrganizations(data))
      .catch((error: Error) => { if (error.name !== "AbortError") setLiveOrganizations(organizations.filter((org) => org.city === city)); });
    return () => controller.abort();
  }, [city]);

  const visibleOrganizations = useMemo(() => liveOrganizations.filter((org) =>
    `${org.name} ${org.area} ${org.type}`.toLowerCase().includes(query.toLowerCase()),
  ), [liveOrganizations, query]);

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setReportError("");
    const values = new FormData(event.currentTarget);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    try {
      const response = await fetch(`${apiUrl}/api/incidents`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(values)) });
      if (!response.ok) throw new Error("Unable to send report");
      setSent(true);
    } catch {
      setReportError("We could not alert rescuers just yet. Please call a local rescue team directly.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main>
      <a className="skip-link" href="#rescuers">Skip to nearby rescuers</a>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="PawReach home"><HeartMark /> PawReach</a>
        <nav aria-label="Main navigation">
          <a href="#rescuers">Find help</a>
          <a href="#how-it-works">How it works</a>
        </nav>
        <button className="report-header" onClick={() => { setReportOpen(true); setSent(false); }}>
          Report an emergency <ArrowIcon />
        </button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> A faster path to help</p>
          <h1>Every animal deserves a <em>way home.</em></h1>
          <p className="hero-description">Find trusted rescue teams nearby, or alert the right people when an animal needs help now.</p>
          <div className="hero-actions">
            <a className="button primary" href="#rescuers">Find a rescuer <ArrowIcon /></a>
            <button className="button quiet" onClick={() => { setReportOpen(true); setSent(false); }}>Report an incident</button>
          </div>
          <div className="trust-row" aria-label="Impact statistics">
            <div><strong>250+</strong><span>verified rescue teams</span></div>
            <div><strong>30</strong><span>cities and growing</span></div>
          </div>
        </div>
        <div className="hero-art" aria-label="Illustration of a dog being cared for" role="img">
          <div className="sun" />
          <div className="cloud cloud-one" /><div className="cloud cloud-two" />
          <div className="hill hill-back" /><div className="hill hill-front" />
          <div className="dog"><i className="ear left" /><i className="ear right" /><i className="head" /><i className="eye" /><i className="nose" /><i className="body" /><i className="leg first" /><i className="leg second" /><i className="tail" /></div>
          <div className="paw paw-one">●</div><div className="paw paw-two">●</div><div className="paw paw-three">●</div>
          <div className="art-caption"><HeartMark /> Help can be close by</div>
        </div>
      </section>

      <section className="rescue-section" id="rescuers" aria-labelledby="rescuers-title">
        <div className="section-head">
          <div><p className="eyebrow"><span /> Local rescue network</p><h2 id="rescuers-title">Find help near you</h2><p>Verified organizations ready to respond in your city.</p></div>
          <label className="search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search rescue organizations" aria-label="Search rescue organizations" /></label>
        </div>
        <div className="city-picker" aria-label="Choose a city" role="group">
          <span className="location-dot" aria-hidden="true">⌖</span>
          {cities.map((item) => <button key={item} className={city === item ? "active" : ""} onClick={() => setCity(item)} aria-pressed={city === item}>{item}</button>)}
        </div>
        <div className="organization-grid" aria-live="polite">
          {visibleOrganizations.map((org) => (
            <article className="organization-card" key={org.id}>
              <div className="card-top"><div className="org-avatar">{org.name.split(" ").map(word => word[0]).slice(0, 2).join("")}</div><span className="verified">✓ Verified</span></div>
              <h3>{org.name}</h3><p className="area">⌖ {org.area} · {org.city}</p><p className="org-type">{org.type}</p>
              <div className="card-footer"><span><b>●</b> Usually responds in {org.responseTime}</span><a href={`tel:${org.phone.replace(/\s/g, "")}`} aria-label={`Call ${org.name}`}>Call <ArrowIcon /></a></div>
            </article>
          ))}
          {visibleOrganizations.length === 0 && <p className="empty">No rescuers match that search yet. Try another city or search term.</p>}
          <button className="more-card" onClick={() => setReportOpen(true)}><span>+</span><strong>Know a rescue team?</strong><p>Help us grow this network.</p></button>
        </div>
      </section>

      <section className="incident-banner" id="how-it-works" aria-labelledby="incident-title">
        <div className="emergency-symbol" aria-hidden="true">!</div>
        <div><p className="eyebrow light"><span /> See an animal in need?</p><h2 id="incident-title">Don&apos;t wait. We&apos;ll alert the closest rescuers.</h2><p>Share a few details and local rescue teams will be notified right away.</p></div>
        <button className="button light-button" onClick={() => { setReportOpen(true); setSent(false); }}>Report an incident <ArrowIcon /></button>
      </section>

      <footer><a className="brand" href="#top"><HeartMark /> PawReach</a><span>Making every report count.</span><span>© 2026 PawReach</span></footer>

      {reportOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setReportOpen(false)}>
        <section className="report-modal" role="dialog" aria-modal="true" aria-labelledby="report-title" onMouseDown={(event) => event.stopPropagation()}>
          <button className="close" onClick={() => setReportOpen(false)} aria-label="Close report form">×</button>
          {sent ? <div className="success"><div>✓</div><h2>Help is on the way.</h2><p>Local rescue teams in {city} have been notified of your report.</p><button className="button primary" onClick={() => setReportOpen(false)}>Done</button></div> : <><p className="eyebrow"><span /> Emergency report</p><h2 id="report-title">Tell us what happened</h2><p className="modal-intro">We&apos;ll share this with verified rescue teams near the incident.</p><form onSubmit={submitReport}><label>City<select name="city" defaultValue={city} onChange={(event) => setCity(event.target.value)}>{cities.map(item => <option key={item}>{item}</option>)}</select></label><label>What does the animal need?<select name="situation" required defaultValue=""><option value="" disabled>Select the situation</option><option>Injured or unwell</option><option>Trapped or in danger</option><option>Lost or abandoned</option><option>Other urgent help</option></select></label><label>Location details<input name="location" required placeholder="Landmark, street or neighborhood" /></label><label>More details <span className="optional">(optional)</span><textarea name="details" rows={3} placeholder="Animal type, condition, any immediate risks…" /></label>{reportError && <p className="form-error" role="alert">{reportError}</p>}<button className="button primary submit" type="submit" disabled={sending}>{sending ? "Alerting rescuers…" : "Alert nearby rescuers"} {!sending && <ArrowIcon />}</button></form></>}
        </section>
      </div>}
    </main>
  );
}
