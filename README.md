# Arabic Language Trainer

A desktop application for learning Arabic, built with **Electron + TypeScript + C# .NET** — the same architectural pattern used by VS Code, Azure DevOps, and other professional tools.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Main Process                     │
│                    (src/main/main.ts)                        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │   Window      │  │   IPC        │  │   Backend         │  │
│  │   Management  │  │   Handlers   │  │   Manager         │  │
│  │   + Menus     │  │              │  │   (spawns .NET)   │  │
│  └──────────────┘  └──────┬───────┘  └────────┬──────────┘  │
│                           │                    │             │
├───────────────────────────┼────────────────────┼─────────────┤
│        Preload Bridge     │                    │             │
│      (contextBridge)      │                    │             │
├───────────────────────────┼────────────────────┼─────────────┤
│                           │                    │             │
│  ┌────────────────────────▼──┐    ┌────────────▼──────────┐  │
│  │   Renderer Process        │    │   C# .NET Backend     │  │
│  │   (sandboxed browser)     │    │   (ASP.NET Core API)  │  │
│  │                           │    │                       │  │
│  │   ├── Router              │    │   ├── Controllers     │  │
│  │   ├── API Client          │    │   ├── Services        │  │
│  │   ├── Views               │    │   ├── Models          │  │
│  │   │   ├── Dashboard       │    │   └── Data            │  │
│  │   │   ├── Vocabulary      │    │                       │  │
│  │   │   ├── Quiz            │    │   Runs on localhost   │  │
│  │   │   ├── Progress        │    │   :5175               │  │
│  │   │   └── Settings        │    │                       │  │
│  │   └── Styles              │    └───────────────────────┘  │
│  └───────────────────────────┘                               │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
src/
├── main/                          # Electron main process (privileged)
│   ├── main.ts                    # Entry point, window creation, lifecycle
│   ├── preload.ts                 # Secure IPC bridge (contextBridge)
│   ├── backend-manager.ts         # Spawns/manages C# backend process
│   └── embedded-service.ts        # Fallback TS service (no .NET required)
│
├── renderer/                      # Electron renderer process (sandboxed)
│   ├── index.html                 # HTML shell
│   ├── index.ts                   # App bootstrap + router setup
│   ├── services/
│   │   ├── router.ts              # Client-side view routing
│   │   └── api-client.ts          # Backend API abstraction
│   ├── views/
│   │   ├── dashboard.ts           # Dashboard view
│   │   ├── vocabulary.ts          # Vocabulary browser
│   │   ├── quiz.ts                # Interactive quiz
│   │   ├── progress.ts            # Progress tracking
│   │   └── settings.ts            # Settings + backend status
│   └── styles/
│       └── main.css               # Application styles
│
└── backend/                       # C# .NET backend service
    └── ArabicTrainer.Api/
        ├── Program.cs             # ASP.NET Core entry point
        ├── ArabicTrainer.Api.csproj
        ├── Models/
        │   ├── VocabularyItem.cs
        │   ├── QuizQuestion.cs
        │   └── UserProgress.cs
        └── Services/
            ├── VocabularyService.cs
            ├── QuizService.cs
            └── ProgressService.cs
```

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **C# .NET 8 SDK** (optional — app falls back to embedded TypeScript service)

### Run in Development

```bash
# Install dependencies
npm install

# Start the desktop app (embedded backend)
npm start

# Or, if you have .NET SDK installed, build and run with C# backend
npm run start:full
```

### Package as Executable

```bash
# Package for your platform
npm run package

# Or create distributable installer (.deb, .zip)
npm run make
```

The packaged app is output to `out/` — a real clickable executable.

## Key Concepts to Learn From This Codebase

| Concept | Where to Look |
|---------|---------------|
| Multi-process architecture | `src/main/main.ts` |
| Secure IPC (contextBridge) | `src/main/preload.ts` |
| Process lifecycle management | `src/main/backend-manager.ts` |
| Service pattern (C#) | `src/backend/.../Services/` |
| Dependency injection | `src/backend/.../Program.cs` |
| Client-side routing | `src/renderer/services/router.ts` |
| API client abstraction | `src/renderer/services/api-client.ts` |
| View architecture | `src/renderer/views/` |

## How This Maps to Production Apps

- **VS Code**: Electron shell + TypeScript + Language Server Protocol (child processes)
- **Azure DevOps (VSTS)**: React frontend + C# ASP.NET microservices
- **Slack/Discord**: Electron shell + React renderer + native services
