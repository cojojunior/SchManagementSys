import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { studentsService } from "@/services/supabase/students";
import type { Student } from "@/types/student";

export function useCurrentStudent() {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user?.studentId) {
      setStudent(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    studentsService.get(user.studentId).then((s) => {
      if (!cancelled) {
        setStudent(s);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user?.studentId]);

  return { student, loading };
}
