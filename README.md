# AI Class Schedule Generator

This is a web application that helps in creating and managing class schedules using AI. It provides a user-friendly interface for administrators to upload class data, and for students to view their schedules. The application is built with modern web technologies and leverages AI for schedule generation.

## Features

- **User Authentication:** Secure login for administrators using Firebase Authentication.
- **Dashboard:** A central hub for administrators to manage class data and generate schedules.
- **AI-Powered Schedule Generation:** Utilizes Google's Generative AI to automatically create class schedules from uploaded data.
- **File Upload:** Administrators can upload class data files (e.g., CSV, JSON) through the application.
- **Dynamic UI:** A responsive and interactive user interface built with React and Tailwind CSS.

## Tech Stack

- **Frontend:**
  - [React](https://react.dev/) - A JavaScript library for building user interfaces.
  - [Vite](https://vitejs.dev/) - A fast build tool for modern web development.
  - [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework for styling.
  - [Lucide React](https://lucide.dev/guide/packages/lucide-react) - A library of beautiful and consistent icons.

- **Backend & AI:**
  - [Firebase](https://firebase.google.com/) - Used for user authentication and hosting.
  - [Google Generative AI](https://ai.google.dev/) - Powers the automatic schedule generation.

- **Development:**
  - [ESLint](https://eslint.org/) - For code linting and maintaining code quality.
  - [PostCSS](https://postcss.org/) - A tool for transforming CSS with JavaScript.
  - [Autoprefixer](https://github.com/postcss/autoprefixer) - A PostCSS plugin to parse CSS and add vendor prefixes.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- [Node.js](https://nodejs.org/en/) installed on your machine.
- A Firebase project with Authentication enabled.
- A Google AI API key.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/ai-class-schedules.git
    cd ai-class-schedules
    ```

2.  **Install NPM packages:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of your project and add your Firebase and Google AI credentials. Refer to `src/firebaseConfig.js` for the required Firebase configuration.

    ```
    VITE_FIREBASE_API_KEY="your_api_key"
    VITE_FIREBASE_AUTH_DOMAIN="your_auth_domain"
    VITE_FIREBASE_PROJECT_ID="your_project_id"
    VITE_FIREBASE_STORAGE_BUCKET="your_storage_bucket"
    VITE_FIREBASE_MESSAGING_SENDER_ID="your_messaging_sender_id"
    VITE_FIREBASE_APP_ID="your_app_id"
    VITE_GOOGLE_AI_API_KEY="your_google_ai_api_key"
    ```

### Running the Application

- **Development mode:**
  This command will start the Vite development server.
  ```sh
  npm run dev
  ```

- **Production build:**
  This command will build the application for production.
  ```sh
  npm run build
  ```

- **Linting:**
  This command will lint the codebase for any errors.
  ```sh
  npm run lint
  ```

## Folder Structure

```
.
├── public/                # Static assets
├── src/
│   ├── assets/            # Project assets (images, fonts)
│   ├── components/        # React components
│   │   ├── AdminPanel.jsx
│   │   ├── Auth.jsx
│   │   ├── Dashboard.jsx
│   │   └── ...
│   ├── App.jsx            # Main application component
│   ├── firebaseConfig.js  # Firebase configuration
│   ├── index.css          # Global styles
│   └── main.jsx           # Entry point of the application
├── .gitignore             # Git ignore file
├── index.html             # Main HTML file
├── package.json           # Project dependencies and scripts
├── README.md              # Project documentation
└── vite.config.js         # Vite configuration
```