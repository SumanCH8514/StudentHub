import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";

// Custom Vite plugin to handle saving questions to local JSON during development
const saveQuestionPlugin = () => {
  return {
    name: 'save-question-plugin',
    configureServer(server) {
      server.middlewares.use('/api/save-question', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const newQuestion = JSON.parse(body);
              const targetPath = path.resolve(process.cwd(), 'src/assets/json/questions.json');

              let existingData = [];
              if (fs.existsSync(targetPath)) {
                const fileContent = fs.readFileSync(targetPath, 'utf8');
                if (fileContent.trim()) {
                  existingData = JSON.parse(fileContent);
                }
              } else {
                // Ensure directory exists
                const dir = path.dirname(targetPath);
                if (!fs.existsSync(dir)) {
                  fs.mkdirSync(dir, { recursive: true });
                }
              }

              existingData.push(newQuestion);
              fs.writeFileSync(targetPath, JSON.stringify(existingData, null, 4));

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (err) {
              console.error("Error saving question:", err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        } else {
          res.statusCode = 405; // Method Not Allowed
          res.end();
        }
      });
    }
  };
};

export default defineConfig({
  base: "/studentHub/routine/",
  plugins: [react(), tailwindcss(), saveQuestionPlugin()],
});
