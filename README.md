# ProChat - Real-Time MERN Chat

A professional real-time chat application built with React, Tailwind CSS, Node.js, Express, MongoDB, and Socket.io.

## Features

- JWT authentication with login and registration
- One-to-one conversations
- Real-time messages with Socket.io
- Online presence and typing indicators
- MongoDB persistence for users, conversations, and messages
- Responsive Tailwind UI for desktop and mobile

## Setup

1. Install dependencies:

```bash
cd server && npm install
cd ../client && npm install
```

2. Create environment files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

3. Start MongoDB locally or update `server/.env` with your MongoDB Atlas URI.

4. Run the app in two terminals:

```bash
cd server
npm run dev
```

```bash
cd client
npm run dev
```

The client runs on `http://localhost:5173` and the API runs on `http://localhost:5001`.
