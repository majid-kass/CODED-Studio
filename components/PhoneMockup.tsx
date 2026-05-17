import Image from "next/image";

type Props = {
  screenshotUrl: string;
  headline: string;
  projectName: string;
};

// 9:16 composition: what would become Frame 2 of the Reel.
// Phone frame is CSS-drawn (rounded bezel + dynamic island) with the screenshot inside.
// Layout uses fixed percentage heights so the phone never overflows the text region.
export function PhoneMockup({ screenshotUrl, headline, projectName }: Props) {
  return (
    <div className="relative w-full aspect-[9/16] overflow-hidden rounded-2xl bg-[#14243F] flex flex-col">
      <div className="absolute inset-0 glow-teal opacity-90 pointer-events-none" />

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
          <p className="text-[10px] tracking-[0.3em] uppercase text-aiapp-aqua mb-1.5">
            Built with AI
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
          <div className="absolute -inset-8 blur-3xl glow-teal -z-10" />
          <div className="relative h-full w-full rounded-[26px] bg-black p-[4px] shadow-[0_30px_60px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
            <div className="relative h-full w-full overflow-hidden rounded-[22px] bg-aiapp-bg/30">
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
