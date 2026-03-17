'use client';

import { useMemo, useState } from 'react';

const initialData = {
  project_id: '',
  intake_date: '',
  applicant: { name: '', email: '', phone: '' },
  project_location: {
    address: '',
    city: 'Seattle',
    state: 'WA',
    zip: '',
    parcel_number: '',
    waterbody: ''
  },
  project_details: {
    project_type: '',
    description: '',
    residential_or_commercial: '',
    same_footprint: null,
    new_piles: null,
    dock_length_ft: null,
    dock_width_ft: null,
    overwater_sqft: null
  },
  permit_flags: {
    shoreline_review_likely: null,
    hpa_required_likely: null,
    usace_review_likely: null,
    dnr_aquatic_lands_check: null
  },
  documents_received: {
    site_plan: false,
    photos: false,
    survey: false,
    parcel_info: false,
    ownership_docs: false,
    dock_design_drawings: false
  },
  missing_documents: [],
  agency_routes: [],
  status: 'intake',
  notes: ''
};

const questions = [
  { key: 'applicant.name', label: "What is the applicant's full name?", type: 'text' },
  { key: 'applicant.email', label: "What is the applicant's email address?", type: 'text' },
  { key: 'applicant.phone', label: "What is the applicant's phone number?", type: 'text' },
  { key: 'project_location.address', label: 'What is the project address?', type: 'text' },
  { key: 'project_location.zip', label: 'What is the ZIP code?', type: 'text' },
  { key: 'project_location.parcel_number', label: 'What is the parcel number?', type: 'text' },
  { key: 'project_location.waterbody', label: 'What waterbody is the dock on?', type: 'text' },
  { key: 'project_details.project_type', label: 'What type of project is this? (new dock, repair, replacement, expansion, removal)', type: 'text' },
  { key: 'project_details.description', label: 'Give a short description of the project.', type: 'textarea' },
  { key: 'project_details.residential_or_commercial', label: 'Is this residential or commercial?', type: 'text' },
  { key: 'project_details.same_footprint', label: 'Is it the same footprint as the existing dock?', type: 'boolean' },
  { key: 'project_details.new_piles', label: 'Will new piles be installed?', type: 'boolean' },
  { key: 'project_details.dock_length_ft', label: 'What is the dock length in feet?', type: 'number' },
  { key: 'project_details.dock_width_ft', label: 'What is the dock width in feet?', type: 'number' },
  { key: 'project_details.overwater_sqft', label: 'What is the overwater square footage?', type: 'number' },
  { key: 'documents_received.site_plan', label: 'Do you already have a site plan?', type: 'boolean' },
  { key: 'documents_received.photos', label: 'Do you already have photos?', type: 'boolean' },
  { key: 'documents_received.survey', label: 'Do you already have a survey?', type: 'boolean' },
  { key: 'documents_received.parcel_info', label: 'Do you already have parcel information?', type: 'boolean' },
  { key: 'documents_received.ownership_docs', label: 'Do you already have ownership documents?', type: 'boolean' },
  { key: 'documents_received.dock_design_drawings', label: 'Do you already have dock design drawings?', type: 'boolean' },
  { key: 'notes', label: 'Any notes, complications, or special conditions?', type: 'textarea' }
];

const docLabels = {
  site_plan: 'site plan',
  photos: 'photos',
  survey: 'survey',
  parcel_info: 'parcel info',
  ownership_docs: 'ownership docs',
  dock_design_drawings: 'dock design drawings'
};

function setDeepValue(obj, path, value) {
  const keys = path.split('.');
  const clone = structuredClone(obj);
  let current = clone;
  for (let i = 0; i < keys.length - 1; i++) current = current[keys[i]];
  current[keys[keys.length - 1]] = value;
  return clone;
}

function computeFlags(data) {
  const shoreline = Boolean(data.project_location.address && data.project_location.waterbody);
  const projectType = data.project_details.project_type.toLowerCase();
  const inWaterWork = ['new', 'repair', 'replacement', 'replace', 'expansion'].some((s) => projectType.includes(s));
  const newPiles = data.project_details.new_piles === true;
  return {
    shoreline_review_likely: shoreline,
    hpa_required_likely: inWaterWork || newPiles,
    usace_review_likely: inWaterWork,
    dnr_aquatic_lands_check: shoreline || newPiles
  };
}

function computeMissingDocuments(data) {
  return Object.entries(data.documents_received)
    .filter(([, value]) => value === false)
    .map(([key]) => docLabels[key]);
}

function computeAgencyRoutes(flags) {
  const routes = [];
  if (flags.shoreline_review_likely) routes.push('SDCI shoreline / master use review');
  if (flags.hpa_required_likely) routes.push('WDFW HPA review likely');
  if (flags.usace_review_likely) routes.push('USACE / JARPA track likely');
  if (flags.dnr_aquatic_lands_check) routes.push('DNR aquatic lands check');
  return routes;
}

export default function HomePage() {
  const [data, setData] = useState(initialData);
  const [step, setStep] = useState(0);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hey — this app walks through a dock permit intake and generates a JSON file you can send to n8n.' },
    { role: 'assistant', text: questions[0].label }
  ]);

  const finalJson = useMemo(() => {
    const permit_flags = computeFlags(data);
    const missing_documents = computeMissingDocuments(data);
    const agency_routes = computeAgencyRoutes(permit_flags);
    return {
      ...data,
      intake_date: data.intake_date || new Date().toISOString().slice(0, 10),
      permit_flags,
      missing_documents,
      agency_routes
    };
  }, [data]);

  const currentQuestion = questions[Math.min(step, questions.length - 1)];

  const handleAnswer = (rawValue) => {
    const transcript = [...messages, { role: 'user', text: typeof rawValue === 'boolean' ? (rawValue ? 'Yes' : 'No') : rawValue || '—' }];
    const q = questions[step];
    let value = rawValue;
    if (q.type === 'number') value = rawValue === '' ? null : Number(rawValue);
    const nextData = setDeepValue(data, q.key, value);

    const nextStep = step + 1;
    setStep(nextStep);
    setData(nextData);
    setInput('');

    setMessages(
      nextStep < questions.length
        ? [...transcript, { role: 'assistant', text: questions[nextStep].label }]
        : [...transcript, { role: 'assistant', text: 'Done. Your intake JSON is ready.' }]
    );
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(finalJson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dock_permit_intake.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetAll = () => {
    setData(initialData);
    setStep(0);
    setInput('');
    setMessages([
      { role: 'assistant', text: 'Hey — this app walks through a dock permit intake and generates a JSON file you can send to n8n.' },
      { role: 'assistant', text: questions[0].label }
    ]);
  };

  return (
    <main className="page">
      <div className="hero">
        <div>
          <h1>Dock Permit AI Intake Assistant</h1>
          <p>GUI app for permit intake and JSON generation.</p>
        </div>
        <div className="hero-actions">
          <span className="pill">Guided Mode</span>
        </div>
      </div>

      <div className="grid">
        <section className="card large">
          <div className="card-header">
            <h2>Chat Intake</h2>
          </div>

          <div className="chatbox">
            {messages.map((msg, i) => (
              <div key={i} className={`bubble-row ${msg.role === 'user' ? 'right' : 'left'}`}>
                <div className={`bubble ${msg.role}`}>{msg.text}</div>
              </div>
            ))}
          </div>

          <div className="controls">
            {currentQuestion?.type === 'boolean' ? (
              <div className="row gap-sm wrap">
                <button className="button" onClick={() => handleAnswer(true)}>Yes</button>
                <button className="button secondary" onClick={() => handleAnswer(false)}>No</button>
              </div>
            ) : currentQuestion?.type === 'textarea' ? (
              <>
                <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your answer..." />
                <button className="button" onClick={() => handleAnswer(input.trim())}>Send</button>
              </>
            ) : (
              <>
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your answer..." />
                <button className="button" onClick={() => handleAnswer(input.trim())}>Send</button>
              </>
            )}
          </div>

          <div className="row gap-sm wrap top-margin">
            <button className="button secondary" onClick={resetAll}>Reset</button>
            <button className="button" onClick={downloadJson}>Download JSON</button>
          </div>
        </section>

        <aside className="card sidebar">
          <h2>What this collects</h2>
          <div className="mini-card">
            <ul>
              <li>Applicant info</li>
              <li>Project location</li>
              <li>Dock project details</li>
              <li>Documents received</li>
              <li>Likely agency routes</li>
            </ul>
          </div>
        </aside>
      </div>

      <section className="card preview-card">
        <div className="card-header">
          <h2>Live JSON Preview</h2>
        </div>
        <pre className="json-preview">{JSON.stringify(finalJson, null, 2)}</pre>
      </section>
    </main>
  );
}
