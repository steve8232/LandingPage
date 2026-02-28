import { NextRequest, NextResponse } from 'next/server';

import { isV1Template } from '../../../../../v1/specs/index';
import { composeV1Template } from '../../../../../v1/composer/composeV1Template';
import type { V1ContentOverrides } from '../../../../../v1/composer/composeV1Template';

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

    // We accept overrides as JSON; the composer will shallow-merge section props.
    const overrides = (body.overrides ?? undefined) as V1ContentOverrides | undefined;

    const { html } = composeV1Template(templateId, overrides, { allowRemoteDemoImages: true });
    return NextResponse.json({ html });
  } catch (error) {
    console.error('[api/v1/compose] Error composing template:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to compose v1 template' },
      { status: 500 }
    );
  }
}
