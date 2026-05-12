const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require("../config");
const logger = require("../logger");

class AIService {
  constructor(cfg) {
    this.cfg = cfg || config;
    this.apiKey = this.cfg.GEMINI_API_KEY;
    this.model = this.cfg.GEMINI_MODEL;
    
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
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
      logger.info("Gemini API key missing — using fallback");
      return this._fallback(vibe, recipient, language);
    }

    try {
      const model = this.genAI.getGenerativeModel({ 
        model: this.model,
        systemInstruction: `
You are an expert writer for funny roasts and heartfelt toasts.

Rules:
1. Use VERY SIMPLE language.
2. No difficult words.
3. Sound like close friends talking.
4. Hindi should be casual spoken Hindi.
5. Marathi should be casual spoken Marathi.
6. Roast should be funny, playful, and relatable.
7. Toast should feel warm and genuine.
8. Minimum 5-6 complete and detailed sentences.
9. Output ONLY this format:
10. Use a moderate/medium level of relevant emojis naturally throughout the Body text. Let the context decide the exact amount, but keep it expressive and lively.

Title: ...
Body: ...
`
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();

      logger.debug("Raw Gemini response: " + content.substring(0, 500));

      const parsed = this._parseTitleAndBody(content);

      if (parsed?.title && parsed?.body) {
        return {
          title: parsed.title,
          body: parsed.body,
          source: "gemini",
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
      logger.error("Gemini Error: " + err.message);
      return this._fallback(vibe, recipient, language);
    }
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
Vary the title style—don't always use "[Name] साठी खास". Use different patterns like "आपल्या [Name] बद्दल...", "एक अवलिया: [Name]", etc.
`;

      if (isToast) {
        examples = `
Example 1:
Title: आपल्या सानिका बद्दल थोडंसं... ❤️
Body: सानिका, तुझा स्वभाव खरंच खूप भारी आहे. ❤️ तू सगळ्यांशी इतक्या प्रेमाने बोलतेस की कोणालाही तुझं वेड लागेल. तुझ्या मनात कोणाबद्दलच काही वाईट नसतं. ✨

Example 2:
Title: सानिका: एका गोड व्यक्तीसाठी 🥂
Body: सानिका सोबत वेळ कसा जातो कळतच नाही. ती जिथे असते तिथे नेहमी positive ऊर्जा असते. 🌟 सानिका सारखी मैत्रीण मिळणं खरंच नशिबाची गोष्ट आहे. 🙌

Example 3:
Title: सानिका साठी एक Cheers! 🌟
Body: सानिका, तू नेहमी दुसऱ्यांचा विचार आधी करतेस आणि ते बघून खूप छान वाटतं. ✨ तू अशीच राहा आणि तुला आयुष्यात खूप सारा आनंद आणि यश मिळो. 🥂
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

    // ===== HINGLISH =====
    else if (lang === "hinglish") {
      languageRule = `
Write in Hinglish (Hindi language using English alphabet/Roman script).
Use very casual Gen-Z or millennial slang.
Mix Hindi and English words naturally as people do in WhatsApp chats.
Sound like a cool friend.
`;

      if (isToast) {
        examples = `
Example:
Title: Rahul ke liye cheers 🥂
Body: Rahul sach mein ek gem hai. Iske saath rehne se life thodi easy lagne lagti hai. Jahan bhi jata hai, positivity faila deta hai. Bro, you deserve all the success and happiness in the world!
`;
      } else {
        examples = `
Example:
Title: Rahul: Legend of Confusion 😂
Body: Rahul bhai ka level hi alag hai. Simple se kaam ko bhi ye mission impossible bana deta hai. Confidence itna hai ki Google ko bhi doubt ho jaye. Par dil ka saaf hai, entertainment ki tension nahi.
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
- minimum 5-6 full sentences

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
- minimum 5-6 full sentences

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
        title: lines[0].replace(/^title:\s*/i, "").trim(),
        body: lines.slice(1).join(" ").replace(/^body:\s*/i, "").trim(),
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
          title: `आपल्या ${name} बद्दल थोडंसं... ❤️`,
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

    if (language.toLowerCase() === "hinglish") {
      if (isToast) {
        return {
          title: `Cheers to ${name} 🥂`,
          body: `${name} sach mein ek awesome person hai. Iske saath rehna hamesha fun hota hai. Life mein isse saari khushiyan mile. You are the best!`,
          source: "fallback",
          model: "template",
        };
      }

      return {
        title: `${name}: Total Legend 😂`,
        body: `${name} ka logic hi alag level ka hota hai. Simple kaam ko bhi complicate karna iski hobby hai. Confidence toh full hai par skills ka pata nahi. But entertainment pakka hai!`,
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