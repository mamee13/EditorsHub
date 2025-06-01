# 🎬 EditorsHub – Freelance Platform for Clients & Editors

A fullstack freelance platform where **clients** can post editing jobs and **editors** can apply, chat, deliver, and get paid — all in one place.

---

## 🌐 Live Demo

🔗 [Visit the Platform](https://editors-hub.vercel.app)

## 📂 Repository

🔗 [GitHub Source Code](https://github.com/mamee13/EditorsHub)

---

## ⚙️ Tech Stack

**Frontend:**
- React + Vite
- Tailwind CSS
- Supabase Auth
- Socket.io (for real-time chat)
- Zustand (state management)

**Backend:**
- Node.js + Express
- MongoDB Atlas
- Stripe API (for payments)
- Socket.io
- Render (deployment)

---

## ✨ Features

- ✅ Supabase JWT Authentication with MongoDB user sync
- 🎭 Role-based access for Clients and Editors
- 💼 Clients can post jobs, view applicants, and assign editors
- 📝 Editors can browse jobs, apply with a message, and manage workflow
- 💬 Real-time chat with file upload/delivery (via Socket.io)
- 💸 Stripe integration for secure job payments
- 🔔 Notification system (real-time + persistent)
- 📁 File delivery system for job handoff
- 📱 Fully responsive & mobile-friendly

---

## 🧠 System Workflow

```mermaid
flowchart TD
  A[Client posts a job] --> B[Editors apply]
  B --> C[Client reviews applicants]
  C --> D[Client assigns one Editor]
  D --> E[Editor delivers final work]
  E --> F[Client approves or requests changes]
  F --> G[Stripe payment released to Editor]
