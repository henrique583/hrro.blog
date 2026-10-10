"use client";

// Runs during HTML parsing on full page loads. On the client it renders as
// inert text/plain so React doesn't warn about rendering <script> tags.
export default function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
