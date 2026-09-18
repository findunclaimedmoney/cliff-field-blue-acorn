import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/edit")({ component: Edit });

function Edit() {
  const search = typeof window !== "undefined" ? window.location.search : "";
  return (
    <>
      <h1 className="sr-only">HeyMia Cut bench</h1>
      <iframe
        title="HeyMia Cut"
        src={"/edit.html" + search}
        className="fixed inset-0 h-dvh w-full border-0 bg-bg"
      />
    </>
  );
}
