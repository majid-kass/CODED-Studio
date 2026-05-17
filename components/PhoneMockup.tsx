import Image from "next/image";
import { brandBg, getSegment, type SegmentKey } from "@/lib/brandTheme";

type Props = {
  screenshotUrl: string;
  headline: string;
  projectName: string;
  segment?: SegmentKey;
};

// 9:16 composition (queue preview). Mirrors the static PNG render — same layout,
// same per-segment palette — so admins see what the actual download will look like.
export function PhoneMockup({ screenshotUrl, headline, projectName, segment }: Props) {
  const seg = getSegment(segment);
  const bg = brandBg(seg);

  return (
    <div
      className="relative w-full aspect-[9/16] overflow-hidden rounded-2xl flex flex-col"
      style={{ backgroundColor: bg.base }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: bg.cssGradient, opacity: 0.95 }}
      />
      {bg.cssOverlay && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: bg.cssOverlay }}
        />
      )}

      <div
        className="relative z-10 px-5 pt-5 flex flex-col gap-3"
        style={{ height: "32%" }}
      >
        <Image
          src="/brand/coded-logo-white.png"
          alt="AI App Developer Bootcamp"
          width={130}
          height={42}
          style={{ height: "auto" }}
          className="opacity-95"
        />
        <div>
          <p
            className="text-[10px] tracking-[0.3em] uppercase mb-1.5"
            style={{ color: seg.accent }}
          >
            Built with AI · {seg.label}
          </p>
          <h2 className="text-white text-[22px] font-extrabold leading-[1.05] line-clamp-3">
            {headline}
          </h2>
        </div>
      </div>

      <div
        className="relative z-10 flex items-center justify-center px-4"
        style={{ height: "58%" }}
      >
        <div className="relative h-full aspect-[9/19.5] py-4">
          <div className="absolute h-full w-full rounded-[26px] bg-black p-[4px] shadow-[0_30px_60px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
            <div className="relative h-full w-full overflow-hidden rounded-[22px] bg-white/5">
              <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10 h-[10px] w-[46px] rounded-full bg-black" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={screenshotUrl}
                alt={projectName}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover object-top"
              />
            </div>
          </div>
        </div>
      </div>

      <div
        className="relative z-10 px-5 pb-5 flex items-center justify-between text-[9px] uppercase tracking-[0.3em] text-white/70"
        style={{ height: "10%" }}
      >
        <span>coded.kw</span>
        <span>@coded.kw</span>
      </div>
    </div>
  );
}
