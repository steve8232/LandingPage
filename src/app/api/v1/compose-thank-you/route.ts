import { NextRequest, NextResponse } from 'next/server';

import { isV1Template } from '../../../../../v1/specs/index';
import { composeV1ThankYou } from '../../../../../v1/composer/composeV1ThankYou';
import type { V1ContentOverrides } from '../../../../../v1/composer/composeV1Template';

/**
 * POST /api/v1/compose-thank-you
 *
 * Mirror of /api/v1/compose, but renders the secondary /thank-you page so
 * the editor preview can refresh it independently of the landing page.
 */

type ComposeRequestBody = {
  templateId?: unknown;
  overrides?: unknown;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ComposeRequestBody;

    const templateId = typeof body.templateId === 'string' ? body.templateId : '';
    if (!templateId) {
      return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
    }
    if (!isV1Template(templateId)) {
      return NextResponse.json({ error: `Not a v1 template: ${templateId}` }, { status: 400 });
    }

    const overrides = (body.overrides ?? undefined) as V1ContentOverrides | undefined;

    const { html } = composeV1ThankYou(templateId, overrides);
    return NextResponse.json({ html });
  } catch (error) {
    console.error('[api/v1/compose-thank-you] Error composing thank-you page:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to compose thank-you page' },
      { status: 500 }
    );
  }
}
