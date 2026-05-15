"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import { registerUser } from "@/lib/api";
import { Button } from "@/components/ui/button";

const DEMO_USERNAME = "demo-user";
const DEMO_PASSWORD = "demo12345";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    const response = await signIn("credentials", {
      username,
      password,
      redirect: false
    });
    if (response?.ok) {
      router.push("/book-reservation");
      return;
    }
    setMessage("Invalid credentials");
  }

  async function onRegister() {
    const result = await registerUser(username, password);
    if (result?.token) {
      await signIn("credentials", { username, password, redirect: false });
      router.push("/book-reservation");
      return;
    }
    setMessage(result?.detail ?? "Registration failed");
  }

  async function onDemoLogin() {
    const response = await signIn("credentials", {
      username: DEMO_USERNAME,
      password: DEMO_PASSWORD,
      redirect: false
    });
    if (response?.ok) {
      router.push("/book-reservation");
      return;
    }
    setMessage("Demo login failed. Re-run seed data and try again.");
  }

  return (
    <section className="mx-auto max-w-md rounded-[2rem] border border-brand/10 bg-[#fffaf4] p-6 shadow-[0_24px_80px_rgba(21,18,13,0.12)] sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Guest access</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.06em] text-brand">
        Login or create account
      </h1>
      <form className="mt-6 space-y-3" onSubmit={onLogin}>
        <input
          required
          placeholder="username"
          value={username}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
          className="w-full rounded-2xl border border-brand/10 bg-white/70 px-4 py-3 text-brand outline-none transition placeholder:text-stone-400 focus:border-accent"
        />
        <input
          required
          type="password"
          placeholder="password"
          value={password}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          className="w-full rounded-2xl border border-brand/10 bg-white/70 px-4 py-3 text-brand outline-none transition placeholder:text-stone-400 focus:border-accent"
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit">Login</Button>
          <Button type="button" variant="secondary" onClick={onRegister}>
            Create account
          </Button>
        </div>
        <Button type="button" variant="secondary" className="w-full" onClick={onDemoLogin}>
          Use demo account
        </Button>
        <p className="text-xs text-stone-500">
          Demo credentials: <span className="font-mono">{DEMO_USERNAME}</span> /{" "}
          <span className="font-mono">{DEMO_PASSWORD}</span>
        </p>
        {message && (
          <p className="rounded-2xl border border-accent/25 bg-[#f4eadc] px-4 py-3 text-sm text-stone-800">
            {message}
          </p>
        )}
      </form>
    </section>
  );
}
