const config = require("../config");
const logger = require("../logger");

class AIService {
  constructor(cfg) {
    this.cfg = cfg || config;
    this.apiKey = this.cfg.OPENROUTER_API_KEY;
    this.model = this.cfg.OPENROUTER_MODEL;
  }

  async generate({
    vibe = "Roast",
    recipient = "",
    language = "English",
    tone = "funny",
  } = {}) {
    const prompt = this._buildPrompt({ vibe, recipient, language, tone });
    
    if (!this.apiKey) {
      logger.info("OpenRouter API key not configured — using fallback");
      return this._fallback(vibe, recipient);
    }

    try {
      const url = "https://openrouter.ai/api/v1/chat/completions";
      const body = this._makeRequestBody(prompt);

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.cfg.REQUEST_TIMEOUT_MS);

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://dropit.me",
            "X-Title": "DropIt"
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const text = await res.text();
        if (!res.ok) {
          logger.error(
            `OpenRouter HTTP ${res.status} ${res.statusText} - response: ${text.substring(0, 200)}`
          );
          return this._fallback(vibe, recipient);
        }

        // Log raw response for debugging
        logger.debug(`OpenRouter raw response: ${text.substring(0, 500)}`);

        let parsed = null;
        try {
          parsed = JSON.parse(text);
        } catch (e) {
          logger.error("Failed to parse OpenRouter response as JSON");
          return this._fallback(vibe, recipient);
        }

        if (parsed && parsed.choices && parsed.choices[0]) {
          const content = parsed.choices[0].message?.content || "";
          const candidate = this._parseTitleAndBody(content);
          
          if (candidate && candidate.title && candidate.body) {
            logger.info(
              `OpenRouter success: model="${this.model}" title="${candidate.title}" body="${candidate.body.substring(0, 100)}${candidate.body.length > 100 ? '...' : ''}"`
            );
            return {
              title: candidate.title,
              body: candidate.body,
              source: "openrouter",
              model: this.model,
            };
          }
        }

        logger.warn(
          `OpenRouter returned unrecognized response; falling back to template. Response: ${text.substring(0, 200)}`
        );
        return this._fallback(vibe, recipient);
      } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === "AbortError") {
          logger.error(`OpenRouter request timeout after ${this.cfg.REQUEST_TIMEOUT_MS}ms`);
        } else {
          logger.error("OpenRouter request failed: " + (err && err.message));
        }
        return this._fallback(vibe, recipient);
      }
    } catch (err) {
      logger.error("OpenRouter service error: " + (err && err.message));
      return this._fallback(vibe, recipient);
    }
  }

  _makeRequestBody(prompt) {
    return {
      model: this.model,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 2000,
    };
  }

  _parseTitleAndBody(text) {
    if (!text) return null;
    
    const normalized = text.trim();

    // Try to match Title: and Body: format
    const titleMatch = normalized.match(/(?:^|\n)\s*title\s*:\s*(.+?)(?=\n|$)/i);
    const bodyMatch = normalized.match(/(?:^|\n)\s*body\s*:\s*([\s\S]+?)(?=\n\n|$)/i);

    if (titleMatch && bodyMatch) {
      let title = titleMatch[1].trim();
      let body = bodyMatch[1].trim();
      
      // Clean up quotes and extra formatting
      title = title.replace(/^["'`]+|["'`]+$/g, "").trim();
      body = body.replace(/^["'`]+|["'`]+$/g, "").trim();
      
      // If body is empty or too short, try to get everything after "Body:"
      if (!body || body.length < 10) {
        const bodyIndex = normalized.toLowerCase().indexOf('body:');
        if (bodyIndex !== -1) {
          body = normalized.substring(bodyIndex + 5).trim();
          body = body.replace(/^["'`]+|["'`]+$/g, "").trim();
        }
      }

      if (title && body) {
        return { title, body };
      }
    }

    // Fallback: split by first line break
    const lines = normalized.split(/\n+/).filter(l => l.trim());
    if (lines.length >= 2) {
      return {
        title: lines[0].replace(/^["'`]+|["'`]+$/g, "").trim(),
        body: lines.slice(1).join("\n").replace(/^["'`]+|["'`]+$/g, "").trim()
      };
    }

    return null;
  }

  _buildPrompt({ vibe, recipient, language, tone }) {
    const name = recipient || "someone";
    const isToast = vibe && vibe.toLowerCase().includes("toast");

    // Cultural instruction forcing simple, everyday language
    let culturalContext = "";
    if (language.toLowerCase() === "marathi") {
      culturalContext = "Use extremely simple, everyday Marathi. If roasting, use funny, relatable 'tomne' (taunts) that friends use with each other. If toasting, be warm but keep it casual, like a heartfelt WhatsApp message. ABSOLUTELY NO formal, bookish, or heavy Marathi words.";
    } else if (language.toLowerCase() === "hindi") {
      culturalContext = "Use very simple, everyday conversational Hindi (a natural mix with basic English words is okay). If roasting, use casual 'Desi' banter among friends. If toasting, keep it sweet and relatable. ABSOLUTELY NO heavy, formal 'Shuddh' Hindi.";
    } else {
      culturalContext = "Use simple, everyday conversational English. Write exactly how best friends text each other. No big dictionary words.";
    }

    const type = isToast ? "heartfelt but casual TOAST" : "hilarious, relatable ROAST";

    return `System: You are a hilarious and relatable friend writing a message.
Task: Write a ${type} for ${name} in ${language} language.
Tone/Context: ${tone}
${culturalContext}

Format your response EXACTLY as follows:
Title: [A catchy, funny, and simple title]
Body: [3 to 4 short sentences of high-quality ${vibe} content.]

Important Constraints:
1. USE SIMPLE LANGUAGE ONLY. Do not use high vocabulary, formal words, or poetic language. It must be easily understandable by a teenager.
2. Do NOT include any introductory text (like "Here is your roast").
3. Output ONLY the Title and Body in ${language}.`;
  }

  _fallback(vibe, recipient) {
    const name = recipient || "you";
    
    if (vibe === "Toast") {
      const toasts = [
        {
          title: `Here's to ${name}! 🥂`,
          body: `${name} is proof that awesome people exist. May your coffee be strong, your WiFi be fast, and your Monday mornings be tolerable. Cheers to being absolutely legendary! 🌟`
        },
        {
          title: `A Toast to ${name}'s Greatness`,
          body: `They say legends are born, not made. Well, ${name} is living proof. Here's to someone who makes the world brighter just by existing. Keep being amazing! 🎉`
        },
        {
          title: `Celebrating ${name} Today! 🎊`,
          body: `If ${name} was a superhero, their power would be making everyone around them better. Here's to the person who turns ordinary days into extraordinary memories! 🦸`
        }
      ];
      const toast = toasts[Math.floor(Math.random() * toasts.length)];
      logger.info(`Using fallback toast template: title="${toast.title}" body="${toast.body}"`);
      return { ...toast, source: "fallback", model: "template" };
    } else {
      const roasts = [
        {
          title: `${name}: A Walking Meme 🔥`,
          body: `${name} walks into a room and the WiFi apologizes for buffering. Even autocorrect gives up trying to fix their texts. But hey, at least they're consistently entertaining! 😂`
        },
        {
          title: `Roasting ${name} (Gently) 🌶️`,
          body: `${name}'s idea of multitasking is messing up several things at once. They're like a software update – nobody asked for them, but here they are anyway. Still love 'em though! 💀`
        },
        {
          title: `${name}: The Legend (in Their Own Mind)`,
          body: `${name} has the confidence of a toddler with a permanent marker. They're proof that you don't need talent when you have audacity. Respect the hustle! 🎭`
        },
        {
          title: `Breaking News: ${name} Exists! 📰`,
          body: `Scientists are still trying to figure out how ${name} functions on a daily basis. They're like a mystery wrapped in an enigma, covered in confusion. Truly one of a kind! 🤔`
        }
      ];
      const roast = roasts[Math.floor(Math.random() * roasts.length)];
      logger.info(`Using fallback roast template: title="${roast.title}" body="${roast.body}"`);
      return { ...roast, source: "fallback", model: "template" };
    }
  }
}

module.exports = AIService;
