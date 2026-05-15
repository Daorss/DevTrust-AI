const SPONSORS = [
  "Google Developer Groups",
  "Google Developer Groups",
  "Google Developer Groups",
  "Google Developer Groups",
];

function SponsorRow() {
  return (
    <div className="flex items-center gap-xxl px-xxl min-w-full justify-around grayscale opacity-50">
      {SPONSORS.map((name) => (
        <span
          key={name}
          className="font-sans text-headline-md font-bold tracking-tighter"
        >
          {name}
        </span>
      ))}
    </div>
  );
}

export default function SponsorBar() {
  return (
    <section className="border-y border-outline-variant/10 bg-surface-container-lowest overflow-hidden py-lg">
      {/* Duplicate row so the ticker loop is seamless */}
      <div className="flex animate-scroll whitespace-nowrap">
        <SponsorRow />
        <SponsorRow />
      </div>
    </section>
  );
}
