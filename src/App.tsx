import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "./pages/Login";
import Index from "./pages/Index";

const AUTH_URL = "https://functions.poehali.dev/cfc5299f-fd61-478a-b748-efec947d114a";

export interface CurrentUser {
  id: number;
  username: string;
  full_name: string;
  role: string;
}

const App = () => {
  const [sessionId, setSessionId] = useState<string | null>(() => localStorage.getItem("session_id"));
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const sid = localStorage.getItem("session_id");
    if (!sid) { setChecking(false); return; }
    fetch(`${AUTH_URL}?action=me`, { headers: { "X-Session-Id": sid } })
      .then(r => r.json())
      .then(data => {
        if (data.user) { setCurrentUser(data.user); setSessionId(sid); }
        else { localStorage.removeItem("session_id"); setSessionId(null); }
      })
      .catch(() => { localStorage.removeItem("session_id"); setSessionId(null); })
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = (sid: string, user: CurrentUser) => {
    localStorage.setItem("session_id", sid);
    setSessionId(sid);
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    if (sessionId) {
      await fetch(`${AUTH_URL}?action=logout`, {
        method: "POST",
        headers: { "X-Session-Id": sessionId },
      });
    }
    localStorage.removeItem("session_id");
    setSessionId(null);
    setCurrentUser(null);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400 text-sm">Загрузка...</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {!sessionId || !currentUser ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Index sessionId={sessionId} currentUser={currentUser} onLogout={handleLogout} />
      )}
    </TooltipProvider>
  );
};

export default App;
