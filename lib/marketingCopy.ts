import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export type MarketingCopy = {
  headline: string;
  caption: string;
  hashtags: string[];
  language: "en" | "ar";
};

function isArabic(text: string): boolean {
  const arabicChars = (text.match(/[؀-ۿ]/g) || []).length;
  return arabicChars > text.length * 0.25;
}

const SYSTEM_EN = `You're the marketing copywriter for CODED, a Kuwait-based tech education company that runs an AI App Developer Bootcamp.

Your job: turn a one-line project pitch into Instagram-ready marketing copy that promotes the product (not the trainee). The audience is adults 25–50+ who are curious about building real products with AI — entrepreneurs, professionals, side-project people.

Tone: confident, modern, founder-aspirational. No corporate fluff. No hype-marketing emojis. The headline should make a scroller stop. The caption should sell the product first, then the "built with AI / built fast" angle as proof.

Headline rules:
- 4–8 words max
- Sentence case (NOT Title Case)
- Punchy, benefit-led or curiosity-led
- No quotes, no period at end

Caption rules:
- 3–5 short paragraphs (single line each is fine)
- Separate paragraphs with REAL line breaks (an actual newline character — NOT the literal text "\\n")
- Hook → what it does → why it matters → soft CTA
- ~80–120 words total
- One subtle emoji max, only if it genuinely fits. No emojis is also fine.

Hashtag rules:
- 6–9 hashtags total
- Mix: 2–3 CODED-branded (#CODED #AIAppDeveloper #BuiltWithAI), 2–3 product/category (e.g. #booking #eventspace), 2–3 regional/discovery (#KuwaitTech #StartupKW #Q8Tech)
- All lowercase except brand names`;

const SYSTEM_AR = `أنت كاتب المحتوى التسويقي لشركة CODED، وهي شركة تعليم تقني في الكويت تقدّم بوت كامب "مطوّر تطبيقات الذكاء الاصطناعي".

مهمتك: تحويل وصف قصير لمشروع إلى محتوى تسويقي جاهز للنشر على إنستغرام، يروّج للمنتج (وليس للمتدرّب). الجمهور: بالغون من 25 إلى 50+ مهتمّون ببناء منتجات حقيقية بالذكاء الاصطناعي — رواد أعمال، مهنيون، وأصحاب مشاريع جانبية.

نبرة الكتابة: واثقة، عصرية، تخاطب طموح المؤسّسين. لا حشو شركاتي. لا إيموجي ترويجي مبالغ به. العنوان يجب أن يوقف القارئ في مكانه. التسمية التوضيحية تبيع المنتج أولاً، ثم تعزّز مصداقيته بزاوية "تم بناؤه بالذكاء الاصطناعي، وبسرعة".

قواعد العنوان (headline):
- من 3 إلى 7 كلمات
- مباشر، يطرح فائدة أو فضولاً
- بدون علامات اقتباس وبدون نقطة في النهاية

قواعد التسمية التوضيحية (caption):
- من 3 إلى 5 فقرات قصيرة (سطر واحد لكل فقرة مقبول)
- افصل بين الفقرات بأسطر فعلية (newline حقيقي، وليس النصّ الحرفي "\\n")
- البداية → ماذا يفعل المنتج → لماذا يهم → دعوة لطيفة لاتخاذ إجراء
- ~80–120 كلمة إجمالاً
- إيموجي واحد كحد أقصى، إن كان يخدم. بدون إيموجي مقبول.

قواعد الهاشتاقات:
- من 6 إلى 9 هاشتاقات
- مزيج: 2–3 هاشتاقات CODED بالإنجليزية (#CODED #AIAppDeveloper #BuiltWithAI)، 2–3 خاصة بفئة المنتج (مثل #booking #eventspace)، 2–3 محلية أو اكتشاف (#KuwaitTech #StartupKW #Q8Tech)`;

export async function generateMarketingCopy(input: {
  name: string;
  pitch: string;
}): Promise<MarketingCopy> {
  const language: "en" | "ar" = isArabic(input.pitch) ? "ar" : "en";
  const system = language === "ar" ? SYSTEM_AR : SYSTEM_EN;

  const userPrompt =
    language === "ar"
      ? `اسم المشروع: ${input.name}\n\nالوصف: ${input.pitch}\n\nاكتب العنوان والتسمية التوضيحية والهاشتاقات.`
      : `Project name: ${input.name}\n\nPitch: ${input.pitch}\n\nWrite the headline, caption, and hashtags.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: system,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [
      {
        name: "submit_copy",
        description: "Submit the finalized marketing copy.",
        input_schema: {
          type: "object",
          properties: {
            headline: {
              type: "string",
              description: "4–8 word headline, sentence case, no period.",
            },
            caption: {
              type: "string",
              description:
                "3–5 short paragraphs separated by \\n\\n. ~80–120 words.",
            },
            hashtags: {
              type: "array",
              items: { type: "string" },
              description: "6–9 hashtags, each starting with #.",
            },
          },
          required: ["headline", "caption", "hashtags"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "submit_copy" },
    messages: [{ role: "user", content: userPrompt }],
  });

  const toolUse = response.content.find((c) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return structured copy");
  }
  const out = toolUse.input as {
    headline: string;
    caption: string;
    hashtags: string[];
  };

  // Normalize: ensure each hashtag starts with #
  const hashtags = out.hashtags.map((h) =>
    h.trim().startsWith("#") ? h.trim() : `#${h.trim()}`
  );

  // Safety net: if Claude returned literal "\n" as text instead of real newlines, fix it.
  const caption = out.caption.trim().replace(/\\n/g, "\n");

  return {
    headline: out.headline.trim(),
    caption,
    hashtags,
    language,
  };
}
