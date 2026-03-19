# StudyVerse

StudyVerse is a full-stack educational web application designed to provide interactive and engaging learning experiences. The project consists of a modern React frontend powered by Vite and a robust Node.js/Express backend API.

## 🚀 Tech Stack

### Frontend
- **Framework**: React 19 with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS with Shadcn UI (Radix UI primitives)
- **Animations & 3D**: Framer Motion, React Three Fiber (Three.js)
- **Data Visualization**: Recharts
- **Routing**: React Router
- **Form Handling**: React Hook Form with Zod validation
- **State Management / Data Fetching**: Axios

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs
- **Environment Management**: dotenv
- **Middleware**: CORS

## 📁 Project Structure

```text
FSD Project/
├── backend/          # Node.js + Express API
│   ├── db/           # Database configuration
│   ├── middleware/   # Express middlewares (e.g., auth, error handling)
│   ├── routes/       # API endpoints
│   ├── server.js     # Entry point for backend
│   └── package.json  # Backend dependencies
└── frontend/         # React + Vite Application
    ├── public/       # Static assets
    ├── src/          # Source code
    │   ├── components/ # Reusable UI components (Shadcn)
    │   ├── hooks/      # Custom React hooks
    │   ├── sections/   # Page sections
    │   ├── types/      # TypeScript interfaces/types
    │   ├── App.tsx     # Root frontend component
    │   └── main.tsx    # Entry point for frontend
    ├── tailwind.config.js
    └── package.json    # Frontend dependencies
```

## 🛠️ Installation & Setup

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### 1. Clone the repository
```bash
git clone <your-repository-url>
cd "FSD Project"
```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file in the `backend/` directory and configure any necessary keys (e.g., `PORT`, `JWT_SECRET`, database URI).
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server typically runs on http://localhost:5000 (depending on your `.env` configuration).*

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (if any are required by the frontend API client).
   - Create a `.env` file in the `frontend/` directory.
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on http://localhost:5173.*

## 🌟 Features
- Secure authentication system (JWT & bcrypt).
- Responsive, modern UI with Tailwind CSS and Shadcn UI.
- Interactive 3D elements powered by Three.js.
- Clean component-based architecture for scalability.

## 📄 License
This project is licensed under the ISC License.
