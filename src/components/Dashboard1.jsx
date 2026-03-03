import { doc, getDoc, setDoc } from "firebase/firestore";

const GEMINI_KEYS = [
  import.meta.env.VITE_GEMINI_API_KEY_1,
  import.meta.env.VITE_GEMINI_API_KEY_2,
  import.meta.env.VITE_GEMINI_API_KEY_3,
  import.meta.env.VITE_GEMINI_API_KEY_4,
  import.meta.env.VITE_GEMINI_API_KEY_5,
];

const Uploader = ({ onUploadSuccess }) => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUploadAndParse = async () => {
    if (!image || !auth.currentUser)
      return setError("Authentication required.");

    setLoading(true);
    setError("");

    try {
      // Fetch system settings to determine which Gemini Key to use globally
      const systemDoc = await getDoc(doc(db, "settings", "system"));
      let activeKeyIndex = 0; // Default to Key 1
      if (systemDoc.exists() && systemDoc.data().activeGeminiKeyId !== undefined) {
        // The db stores 1, 2, 3 so convert to 0-based array index:
        activeKeyIndex = Math.max(0, Math.min(4, parseInt(systemDoc.data().activeGeminiKeyId) - 1));
      }

      const activeGeminiKey = GEMINI_KEYS[activeKeyIndex];
      if (!activeGeminiKey) {
        throw new Error("Active Gemini API Key is missing or invalid in server configuration.");
      }

      const ai = new GoogleGenAI({ apiKey: activeGeminiKey });
      const reader = new FileReader();

      const base64Data = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.readAsDataURL(image);
      });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Extract routine: JSON array of objects {day, subject, teacher, time}.",
              },
              { inlineData: { data: base64Data, mimeType: image.type } },
            ],
          },
        ],
        config: { responseMimeType: "application/json" },
      });

      const schedule = JSON.parse(response.text);

      // Ensure the AI returned an array before we try to loop over it
      if (Array.isArray(schedule)) {
        for (const item of schedule) {
          // 🔥 THE FIX: Saving to the secure user subcollection path instead of the global "classes"
          const userDocRef = doc(
            db,
            "users",
            auth.currentUser.uid,
            "user_classes",
            uuidv4(),
          );

          await setDoc(userDocRef, {
            ...item,
            userId: auth.currentUser.uid,
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        throw new Error("AI did not return a valid schedule format.");
      }

      // Close the uploader and refresh the dashboard
      if (onUploadSuccess) onUploadSuccess();
    } catch (e) {
      console.error("Upload error:", e);
      setError(e.message || "Failed to parse and save the routine.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-2xl mx-auto">
      <input
        type="file"
        onChange={(e) => setImage(e.target.files[0])}
        className="mb-4 block w-full text-sm font-medium"
      />
      <button
        onClick={handleUploadAndParse}
        disabled={loading}
        className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl active:scale-95 disabled:opacity-50 transition-all"
      >
        {loading ? "AI Analysis in Progress..." : "Scan & Save Privately"}
      </button>
      {error && <p className="text-red-500 mt-2 text-xs font-bold">{error}</p>}
    </div>
  );
};

export default Uploader;
