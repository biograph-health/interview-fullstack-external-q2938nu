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
    <section className="mx-auto max-w-md rounded-xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">Login or Create Account</h1>
      <form className="mt-4 space-y-3" onSubmit={onLogin}>
        <input
          required
          placeholder="username"
          value={username}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />
        <input
          required
          type="password"
          placeholder="password"
          value={password}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />
        <div className="flex gap-2">
          <Button type="submit">Login</Button>
          <Button type="button" variant="secondary" onClick={onRegister}>
            Create account
          </Button>
        </div>
        <Button type="button" variant="secondary" className="w-full" onClick={onDemoLogin}>
          Use demo account
        </Button>
        <p className="text-xs text-slate-500">
          Demo credentials: <span className="font-mono">{DEMO_USERNAME}</span> /{" "}
          <span className="font-mono">{DEMO_PASSWORD}</span>
        </p>
        {message && <p className="text-sm text-amber-800">{message}</p>}
      </form>
    </section>
  );
}
