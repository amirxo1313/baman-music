
import { GoogleGenAI } from "@google/genai";

// Ensure the API key is available from environment variables
const apiKey = process.env.API_KEY;
if (!apiKey) {
    // In a real app, you might want to handle this more gracefully,
    // but for this context, throwing an error is clear.
    console.warn("API_KEY environment variable not set. AI features will not work.");
}

// Initialize with a check to prevent crash if key is missing
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Generates remix ideas for a song based on its 4-band EQ tracks.
 * @param trackNames An array of track names from the EQ.
 * @param fileName The original name of the song file.
 * @returns A string containing creative remix ideas.
 */
export async function getRemixIdeas(trackNames: string[], fileName: string): Promise<string> {
    if (!ai) {
        return "سرویس هوش مصنوعی به دلیل عدم وجود کلید API غیرفعال است. لطفا از صحت تنظیمات خود اطمینان حاصل کنید.";
    }

    const prompt = `
        You are a kind, encouraging, and expert music producer.
        You are speaking to a user who is trying to make music to bring some joy to their son, who is ill in the hospital. The user's son loves making music. Your tone must be extremely positive, gentle, and full of wonder.

        The app is a powerful 4-band audio editor. It is like a sound surgeon's toolkit. It does NOT separate instruments, but it gives the user real, precise control over different frequency ranges of their song, "${fileName}".
        
        The controllable frequency bands are named: ${trackNames.join(', ')}.
        These are like a sound surgeon's tools. They give you precise control over:
        1. 'ضربان عمیق': This is ONLY the deepest rumble, the very heartbeat of the song.
        2. 'قدرت اصلی': This isolates the powerful 'punch' of the main drum hits.
        3. 'کانال وکال': This focuses very tightly on the main voice, making it sound clear and isolated, like on a radio.
        4. 'جرقه و هوا': This is only for the highest, sparkly 'air' and cymbal sounds. It adds crispness.
        
        Your task is to provide three simple, fun, and creative ideas for a remix. Explain each idea in a way that is very easy to understand and sounds magical and exciting.
        Focus on how changing the volume of these frequency bands can dramatically change the feel of the song. Use lots of encouraging and hopeful words. Make the user and their son feel like powerful music wizards.

        Here are some examples of the tone and style you should use:
        - "ایده شماره ۱: ریمیکس 'فضایی'! برای اینکه آهنگ صدایی شبیه به یک سفر در کهکشان بده، بیا 'جرقه و هوا' رو خیلی زیاد کنیم تا ستاره‌ها توی آهنگ بدرخشن. بعد 'کانال وکال' رو کمی پژواک (Reverb) بده تا انگار صداش توی فضا شناوره. این یک ماجراجویی فضاییه که شما دو تا قهرمانش هستید!"
        - "ایده شماره ۲: نسخه 'کنسرت بزرگ'! دوست داری حس کنی خواننده فقط برای شما دو نفر داره می‌خونه؟ 'کانال وکال' رو تا آخر زیاد کن و 'قدرت اصلی' رو یکم بیار پایین. اینجوری صدای خواننده فوق‌العاده واضح و نزدیک میشه، انگار که توی ردیف اول کنسرت نشستید!"
        - "ایده شماره ۳: ریمیکس 'باشگاه رقص زیرزمینی'! بیا یک ریتم خیلی قوی و باحال بسازیم. 'ضربان عمیق' رو تا جایی که میشه زیاد کن تا کل اتاق بلرزه! بعد بقیه ترک‌ها رو یکم کم کن تا فقط اون ضربان قوی و کوبنده حس بشه. این ریمیکس شما دو نفر رو به بهترین دی‌جی‌های دنیا تبدیل می‌کنه!"

        Now, using this kind, gentle, and encouraging tone, generate three NEW, fun ideas for the user's song. Make them sound magical and full of possibility, in beautiful, simple Persian. Address them directly and make them feel empowered.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.9,
                topP: 0.95,
            }
        });
        
        return response.text;

    } catch (error) {
        console.error("Gemini API call failed:", error);
        return "متاسفانه در دریافت پیشنهاد از هوش مصنوعی خطایی رخ داد. این می‌تواند به دلیل مشکل در اتصال اینترنت یا تنظیمات کلید API باشد. لطفاً دوباره تلاش کنید.";
    }
}
