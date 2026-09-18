import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <>
      <h1 className="sr-only">Pentad — five-dimensional living frame</h1>
      <iframe
        title="Pentad"
        src="/pentad.html"
        className="fixed inset-0 h-dvh w-full border-0 bg-bg"
      />
    </>
  );
}
