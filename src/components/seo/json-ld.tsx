export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output of our own trusted, typed objects.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
