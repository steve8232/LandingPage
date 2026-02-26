import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const SCREENSHOTONE_ACCESS_KEY = process.env.SCREENSHOTONE_ACCESS_KEY!;
const SCREENSHOTONE_SECRET_KEY = process.env.SCREENSHOTONE_SECRET_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

function generateScreenshotUrl(url: string): string {
  const params = new URLSearchParams({
    access_key: SCREENSHOTONE_ACCESS_KEY,
    url: url,
    viewport_width: '1280',
    viewport_height: '900',
    device_scale_factor: '1',
    format: 'png',
    block_ads: 'true',
    block_cookie_banners: 'true',
    full_page: 'false',
  });

  const queryString = params.toString();
  const signature = crypto
    .createHmac('sha256', SCREENSHOTONE_SECRET_KEY)
    .update(queryString)
    .digest('hex');

  return `https://api.screenshotone.com/take?${queryString}&signature=${signature}`;
}

interface DesignAnalysis {
  colors: {
    primary: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    background: string;
    backgroundAlt: string;
    text: string;
    textMuted: string;
  };
  colorUsage: {
    heroBackground: string;
    heroText: string;
    ctaBackground: string;
    ctaText: string;
    sectionAltBackground: string;
    cardBackground: string;
    cardText: string;
    headerBackground: string;
    headerText: string;
    footerBackground: string;
    footerText: string;
  };
  colorHarmony: {
    scheme: string;
    saturation: string;
    contrast: string;
    dominantColor: string;
    accentUsage: string;
  };
  typography: {
    style: string;
    headingWeight: string;
    fontStack: string;
    headingCase: string;
  };
  layout: {
    style: string;
    borderRadius: string;
    spacing: string;
    buttonStyle: string;
    shadowIntensity: string;
  };
  mood: string;
  isDark: boolean;
}

async function analyzeImageWithVision(imageBase64: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert UI/UX designer analyzing website screenshots to extract complete design systems.
You must identify not just individual colors, but HOW colors are used together to create visual hierarchy and harmony.
Pay special attention to:
- The dominant background color (especially if it's a bold/dark color that covers large areas)
- How text colors contrast with their backgrounds
- Button/CTA colors and their relationship to the overall scheme
- Whether the design uses bold, saturated colors or muted, subtle tones
Always respond with valid JSON only.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this website screenshot and extract the COMPLETE design system. Focus on understanding how colors work TOGETHER, not just individual colors.

Return a JSON object with these exact fields:

{
  "colors": {
    "primary": "#hex - main brand/CTA button color (often orange, blue, green for action buttons)",
    "primaryDark": "#hex - darker shade for hover states",
    "secondary": "#hex - secondary brand color",
    "accent": "#hex - accent for highlights, badges, icons",
    "background": "#hex - THE DOMINANT background color (could be dark teal, navy, white, etc.)",
    "backgroundAlt": "#hex - alternate section background",
    "text": "#hex - main text color (must contrast with background)",
    "textMuted": "#hex - secondary/muted text"
  },
  "colorUsage": {
    "heroBackground": "#hex - exact background color of the hero/main section",
    "heroText": "#hex - text color used in hero section",
    "ctaBackground": "#hex - primary call-to-action button background",
    "ctaText": "#hex - text color on CTA buttons",
    "sectionAltBackground": "#hex - background for alternating sections",
    "cardBackground": "#hex - background for cards/content boxes",
    "cardText": "#hex - text color in cards",
    "headerBackground": "#hex - header/nav background",
    "headerText": "#hex - header text/link color",
    "footerBackground": "#hex - footer background",
    "footerText": "#hex - footer text color"
  },
  "colorHarmony": {
    "scheme": "complementary|analogous|triadic|monochromatic|split-complementary",
    "saturation": "vibrant|moderate|muted|desaturated",
    "contrast": "high|medium|low",
    "dominantColor": "#hex - the single most prominent color covering the largest area",
    "accentUsage": "bold-pops|subtle-highlights|minimal"
  },
  "typography": {
    "style": "modern|classic|playful|elegant|bold|minimal|industrial",
    "headingWeight": "400|500|600|700|800|900",
    "fontStack": "appropriate font-family CSS (e.g., 'Montserrat, sans-serif')",
    "headingCase": "normal|uppercase|capitalize"
  },
  "layout": {
    "style": "minimalist|corporate|creative|bold|elegant|modern|industrial",
    "borderRadius": "none|small|medium|large|full",
    "spacing": "compact|normal|spacious",
    "buttonStyle": "solid|outline|gradient|rounded-full",
    "shadowIntensity": "none|subtle|medium|strong"
  },
  "mood": "2-3 sentence description of the overall aesthetic, vibe, and target audience",
  "isDark": true if the dominant background is dark (dark blue, teal, black, navy, etc.)
}

CRITICAL: Look at the LARGEST colored areas first. If the hero section has a dark teal/green background covering most of the viewport, that's the dominant color and isDark should be true. Extract EXACT hex codes you observe.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'OpenAI API error');
  }

  const analysisContent = data.choices[0]?.message?.content || '{}';

  // Validate and return the JSON string
  try {
    const parsed = JSON.parse(analysisContent) as DesignAnalysis;
    // Ensure we have valid hex colors, provide defaults if missing
    const validated: DesignAnalysis = {
      colors: {
        primary: parsed.colors?.primary || '#2563eb',
        primaryDark: parsed.colors?.primaryDark || '#1d4ed8',
        secondary: parsed.colors?.secondary || '#6366f1',
        accent: parsed.colors?.accent || '#10b981',
        background: parsed.colors?.background || '#ffffff',
        backgroundAlt: parsed.colors?.backgroundAlt || '#f8fafc',
        text: parsed.colors?.text || '#1e293b',
        textMuted: parsed.colors?.textMuted || '#64748b',
      },
      colorUsage: {
        heroBackground: parsed.colorUsage?.heroBackground || parsed.colors?.background || '#ffffff',
        heroText: parsed.colorUsage?.heroText || parsed.colors?.text || '#1e293b',
        ctaBackground: parsed.colorUsage?.ctaBackground || parsed.colors?.primary || '#2563eb',
        ctaText: parsed.colorUsage?.ctaText || '#ffffff',
        sectionAltBackground: parsed.colorUsage?.sectionAltBackground || parsed.colors?.backgroundAlt || '#f8fafc',
        cardBackground: parsed.colorUsage?.cardBackground || '#ffffff',
        cardText: parsed.colorUsage?.cardText || parsed.colors?.text || '#1e293b',
        headerBackground: parsed.colorUsage?.headerBackground || parsed.colors?.background || '#ffffff',
        headerText: parsed.colorUsage?.headerText || parsed.colors?.text || '#1e293b',
        footerBackground: parsed.colorUsage?.footerBackground || '#1e293b',
        footerText: parsed.colorUsage?.footerText || '#ffffff',
      },
      colorHarmony: {
        scheme: parsed.colorHarmony?.scheme || 'complementary',
        saturation: parsed.colorHarmony?.saturation || 'moderate',
        contrast: parsed.colorHarmony?.contrast || 'high',
        dominantColor: parsed.colorHarmony?.dominantColor || parsed.colors?.background || '#ffffff',
        accentUsage: parsed.colorHarmony?.accentUsage || 'bold-pops',
      },
      typography: {
        style: parsed.typography?.style || 'modern',
        headingWeight: parsed.typography?.headingWeight || '700',
        fontStack: parsed.typography?.fontStack || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        headingCase: parsed.typography?.headingCase || 'normal',
      },
      layout: {
        style: parsed.layout?.style || 'modern',
        borderRadius: parsed.layout?.borderRadius || 'medium',
        spacing: parsed.layout?.spacing || 'normal',
        buttonStyle: parsed.layout?.buttonStyle || 'solid',
        shadowIntensity: parsed.layout?.shadowIntensity || 'subtle',
      },
      mood: parsed.mood || 'Professional and modern',
      isDark: parsed.isDark || false,
    };
    return JSON.stringify(validated);
  } catch {
    // Return default design if parsing fails
    return JSON.stringify(getDefaultDesign());
  }
}

function getDefaultDesign(): DesignAnalysis {
  return {
    colors: {
      primary: '#2563eb',
      primaryDark: '#1d4ed8',
      secondary: '#6366f1',
      accent: '#10b981',
      background: '#ffffff',
      backgroundAlt: '#f8fafc',
      text: '#1e293b',
      textMuted: '#64748b',
    },
    colorUsage: {
      heroBackground: '#ffffff',
      heroText: '#1e293b',
      ctaBackground: '#2563eb',
      ctaText: '#ffffff',
      sectionAltBackground: '#f8fafc',
      cardBackground: '#ffffff',
      cardText: '#1e293b',
      headerBackground: '#ffffff',
      headerText: '#1e293b',
      footerBackground: '#1e293b',
      footerText: '#ffffff',
    },
    colorHarmony: {
      scheme: 'complementary',
      saturation: 'moderate',
      contrast: 'high',
      dominantColor: '#ffffff',
      accentUsage: 'bold-pops',
    },
    typography: {
      style: 'modern',
      headingWeight: '700',
      fontStack: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      headingCase: 'normal',
    },
    layout: {
      style: 'modern',
      borderRadius: 'medium',
      spacing: 'normal',
      buttonStyle: 'solid',
      shadowIntensity: 'subtle',
    },
    mood: 'Professional and modern',
    isDark: false,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Get screenshot URL
    const screenshotUrl = generateScreenshotUrl(url);

    // Fetch the screenshot
    const screenshotResponse = await fetch(screenshotUrl);
    
    if (!screenshotResponse.ok) {
      throw new Error('Failed to capture screenshot');
    }

    // Convert to base64
    const buffer = await screenshotResponse.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const imageBase64 = `data:image/png;base64,${base64}`;

    // Analyze with OpenAI Vision
    const analysis = await analyzeImageWithVision(imageBase64);

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error analyzing URL:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze URL' },
      { status: 500 }
    );
  }
}

