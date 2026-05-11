# SoroProtocol App

> The web dashboard for SoroProtocol — real-time payment streaming on Stellar.

SoroProtocol App is a Next.js 14 application that allows users to create, monitor, and manage token payment streams directly from their browser. It connects to the Freighter wallet, communicates with the SoroProtocol API, and renders a live-updating balance counter that reflects accrued funds in real time.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Getting Started](#getting-started)
- [Pages](#pages)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Contributing](#contributing)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js](https://nextjs.org) 14 (App Router) |
| Language | TypeScript 5 |
| Wallet | [Freighter](https://www.freighter.app) browser extension |
| Styling | CSS Modules / Tailwind |
| Testing | Jest + React Testing Library |

---

## Features

- **Freighter wallet integration** — connect and authenticate with a Stellar keypair
- **Stream management** — create, view, and cancel payment streams
- **Live balance counter** — animates in real time, updating every 200 ms as tokens accrue
- **Vesting schedule tracking** — view and manage token vesting positions
- **Dark / light mode** — persisted theme toggle
- **Typed API client** — all backend calls go through a typed service layer

---

## Getting Started

**Prerequisites:** Node.js 20+, npm 9+, [Freighter wallet](https://www.freighter.app) installed in your browser.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Open .env.local and fill in contract IDs and API URL

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page — wallet connect entry point |
| `/dashboard` | Overview of all active streams for the connected address |
| `/create` | Form to create a new payment stream |
| `/streams/[id]` | Stream detail view with live balance and action buttons |
| `/vesting` | Vesting schedule list and claim interface |

---

## Project Structure

```
src/
├── app/                  # Next.js App Router pages and layouts
│   ├── dashboard/        # Stream overview page
│   ├── create/           # Stream creation form
│   ├── streams/[id]/     # Stream detail page
│   └── vesting/          # Vesting management page
├── components/
│   ├── atoms/            # WalletButton, ThemeToggle
│   ├── molecules/        # StreamCard
│   └── organisms/        # Navbar
├── context/              # WalletContext, ToastContext
├── hooks/                # useStreams, useStreamBalance, useTheme
├── services/             # Typed API client (api.ts)
└── styles/               # Global styles
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_NETWORK` | Yes | `testnet` or `mainnet` |
| `NEXT_PUBLIC_STREAM_CONTRACT_ID` | Yes | Deployed stream contract ID |
| `NEXT_PUBLIC_VESTING_CONTRACT_ID` | Yes | Deployed vesting contract ID |
| `NEXT_PUBLIC_API_URL` | Yes | SoroProtocol backend API base URL |

See [`.env.example`](./.env.example) for the complete reference.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Create an optimised production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint across all source files |

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for branch conventions, commit message guidelines, and the pull request process.
