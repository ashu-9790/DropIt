const config = require("../config");
const logger = require("../logger");

class AIService {
  constructor(cfg) {
    this.cfg = cfg || config;
    this.apiKey = this.cfg.OPENROUTER_API_KEY;
    this.model = this.cfg.OPENROUTER_MODEL;
  }

  async generate(
    {
      vibe = "Roast",
      recipient = "",
      language = "English",
      tone = "funny",
    } = {},
    retry = 0
  ) {
    const prompt = this._buildPrompt({
      vibe,
      recipient,
      language,
      tone,
    });

    if (!this.apiKey) {
      logger.info("OpenRouter API key missing — using fallback");
      return this._fallback(vibe, recipient, language);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.cfg.REQUEST_TIMEOUT_MS
      );

      const res = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://dropit.me",
            "X-Title": "DropIt",
          },
          body: JSON.stringify(this._makeRequestBody(prompt)),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      const text = await res.text();

      if (!res.ok) {
        logger.error(
          `OpenRouter HTTP ${res.status}: ${text.substring(0, 200)}`
        );
        return this._fallback(vibe, recipient, language);
      }

      logger.debug("Raw AI response: " + text.substring(0, 500));

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        logger.error("Invalid JSON from OpenRouter");
        return this._fallback(vibe, recipient, language);
      }

      const content = parsed?.choices?.[0]?.message?.content || "";

      const result = this._parseTitleAndBody(content);

      if (result?.title && result?.body) {
        return {
          title: result.title,
          body: result.body,
          source: "openrouter",
          model: this.model,
        };
      }

      if (retry < 1) {
        logger.warn("Bad AI format. Retrying once...");
        return this.generate(
          {
            vibe,
            recipient,
            language,
            tone,
          },
          retry + 1
        );
      }

      return this._fallback(vibe, recipient, language);
    } catch (err) {
      logger.error(err.message);
      return this._fallback(vibe, recipient, language);
    }
  }

  _makeRequestBody(prompt) {
    return {
      model: this.model,
      messages: [
        {
          role: "system",
          content: `
You are an expert writer for funny roasts and heartfelt toasts.

Rules:
1. Use VERY SIMPLE language.
2. No difficult words.
3. Sound like close friends talking.
4. Hindi should be casual spoken Hindi.
5. Marathi should be casual spoken Marathi.
6. Roast should be funny, playful, and relatable.
7. Toast should feel warm and genuine.
8. Minimum 4 complete sentences.
9. Output ONLY this format:

Title: ...
Body: ...
`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.9,
      top_p: 0.95,
      frequency_penalty: 0.3,
      presence_penalty: 0.3,
      max_tokens: 700,
    };
  }

  _buildPrompt({ vibe, recipient, language, tone }) {
  const name = recipient || "someone";
  const isToast = vibe.toLowerCase().includes("toast");
  const lang = language.toLowerCase();

  let languageRule = "";
  let examples = "";

  // ===== MARATHI =====
  if (lang === "marathi") {
    languageRule = `
Write in very simple spoken Marathi.
Use everyday Marathi people actually speak.
Avoid formal Marathi completely.
Use natural friendly words.
If roast, use funny "tomne" like close friends teasing each other.
`;

    if (isToast) {
      examples = `
Example:
Title: राहुलसाठी खास 🥂
Body: राहुल खरंच खूप छान माणूस आहे. त्याच्या सोबत वेळ कसा जातो कळतच नाही. तो जिथे असतो तिथे नेहमी positive vibe असते. आयुष्यात त्याला खूप आनंद आणि यश मिळो.
`;
    } else {
      examples = `
Example:
Title: राहुल म्हणजे चालता-बोलता गोंधळ 😂
Body: राहुल साधं काम पण somehow कठीण करून दाखवतो. त्याचा confidence मात्र भन्नाट आहे. कसं manage करतो ते देवच जाणे. पण entertainment full मिळतं हे नक्की.
`;
    }
  }

  // ===== HINDI =====
  else if (lang === "hindi") {
    languageRule = `
Write in simple spoken Hindi.
Use casual everyday Hindi.
Basic English words can mix naturally.
Avoid formal shuddh Hindi.
`;

    if (isToast) {
      examples = `
Example:
Title: राहुल के नाम 🥂
Body: राहुल सच में बहुत अच्छे इंसान हैं. इनके साथ समय हमेशा अच्छा निकलता है. ये जहां होते हैं वहां अच्छी energy रहती है. जिंदगी इन्हें बहुत सारी खुशियां दे.
`;
    } else {
      examples = `
Example:
Title: राहुल अलग ही नमूना है 😂
Body: राहुल आसान काम भी मुश्किल बना देता है. confidence पूरा आसमान पर रहता है. कैसे manage करता है ये कोई नहीं जानता. लेकिन entertainment पूरा देता है.
`;
    }
  }

  // ===== ENGLISH =====
  else {
    languageRule = `
Write in simple everyday English.
No difficult vocabulary.
`;

    if (isToast) {
      examples = `
Example:
Title: Cheers to Rahul 🥂
Body: Rahul is the kind of person who makes every day better. Being around him always feels fun and easy. He brings good energy wherever he goes. Hope life gives him all the happiness he deserves.
`;
    } else {
      examples = `
Example:
Title: Rahul: Walking Confusion 😂
Body: Rahul can make even simple things look difficult. His confidence is much higher than his actual skills. Somehow he still manages to survive every day. Honestly, that itself deserves respect.
`;
    }
  }

  // ===== FINAL PROMPT =====
  if (isToast) {
    return `
Write a heartfelt casual toast for ${name}.

${languageRule}

Tone: ${tone}

Requirements:
- warm
- simple
- genuine
- minimum 4 full sentences

${examples}

Output format:
Title: ...
Body: ...
`;
  }

  return `
Write a funny roast for ${name}.

${languageRule}

Tone: ${tone}

Requirements:
- funny
- playful
- relatable
- friendly teasing
- not offensive
- minimum 4 full sentences

${examples}

Output format:
Title: ...
Body: ...
`;
}

  _parseTitleAndBody(text) {
    if (!text) return null;

    const cleaned = text.trim();

    const titleMatch = cleaned.match(
      /(?:^|\n)\s*\**title\**\s*:\s*(.+?)(?=\n|$)/i
    );

    const bodyMatch = cleaned.match(
      /(?:^|\n)\s*\**body\**\s*:\s*([\s\S]+)/i
    );

    if (titleMatch && bodyMatch) {
      return {
        title: titleMatch[1]
          .trim()
          .replace(/^["'`]+|["'`]+$/g, ""),
        body: bodyMatch[1]
          .trim()
          .replace(/^["'`]+|["'`]+$/g, ""),
      };
    }

    const lines = cleaned.split("\n").filter(Boolean);

    if (lines.length >= 2) {
      return {
        title: lines[0],
        body: lines.slice(1).join(" "),
      };
    }

    return null;
  }

  _fallback(vibe, recipient, language) {
    const name = recipient || "you";
    const isToast = vibe.toLowerCase().includes("toast");

    if (language.toLowerCase() === "marathi") {
      if (isToast) {
        return {
          title: `${name} साठी खास 🥂`,
          body: `${name} खरंच खूप छान व्यक्ती आहे. त्याच्या आसपास असलं की वातावरणच चांगलं होतं. नेहमी असाच आनंदी राहा. आयुष्यात खूप यश मिळो.`,
          source: "fallback",
          model: "template",
        };
      }

      return {
        title: `${name} म्हणजे वेगळाच नमुना 😂`,
        body: `${name} साधं काम पण अवघड करून दाखवतो. आत्मविश्वास मात्र भन्नाट आहे. कसं काय manage करतो देव जाणे. पण entertainment full आहे.`,
        source: "fallback",
        model: "template",
      };
    }

    if (language.toLowerCase() === "hindi") {
      if (isToast) {
        return {
          title: `${name} के नाम 🥂`,
          body: `${name} सच में बहुत अच्छे इंसान हैं. इनके साथ समय अच्छा निकलता है. हमेशा ऐसे ही खुश रहो. जिंदगी में बहुत आगे बढ़ो.`,
          source: "fallback",
          model: "template",
        };
      }

      return {
        title: `${name} अलग ही level पर है 😂`,
        body: `${name} आसान चीज़ भी मुश्किल बना देता है. confidence पूरा आसमान पर है. कैसे manage करता है पता नहीं. लेकिन entertaining ज़रूर है.`,
        source: "fallback",
        model: "template",
      };
    }

    if (isToast) {
      return {
        title: `Cheers to ${name} 🥂`,
        body: `${name} truly makes life better for everyone around. Being with them always feels fun and easy. Hope happiness always stays with them. They deserve the best.`,
        source: "fallback",
        model: "template",
      };
    }

    return {
      title: `${name}: Pure Chaos 😂`,
      body: `${name} can make simple things look complicated. Confidence is never the problem. Somehow they still survive every day. Honestly, that's impressive.`,
      source: "fallback",
      model: "template",
    };
  }
}

module.exports = AIService;