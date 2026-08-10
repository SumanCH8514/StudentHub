import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useState, useEffect } from "react";

export const DEFAULT_ACADEMIC_CONFIG = {
  universities: ["SVU", "Regent", "Others"],
  streams: [
    {
      id: "btech",
      name: "B.Tech",
      semestersCount: 8,
      sectionsPerSemester: { "1": 4, "2": 4, "3": 4, "4": 4, "5": 4, "6": 4, "7": 4, "8": 4 }
    },
    {
      id: "bca",
      name: "BCA",
      semestersCount: 8,
      sectionsPerSemester: { "1": 4, "2": 4, "3": 4, "4": 4, "5": 4, "6": 4, "7": 4, "8": 4 }
    },
    {
      id: "ancs",
      name: "ANCS",
      semestersCount: 8,
      sectionsPerSemester: { "1": 4, "2": 4, "3": 4, "4": 4, "5": 4, "6": 4, "7": 4, "8": 4 }
    },
    {
      id: "diploma",
      name: "DIPLOMA",
      semestersCount: 8,
      sectionsPerSemester: { "1": 4, "2": 4, "3": 4, "4": 4, "5": 4, "6": 4, "7": 4, "8": 4 }
    }
  ]
};

export const getLocalAcademicConfig = () => {
  try {
    const saved = localStorage.getItem("academic_structure");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.streams)) return parsed;
    }
  } catch (e) {
    // ignore
  }
  return DEFAULT_ACADEMIC_CONFIG;
};

export const saveLocalAcademicConfig = (newConfig) => {
  try {
    localStorage.setItem("academic_structure", JSON.stringify(newConfig));
  } catch (e) {
    // ignore
  }
};

export const useAcademicConfig = () => {
  const [config, setConfig] = useState(getLocalAcademicConfig());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, "settings", "academic_structure");
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists() && docSnap.data().streams) {
          const data = docSnap.data();
          setConfig(data);
          saveLocalAcademicConfig(data);
        } else {
          setConfig(getLocalAcademicConfig());
        }
        setLoading(false);
      },
      () => {
        setConfig(getLocalAcademicConfig());
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { config, loading };
};
