import { Composition } from "remotion";
import {
  MarketingReel,
  REEL_DURATION_FRAMES,
  REEL_FPS,
  marketingReelSchema,
} from "./MarketingReel";

export const Root = () => {
  return (
    <>
      <Composition
        id="MarketingReel"
        component={MarketingReel}
        durationInFrames={REEL_DURATION_FRAMES}
        fps={REEL_FPS}
        width={1080}
        height={1920}
        schema={marketingReelSchema}
        defaultProps={{
          headline: "A Booking Platform For A Rooftop",
          projectName: "Loft 5",
          segmentLabel: "AI App Developer",
          shotDataUrl: "",
          shotWidth: 780,
          shotHeight: 1688,
          bgBase: "#14243F",
          bgAccent: "#26456a",
          bgGradient: "radial-gradient(circle at 50% 60%, rgba(0,185,180,0.4) 0%, #026678 50%, #0a1326 100%)",
          bgOverlay: "",
          segAccent: "#16D7D1",
        }}
      />
    </>
  );
};
