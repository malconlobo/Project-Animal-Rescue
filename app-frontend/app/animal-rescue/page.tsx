"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { checkIsLoggedIn } from "../actions/auth";

type Organization = {
  id: number;
  name: string;
  city: string;
  area: string;
  type: string;
  responseTime: string;
  phone: string;
  email?: string;
  verified: boolean;
};

const organizations: Organization[] = [];

const cities = ["Delhi", "Mumbai", "Bengaluru", "Chennai", "Pune"];

function HeartMark() {
  return <span className="brand-mark" aria-hidden="true">♥</span>;
}

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>;
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="inline-block w-[1em] h-[1em] mr-1 -mt-0.5 align-middle text-[#145a46]">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  );
}

export default function Home() {
  const [city, setCity] = useState("Delhi");
  const [reportOpen, setReportOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [reportError, setReportError] = useState("");
  const [liveOrganizations, setLiveOrganizations] = useState<Organization[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkIsLoggedIn().then(setIsLoggedIn);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
    fetch(`${API_URL}/organizations?city=${encodeURIComponent(city)}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load organizations")))
      .then(({ data }) => setLiveOrganizations(data || []))
      .catch((error: Error) => { if (error.name !== "AbortError") console.error("Failed to fetch organizations:", error); });
    return () => controller.abort();
  }, [city]);

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setReportError("");
    const values = new FormData(event.currentTarget);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
    try {
      const response = await fetch(`${API_URL}/incidents`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(values)) });
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
          {isLoggedIn ? (
            <a href="/dashboard" className="font-medium text-[#145a46]">Go to Dashboard</a>
          ) : (
            <a href="/auth/login" className="font-medium text-orange-600">Foundation Login</a>
          )}
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
        </div>
        <div className="city-picker" aria-label="Choose a city" role="group">
          <span className="location-dot" aria-hidden="true">⌖</span>
          {cities.map((item) => <button key={item} className={city === item ? "active" : ""} onClick={() => setCity(item)} aria-pressed={city === item}>{item}</button>)}
        </div>
        <div className="organization-grid" aria-live="polite">
          {liveOrganizations.map((org) => (
            <article className="organization-card" key={org.id}>
              <div className="card-top"><div className="org-avatar">{org.name.split(" ").map(word => word[0]).slice(0, 2).join("")}</div><span className="verified">✓ Verified</span></div>
              <h3>{org.name}</h3><p className="area"><LocationIcon />{org.area ? `${org.area} · ` : ""}{org.city}</p>{org.type && <p className="org-type">{org.type}</p>}
              <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-[#e7e9e4] text-[0.7rem] text-[#607169] select-text">
                {org.responseTime && (
                  <div><span className="text-[#50a971] text-[0.7rem] font-bold mr-1">●</span>Usually responds in {org.responseTime}</div>
                )}
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-[#145a46]">📞 {org.phone}</span>
                  {org.email && <span className="font-bold text-[#145a46]">✉️ {org.email}</span>}
                </div>
              </div>
            </article>
          ))}
          {liveOrganizations.length === 0 && <p className="empty">No verified rescuers registered in this city yet.</p>}
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
