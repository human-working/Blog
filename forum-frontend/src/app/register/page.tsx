"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/api/axios";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const getStrength = (password: string) => {
    if (password.length === 0) return null;
    if (password.length < 6) return "weak";
    if (password.length < 10) return "medium";
    return "strong";
  };

  const strength = getStrength(form.password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/register", form);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="auth-wrap">
        <div className="auth-page">
          <div className="auth-header">
            <div className="auth-logo"><span className="auth-logo-dot" />VOID FORUM</div>
            <div className="auth-title">Check your<br />email.</div>
            <div className="auth-sub">// we sent a verification link to {form.email}</div>
          </div>
          <div className="auth-body">
            <div className="auth-hint" style={{ textAlign: "center", lineHeight: 1.8 }}>
              click the link in your email to verify your account before logging in.
            </div>
            <button className="auth-btn" onClick={() => router.push("/login")}>
              Go to Login →
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-wrap">
      <div className="auth-page">
        <div className="auth-header">
          <div className="auth-logo"><span className="auth-logo-dot" />VOID FORUM</div>
          <div className="auth-title">Join the<br />void.</div>
          <div className="auth-sub">// no ads, no tracking, no shadowbans</div>
        </div>

        <form className="auth-body" onSubmit={handleRegister}>
          <div className="auth-field">
            <div className="auth-label">username</div>
            <input
              className="auth-input"
              type="text"
              name="username"
              placeholder="void_user"
              value={form.username}
              onChange={handleChange}
              minLength={3}
              maxLength={30}
              required
            />
            <div className="auth-hint">3-30 characters</div>
          </div>

          <div className="auth-field">
            <div className="auth-label">email address</div>
            <input
              className="auth-input"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <div className="auth-label">password</div>
            <input
              className={`auth-input ${error ? "error" : ""}`}
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              minLength={8}
              required
            />
            {form.password && (
              <>
                <div className="auth-strength">
                  <div className={`auth-strength-bar ${strength}`} />
                  <div className={`auth-strength-bar ${strength === "medium" || strength === "strong" ? strength : ""}`} />
                  <div className={`auth-strength-bar ${strength === "strong" ? strength : ""}`} />
                  <div className={`auth-strength-bar ${strength === "strong" ? strength : ""}`} />
                </div>
                <div className={`auth-strength-label ${strength}`}>{strength}</div>
              </>
            )}
            {error && <div className="auth-error">✕ {error}</div>}
          </div>

          <button
            className="auth-btn"
            type="submit"
            disabled={loading || !form.email || !form.password || !form.username}
          >
            {loading ? "creating account..." : "Create Account →"}
          </button>

          <div className="auth-terms">
            by registering you agree to our{" "}
            <a href="/terms">terms</a> and{" "}
            <a href="/privacy">privacy policy</a>
          </div>
        </form>

        <div className="auth-footer">
          <span className="auth-footer-text">already have an account?</span>
          <span className="auth-footer-link" onClick={() => router.push("/login")}>
            login →
          </span>
        </div>
      </div>
    </main>
  );
}
