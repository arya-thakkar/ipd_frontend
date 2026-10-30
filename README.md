# Adapt Synthetix — Frontend Application

Adapt Synthetix is a therapist-assisted speech-practice platform designed for individuals practising particular speech sounds, syllables, words, phrases, sentences, and everyday conversational expressions.

Built with **React 19**, **Vite**, **Tailwind CSS**, **React Router 7**, and **Lucide React**.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:5173/`.

### 3. Build for Production
```bash
npm run build
```

---

## 🎨 Design System & Color Tokens

- **Primary (Indigo)**: `#5865E8` (Clinical actions, primary buttons, active navigation)
- **Secondary (Teal)**: `#2BAE9B` (Patient practice activities, progress indicators)
- **Background**: `#F7F8FC`
- **Surface**: `#FFFFFF`
- **Text Primary**: `#172033`
- **Text Secondary**: `#687386`
- **Borders**: `#E5E9F2`
- **Success**: `#16A085`
- **Warning**: `#E5A33D`
- **Error**: `#DC5A65`
- **Typography**: Inter (Google Fonts)

---

## 🏛️ Application Architecture & Project Structure

```
src/
├── assets/                  # Static assets & icons
├── constants/
│   └── targets.js           # Target types (SOUND, SYLLABLE, WORD, PHRASE, SENTENCE, EVERYDAY USE), levels, progressions
├── utils/
│   └── formatters.js        # Date, time ago, and audio duration helpers
├── hooks/
│   └── useAudioRecorder.js  # MediaRecorder API hook with audio level analysis & error handling
├── mocks/
│   ├── mockData.js          # Seed dataset matching Supabase schemas (patients, targets, exercises, assignments, attempts)
│   └── storage.js           # LocalStorage persistence manager (supports full session CRUD & demo reset)
├── services/                # Clean Service Layer (UI -> Service Layer -> Mock / FastAPI)
│   ├── apiClient.js         # Configured API client with VITE_API_BASE_URL and mock latency simulation
│   ├── patientService.js    # Patient CRUD & summary counters
│   ├── targetService.js     # Target CRUD with dynamic target-type schemas
│   ├── exerciseService.js   # Exercise management & 3-step AI generator simulation
│   ├── assignmentService.js # Assignment dispatching & repetition tracking
│   ├── attemptService.js    # Speech recording attempts & acoustic observation logging
│   └── progressService.js   # Caseload metrics, target distribution & adherence stats
├── components/
│   ├── ui/                  # Reusable design system components
│   │   ├── Button.jsx       # Brand buttons (indigo, teal, outline, ghost, danger, loading states)
│   │   ├── Badge.jsx        # Badges and StatusBadge
│   │   ├── Card.jsx         # Rounded SaaS cards with soft shadows
│   │   ├── Modal.jsx        # Accessible dialog with escape key & backdrop
│   │   ├── Input.jsx        # Styled form inputs with validation & icons
│   │   ├── Select.jsx       # Styled dropdowns
│   │   ├── Textarea.jsx     # Multiline inputs
│   │   ├── AudioPlayer.jsx  # HTML5 audio playback + Web Speech synthesis for reference targets
│   │   └── PortalSwitcher.jsx # 1-click switcher between Therapist & Patient views + patient selector
│   └── layout/
│       ├── TherapistLayout.jsx # Desktop-first SaaS layout with sidebar, search, notifications
│       └── PatientLayout.jsx   # Mobile-friendly, clutter-free layout with bottom nav on mobile
└── pages/
    ├── therapist/
    │   ├── TherapistDashboard.jsx     # Caseload metrics, attention alerts, pending approvals, recent attempts
    │   ├── PatientsPage.jsx           # Patient table & cards, search, status filter, enroll modal
    │   ├── PatientProfilePage.jsx     # 5-tab patient dossier (Overview, Targets, Exercises, Attempts, Progress)
    │   ├── TargetsPage.jsx            # 6 target types, dynamic form fields, progression previews
    │   ├── ExerciseGeneratorPage.jsx  # 3-step wizard (Configure -> Generate -> Review/Approve with inline editing)
    │   ├── ExerciseAssignmentPage.jsx # Multi-exercise assignment, repetition goals, due dates
    │   ├── AttemptReviewPage.jsx      # Audio playback, target vs transcript, acoustic evidence
    │   ├── ProgressDashboardPage.jsx  # Practice volume, target breakdown, adherence metrics
    │   └── SettingsPage.jsx           # Therapist profile, default repetitions, demo data reset
    └── patient/
        ├── PatientHomePage.jsx             # Welcoming portal, today's practice, goal card, quick start
        ├── AssignedPracticePage.jsx        # Filterable exercise cards with repetition progress
        ├── ExerciseDetailPage.jsx          # Focus prompt, model reference audio, articulation cues
        ├── PracticeSessionPage.jsx         # Focused practice interface with live mic recording & neutral feedback
        ├── PracticeHistoryPage.jsx         # Audio playback of previous attempts
        ├── PatientProgressPage.jsx         # Simple milestone cards and target practice breakdown
        └── PatientProfileSettingsPage.jsx  # Patient info, mic hardware verifier, SLP details
```

---

## 🎙️ Speech Recording & Feedback Features

- **Real Audio Recording**: Built using the browser `MediaRecorder` API (`audio/webm`, `audio/mp4`, `audio/ogg`).
- **Live Visualizer & Timer**: Real-time waveform audio-level meter during speech.
- **Reference Model Voice**: Integrated Web Speech Synthesis for listening to clear articulation models.
- **Ethical, Supportive Feedback**: Neutral encouraging messages ("Nice work completing your speech practice!", "Your practice recording has been saved for review."). **No fake pronunciation scores or unverified diagnostic percentages**.
- **Error Handling**: Friendly notices for mic permissions denied, device not found, and recording failures.

---

## 🔌 Backend Integration Readiness (Phase 2)

The application is structured for instant integration with a FastAPI + Supabase backend:

1. **Configurable Base URL**: Set `VITE_API_BASE_URL` in an `.env` file:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   VITE_USE_MOCK=false
   ```
2. **Standard Schemas**: The mock objects in `src/mocks/mockData.js` map 1:1 to standard PostgreSQL/Supabase tables:
   - `patients` (`id`, `name`, `email`, `phone`, `status`, `notes`, `created_at`)
   - `targets` (`id`, `patient_id`, `type`, `value`, `language`, `difficulty`, `examples`, `sound_description`, `notes`)
   - `exercises` (`id`, `patient_id`, `target_id`, `title`, `instructions`, `type`, `difficulty`, `level`, `content`, `status`)
   - `assignments` (`id`, `patient_id`, `exercise_id`, `assigned_at`, `due_date`, `repetitions`, `completed_repetitions`, `status`)
   - `attempts` (`id`, `patient_id`, `exercise_id`, `target_id`, `audio_blob_url`, `recording_duration`, `target_text`, `transcript`, `recognition_evidence`)
3. **No UI Rework Required**: All UI components consume `patientService`, `targetService`, `exerciseService`, `assignmentService`, `attemptService`, and `progressService`. Switching to real endpoints only requires swapping mock handlers in the service layer.

