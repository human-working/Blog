"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";
import api from "@/api/axios";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      router.push("/threads");
    } catch (err: any) {
      if (err?.response?.data?.mfaRequired) {
        setMfaRequired(true);
      } else {
        setError(err?.response?.data?.message || "Invalid credentials");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // verify MFA code then redirect
     
      await api.post("/auth/mfa/verify", { code: mfaCode });
      router.push("/threads");
    } catch {
      setError("Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-wrap">
      <div className="auth-page">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo-dot" />
            VOID FORUM
          </div>
          {mfaRequired ? (
            <>
              <div className="auth-title">Check your<br />phone.</div>
              <div className="auth-sub">// we sent a 6 digit code via SMS</div>
            </>
          ) : (
            <>
              <div className="auth-title">Welcome<br />back.</div>
              <div className="auth-sub">// enter your credentials to continue</div>
            </>
          )}
        </div>

        {mfaRequired ? (
          <form className="auth-body" onSubmit={handleMfa}>
            <div className="auth-field">
              <div className="auth-label">verification code</div>
              <input
                className={`auth-input ${error ? "error" : ""}`}
                type="text"
                placeholder="000000"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                autoFocus
              />
              {error && <div className="auth-error">✕ {error}</div>}
              <div className="auth-hint">code expires in 10 minutes</div>
            </div>

            <button className="auth-btn" type="submit" disabled={loading || mfaCode.length < 6}>
              {loading ? "verifying..." : "Verify →"}
            </button>

            <div
              className="auth-hint"
              style={{ textAlign: "center", cursor: "pointer" }}
              onClick={() => setMfaRequired(false)}
            >
              ← back to login
            </div>
          </form>
        ) : (
          <form className="auth-body" onSubmit={handleLogin}>
            <div className="auth-field">
              <div className="auth-label">email address</div>
              <input
                className="auth-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <div className="auth-label">password</div>
              <input
                className={`auth-input ${error ? "error" : ""}`}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error && <div className="auth-error">✕ {error}</div>}
            </div>

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? "logging in..." : "Login →"}
            </button>

            <div className="auth-divider">or</div>

            <div className="auth-hint" style={{ textAlign: "center" }}>
              forgot your password?{" "}
              <span
                style={{ color: "#0A0A0A", textDecoration: "underline", cursor: "pointer" }}
                onClick={() => router.push("/reset-password")}
              >
                reset it
              </span>
            </div>
          </form>
        )}

        <div className="auth-footer">
          <span className="auth-footer-text">no account?</span>
          <span className="auth-footer-link" onClick={() => router.push("/register")}>
            create one →
          </span>
        </div>
      </div>
    </main>
  );
}
