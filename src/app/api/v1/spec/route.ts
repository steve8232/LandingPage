import { NextRequest, NextResponse } from 'next/server';

import { getV1Spec, isV1Template } from '../../../../../v1/specs/index';

export async function GET(request: NextRequest) {
  try {
    const templateId = request.nextUrl.searchParams.get('templateId') || '';
    if (!templateId) {
      return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
    }
    if (!isV1Template(templateId)) {
      return NextResponse.json({ error: `Not a v1 template: ${templateId}` }, { status: 400 });
    }

    const spec = getV1Spec(templateId);
    if (!spec) {
      return NextResponse.json({ error: `No spec found for: ${templateId}` }, { status: 404 });
    }

    // Editor-only helper endpoint: returns default section props so the client can
    // display effective values (spec defaults + overrides) without parsing HTML.
    return NextResponse.json({
      templateId: spec.templateId,
      version: spec.version,
      category: spec.category,
      goal: spec.goal,
      theme: spec.theme,
      metadata: spec.metadata,
      sections: spec.sections,
    });
  } catch (error) {
    console.error('[api/v1/spec] Error fetching spec:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch v1 spec' },
      { status: 500 }
    );
  }
}
