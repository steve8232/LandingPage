import { NextRequest, NextResponse } from 'next/server';
import { FormData, GeneratedContent } from '@/types';
import { generateHTML } from '@/lib/generateHtml';
import { generateFullCSS } from '@/lib/generateCss';

// ── v1 adapter ─────────────────────────────────────────────────────────────────
// If the selected template is a v1 spec, we use the v1 composer instead of the
// legacy pipeline.  The legacy code below remains completely untouched.
import { isV1Template, getV1Spec } from '../../../../v1/specs/index';
import { composeV1Template } from '../../../../v1/composer/composeV1Template';
import { generateV1Content, V1FormInput } from '../../../../v1/composer/generateV1Content';
import { enhanceV1Content } from '../../../../v1/composer/enhanceV1Content';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function generateContent(formData: FormData): Promise<GeneratedContent> {
  // Use template industry keywords if available for context
  const industryContext = formData.selectedTemplate?.industryKeywords?.join(', ') || '';
  const templateMood = formData.selectedTemplate?.design?.mood || '';

  const prompt = `You are a conversion copywriter. Generate compelling landing page content based on this information:

Product/Service: ${formData.business.productService}
Offer: ${formData.business.offer}
Pricing: ${formData.business.pricing}
Call-to-Action: ${formData.business.cta}
Unique Value: ${formData.business.uniqueValue}
Why Customers Love Them: ${formData.business.customerLove}
${industryContext ? `Industry Context: ${industryContext}` : ''}
${templateMood ? `Desired Mood: ${templateMood}` : ''}

Design Style: ${formData.design.designAnalysis || 'Modern, professional, conversion-focused'}

Generate the following in JSON format:
{
  "headline": "A powerful, persuasive headline (max 10 words)",
  "subheadline": "A compelling value proposition (max 25 words)",
  "offerDescription": "Clear description of the offer and what's included (2-3 sentences)",
  "sellingPoints": ["4 unique selling points as short bullet points"],
  "testimonials": [
    {"quote": "A realistic, short testimonial quote", "name": "First Last", "title": "Title/Role"},
    // Generate 7 more testimonials (8 total)
  ]
}

Make testimonials realistic and varied, based on the customer benefits mentioned. Each should highlight different aspects of why customers love this business.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a professional copywriter. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    }),
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message || 'OpenAI API error');
  }

  const parsed = JSON.parse(data.choices[0]?.message?.content || '{}');

  // Ensure all required fields have defaults
  return {
    headline: parsed.headline || 'Transform Your Business Today',
    subheadline: parsed.subheadline || 'Discover how we can help you achieve your goals',
    offerDescription: parsed.offerDescription || 'Our comprehensive solution provides everything you need to succeed.',
    sellingPoints: Array.isArray(parsed.sellingPoints) ? parsed.sellingPoints : [
      'Professional quality results',
      'Fast and reliable service',
      'Expert support available',
      'Satisfaction guaranteed',
    ],
    testimonials: Array.isArray(parsed.testimonials) ? parsed.testimonials : [
      { quote: 'Excellent service! Highly recommended.', name: 'John D.', title: 'Business Owner' },
      { quote: 'Transformed the way we work.', name: 'Sarah M.', title: 'Marketing Director' },
      { quote: 'Best decision we ever made.', name: 'Mike R.', title: 'CEO' },
      { quote: 'Outstanding results every time.', name: 'Emily W.', title: 'Project Manager' },
    ],
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData: FormData = await request.json();

    // ── v1 adapter: intercept v1 template IDs ──────────────────────────────
    // If the templateId belongs to the v1 spec system, render via the v1
    // composer and return early.  Legacy logic below is never reached.
    const templateId = formData.selectedTemplate?.id;
    if (templateId && isV1Template(templateId)) {
      console.log(`[v1 adapter] Rendering v1 template: ${templateId}`);

      // Map form data to v1 input shape
      const v1Input: V1FormInput = {
        business: {
          productService: formData.business.productService || '',
          offer: formData.business.offer || '',
          pricing: formData.business.pricing || '',
          cta: formData.business.cta || '',
          uniqueValue: formData.business.uniqueValue || '',
          customerLove: formData.business.customerLove || '',
          images: formData.business.images || [],
        },
        contact: {
          email: formData.contact?.email || '',
          phone: formData.contact?.phone || '',
        },
      };

      // Load spec and generate AI content overrides
      const spec = getV1Spec(templateId);
      let overrides;
      if (spec) {
        overrides = await generateV1Content(v1Input, spec);
        console.log('[v1 adapter] Content overrides generated');

        // Second pass: polish copy + generate SEO metadata, alt texts, form labels
        overrides = await enhanceV1Content(v1Input, spec, overrides);
        console.log('[v1 adapter] Enhancement pass complete');
      }

	      // For the interactive app output we allow remote demo images (when used)
	      // so pages look richly illustrated without requiring user uploads.
	      // Previews/build artifacts can still opt to stay fully offline.
	      const { html } = composeV1Template(templateId, overrides, { allowRemoteDemoImages: true });
      return NextResponse.json({
        html,
        css: '',       // CSS is inlined in the v1 HTML
        preview: html, // v1 output is already self-contained
        content: null,
      });
    }
    // ── end v1 adapter ─────────────────────────────────────────────────────

    // Debug logging
    console.log('=== DEBUG: Generate Landing Page ===');
    console.log('Selected Template:', formData.selectedTemplate?.name || 'None');
    console.log('Design Analysis:', formData.design.designAnalysis ? 'Present (length: ' + formData.design.designAnalysis.length + ')' : 'Empty');
    console.log('Template colors primary:', formData.selectedTemplate?.design?.colors?.primary);

    // Generate content using OpenAI
    const content = await generateContent(formData);

    console.log('=== DEBUG: Generated Content ===');
    console.log('Headline:', content.headline);
    console.log('Subheadline:', content.subheadline);
    console.log('Selling Points count:', content.sellingPoints?.length || 0);
    console.log('Testimonials count:', content.testimonials?.length || 0);

    // Generate CSS using the full generator (pass template for design defaults)
    const css = generateFullCSS(
      formData.design.designAnalysis || '',
      formData.selectedTemplate
    );

    // Log first 500 chars of CSS to verify colors
    console.log('=== DEBUG: CSS (first 500 chars) ===');
    console.log(css.substring(0, 500));

    // Generate HTML (pass template for section control)
    const { html } = generateHTML(formData, content, css, formData.selectedTemplate);

    // Create inline preview (CSS embedded in HTML)
    const preview = html.replace(
      '<link rel="stylesheet" href="styles.css">',
      `<style>${css}</style>`
    );

    return NextResponse.json({
      html,
      css,
      preview,
      content
    });
  } catch (error) {
    console.error('Error generating landing page:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate landing page' },
      { status: 500 }
    );
  }
}

