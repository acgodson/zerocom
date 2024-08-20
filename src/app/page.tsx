"use client";
import Dashboard from "@/lib/Dashboard";
import Welcome from "@/lib/Landing";
import { usePrivy } from "@privy-io/react-auth";

export default function App() {
  const { user } = usePrivy();
  return user ? (
    <>
      <Dashboard />
    </>
  ) : (
    <>
      <Welcome />
    </>
  );
}
