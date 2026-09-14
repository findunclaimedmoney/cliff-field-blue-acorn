import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <>
      <h1 className="sr-only">HeyMia Workflow Command Center</h1>
      <iframe
        title="HeyMia Workflow Command Center"
        src="/work.html"
        className="fixed inset-0 h-dvh w-full border-0 bg-bg"
      />
    </>
  );
}
