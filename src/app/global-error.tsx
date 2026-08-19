"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary: rendered when the root layout itself fails, so it must
 * provide its own <html>/<body> and cannot rely on i18n or Tailwind classes.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
          padding: "2rem",
          textAlign: "center",
          fontFamily: "system-ui, Tahoma, sans-serif",
          color: "#262d34",
          background: "#ffffff",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", margin: 0 }}>
          حدث خطأ ما / Something went wrong
        </h1>
        <p style={{ maxWidth: "32rem", color: "#6b7783", lineHeight: 1.7 }}>
          نأسف لذلك. حاول تحديث الصفحة.
          <br />
          Sorry about that. Please try reloading the page.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "0.5rem",
            border: "none",
            borderRadius: "999px",
            background: "#0c7183",
            color: "#fff",
            padding: "0.7rem 1.6rem",
            fontSize: "0.95rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          إعادة المحاولة / Try again
        </button>
      </body>
    </html>
  );
}
