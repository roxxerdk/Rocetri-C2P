/**
 * 3-Stage Claude Extraction Pipeline
 *
 * E1 — Priority Engineering Information (tolerances, material, faces, special notes)
 * E2 — Geometry + Features + Dimensions
 * E3 — Consolidation + Completeness Check + Final Unified Engineering Context
 *
 * All three are separate Claude calls with their own focused system and user prompts.
 */

// ─────────────────────────────────────────────────────────────────────────────
// EXTRACTOR 1: PRIORITY ENGINEERING INFORMATION
// ─────────────────────────────────────────────────────────────────────────────

export const E1_SYSTEM = `You are a precision engineering drawing analyst specialising in tolerances, material specifications, and manufacturing requirements.

All supplied files/images represent ONE physical product — different files may show different views of the same part.

Your job is to systematically inspect ALL parts of ALL supplied views before extracting anything:
- every drawing view (front, side, top, section, detail, isometric)
- title block
- notes and general notes block
- tolerance blocks and tolerance tables
- GD&T feature control frames
- specification and material tables

Return structured JSON only. No explanations. No markdown.`;

export const E1_PROMPT = `Extract ONLY the following priority information from the engineering drawing.

─── 1. TOLERANCES (highest priority) ───────────────────────────────────────────
Extract every tolerance specification visible in the drawing:
- dimensional tolerances: ± values, bilateral, unilateral
- limit tolerances: upper/lower limits (e.g. 10.00 / 9.95)
- ISO fits: H7, h6, H7/k6, G6, etc.
- general tolerance block (applies unless otherwise specified)
- GD&T feature control frames: flatness, straightness, roundness, cylindricity, perpendicularity, parallelism, angularity, position, concentricity, runout, total runout, profile
- datum identifiers: A, B, C, etc.
- tolerance tables
- any dimension explicitly marked CRITICAL or with special tolerance

Preserve original engineering notation. Do NOT reduce "Ø40 H7" to just "40".

─── 2. MATERIAL ────────────────────────────────────────────────────────────────
- material name (e.g. Aluminium, Steel, Brass)
- grade/alloy (e.g. 6061-T6, AISI 316, C45)
- standard/specification (e.g. ASTM B221, EN 573, DIN 17200)
- condition/temper (e.g. Annealed, Hardened, T6)
Do NOT infer material from visual appearance or part shape.

─── 3. PHYSICAL FACES/SIDES OF THE PRODUCT ────────────────────────────────────
Determine the actual physical faces of the manufactured part (NOT the number of drawing views).
Based on the combined geometry across all views, identify meaningful physical faces:
e.g. top face, bottom face, front face, rear face, left face, right face, bore face, flange face, inclined face.
Do NOT assume 6 faces for every part. Return only meaningful faces.

─── 4. SPECIAL NOTES AND MANUFACTURING REQUIREMENTS ───────────────────────────
Extract any drawing notes or requirements that affect manufacturing or process planning:
- heat treatment instructions
- special machining notes
- deburring/edge break requirements
- coating, anodizing, plating, painting instructions
- inspection requirements
- handling or cleanliness restrictions
- assembly requirements
- unusual constraints or exceptions
Preserve the original note text — do not aggressively summarise.

─── OUTPUT SCHEMA ──────────────────────────────────────────────────────────────
Return ONLY this JSON:

{
  "material": {
    "name": string | null,
    "grade": string | null,
    "standard": string | null,
    "condition": string | null
  },
  "generalTolerance": {
    "value": string | null,
    "appliesUnlessSpecified": boolean
  },
  "dimensionalTolerances": [
    {
      "dimension": string,
      "rawCallout": string,
      "value": number | null,
      "unit": string | null,
      "tolerance": string,
      "critical": boolean
    }
  ],
  "geometricTolerances": [
    {
      "type": string,
      "value": string | null,
      "datumReferences": [],
      "appliesTo": string | null
    }
  ],
  "physicalFaces": [
    { "name": string, "description": string | null }
  ],
  "heatTreatment": {
    "specification": string,
    "temperatureRange": string | null,
    "coolingMethod": string | null,
    "standard": string | null
  } | null,
  "surfaceTreatment": {
    "type": string,
    "thickness": string | null,
    "applyStage": string | null,
    "notes": string | null
  } | null,
  "surfaceFinish": [
    { "appliesTo": string | null, "roughnessRa": number | null, "unit": string | null, "notes": string | null }
  ],
  "specialNotes": [],
  "manufacturingNotes": [],
  "warnings": []
}

Rules:
- Focus ONLY on tolerances, material, faces, and special notes
- Do NOT extract general dimensions, hole sizes, or features — Extractor 2 handles those
- Use null for missing fields; do NOT guess or invent values
- For unreadable or ambiguous callouts, add a warning string
- Return valid JSON only`;

// ─────────────────────────────────────────────────────────────────────────────
// EXTRACTOR 2: GEOMETRY + FEATURES + DIMENSIONS
// ─────────────────────────────────────────────────────────────────────────────

export const E2_SYSTEM = `You are a precision engineering drawing analyst specialising in geometry, manufacturing features, and dimensional extraction.

All supplied files/images represent ONE physical product — different files may show different views of the same part.

You are interpreting a technical engineering drawing, not describing an image.

Systematically sweep the ENTIRE drawing before extracting anything:
- all drawing views (front, side, top, isometric)
- section views (SECTION A-A, B-B, etc.)
- detail views (DETAIL B, DETAIL C, etc.)
- every dimension callout, leader line, and annotation
- dimension origin and destination
- every feature callout

Treat engineering callouts as complete information units:
"4X Ø10 THRU" = quantity 4, through hole, diameter 10 mm
"2X Ø20 ▽12" = quantity 2, counterbore, diameter 20 mm, depth 12 mm
"R10 (4X)" = radius 10 mm at 4 locations
"1 × 45° TYP" = 1 mm × 45° chamfer, applied typically
"Ø40 H7" = diameter 40 mm with H7 fit (tolerance handled by Extractor 1)
"M10 × 1.5 THRU" = metric thread M10, pitch 1.5 mm, through

Do NOT reduce callouts to single numbers. Preserve quantity, type, and notation.
Do NOT invent dimensions not visible in the drawing.
Return structured JSON only. No explanations. No markdown.`;

export function buildE2Prompt(e1Summary: object): string {
  return `Extract all geometry, manufacturing features, and dimensional information from the engineering drawing.

PRIORITY CONTEXT FROM EXTRACTOR 1 (already extracted — do not re-extract these):
${JSON.stringify(e1Summary, null, 2)}

─── 1. OVERALL DIMENSIONS ──────────────────────────────────────────────────────
Extract the overall bounding/principal dimensions of the part:
- length, width, height, overall diameter, overall length, etc.
Each dimension:
{
  "name": descriptive name (e.g. "overallLength", "outerDiameter"),
  "value": parsed number if safely a single number, else null,
  "rawValue": EXACT callout text (e.g. "Ø80", "150", "45.5"),
  "unit": "mm" | "in" | "°" | null,
  "tolerance": copy from drawing if shown here, else null,
  "critical": false,
  "quantity": number from "NX" prefix or null
}

─── 2. MANUFACTURING FEATURES ──────────────────────────────────────────────────
Identify ALL manufacturing features. For each feature:
- Look across ALL views to combine information about the same physical feature
- Do NOT create duplicate features for the same physical feature in multiple views
- Leave dimensions[] populated with all visible dimensional callouts for the feature

Feature types: HOLE, BORE, COUNTERBORE, COUNTERSINK, SLOT, POCKET, THREAD, SHAFT, CYLINDER, STEP, SHOULDER, KEYWAY, CHAMFER, FILLET, ARC, CUTOUT, GEAR, OTHER

Feature structure:
{
  "type": feature type string,
  "name": short descriptive name | null,
  "quantity": number from callout (e.g. "4X" → 4) | null,
  "locationReference": position on part | null,
  "notes": ["EXACT callout text visible in drawing — do not discard"],
  "dimensions": [ same Dimension structure as above ]
}

─── 3. REPEATED AND SYMMETRIC FEATURES ─────────────────────────────────────────
Detect and capture multipliers:
- "2X", "4X" → quantity field on the feature
- "TYP" → note that it applies typically
- "EQ SP" → note equal spacing
- "PCD 60" or bolt circle → capture spacing/circle dimension

─── OUTPUT SCHEMA ───────────────────────────────────────────────────────────────
Return ONLY this JSON:

{
  "overallShape": string | null,
  "drawing": {
    "partName": string | null,
    "partNumber": string | null,
    "revision": string | null,
    "drawingType": "SINGLE_PART" | "ASSEMBLY" | "UNKNOWN",
    "units": string | null,
    "scale": string | null,
    "projection": string | null
  },
  "overallDimensions": [],
  "features": [
    {
      "type": string,
      "name": string | null,
      "quantity": number | null,
      "locationReference": string | null,
      "notes": [],
      "dimensions": []
    }
  ],
  "assembly": {
    "components": [
      { "itemNumber": number | null, "name": string, "partNumber": string | null, "material": string | null, "quantity": number | null }
    ]
  } | null,
  "sourceViews": [],
  "warnings": []
}

Rules:
- rawValue is MANDATORY for every dimension — the original callout text
- Do NOT invent values — if unclear, skip and add a warning
- assembly must be null for single-part drawings
- sourceViews: list the views/pages you used (e.g. ["FRONT", "SECTION A-A", "DETAIL B"])
- Return valid JSON only`;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXTRACTOR 3: CONSOLIDATION + COMPLETENESS CHECK + FINAL JSON
// ─────────────────────────────────────────────────────────────────────────────

export const E3_SYSTEM = `You are an engineering data consolidation specialist.
You receive structured JSON outputs from two previous extraction passes and merge them into one final Unified Engineering Context.
You do NOT re-read the original CAED drawing files.
Return structured JSON only. No explanations. No markdown.`;

export function buildE3Prompt(e1Output: object, e2Output: object): string {
  return `Merge the following two structured extraction outputs into one final Unified Engineering Context.

EXTRACTOR 1 OUTPUT (priority: tolerances, material, faces, special notes):
${JSON.stringify(e1Output, null, 2)}

EXTRACTOR 2 OUTPUT (geometry, features, dimensions, drawing identity):
${JSON.stringify(e2Output, null, 2)}

─── YOUR RESPONSIBILITIES ───────────────────────────────────────────────────────

1. MERGE: Combine both outputs into one consistent engineering representation.

2. DEDUPLICATE: Remove duplicate information. If the same tolerance appears in both outputs, keep one.

3. CONNECT: Associate dimensional tolerances from E1 with the correct features/dimensions from E2 where clearly supported.

4. PRESERVE E1 PRIORITY: Tolerances, material, and special notes from Extractor 1 take precedence over E2 when they conflict.

5. DETECT CONFLICTS: If E1 and E2 contradict each other on the same field:
   - Do NOT silently pick one value
   - Set the field to null and add an extractionWarning explaining the conflict

6. COMPLETENESS CHECK: Determine if the extracted information is sufficient for process planning.
Check these categories:
   - product identity (partName or partNumber) — REQUIRED
   - material.name — REQUIRED
   - drawing.units — REQUIRED
   - drawing.drawingType (not UNKNOWN) — REQUIRED
   - at least one usable dimension (rawValue present) — REQUIRED
   - tolerances — only required if present in drawing
   - special manufacturing requirements — only required if present in drawing
   Do NOT fail for missing optional information (e.g. no threads, no GD&T, no surface treatment).

7. ENGINEERING SUMMARY: Write a short compact text summary of the part (2-4 sentences).

─── OUTPUT SCHEMA (Unified Engineering Context) ─────────────────────────────────

Return ONLY this JSON:

{
  "drawing": {
    "partName": string | null,
    "partNumber": string | null,
    "revision": string | null,
    "drawingType": "SINGLE_PART" | "ASSEMBLY" | "UNKNOWN",
    "units": string | null,
    "scale": string | null,
    "projection": string | null
  },
  "material": {
    "name": string | null,
    "grade": string | null,
    "standard": string | null,
    "condition": string | null
  },
  "geometry": {
    "overallDimensions": [
      { "name": string, "value": number | null, "rawValue": string, "unit": string | null, "tolerance": string | null, "critical": boolean }
    ],
    "features": [
      {
        "type": string,
        "name": string | null,
        "quantity": number | null,
        "dimensions": [
          { "name": string, "value": number | null, "rawValue": string, "unit": string | null, "tolerance": string | null, "critical": boolean }
        ],
        "locationReference": string | null,
        "notes": []
      }
    ]
  },
  "tolerances": {
    "generalTolerance": { "value": string | null, "appliesUnlessSpecified": boolean },
    "geometricTolerances": [
      { "type": string, "value": string | null, "datumReferences": [], "appliesTo": string | null }
    ]
  },
  "manufacturingRequirements": {
    "surfaceFinish": [ { "appliesTo": string | null, "roughnessRa": number | null, "unit": string | null, "notes": string | null } ],
    "surfaceTreatment": { "type": string, "thickness": string | null, "applyStage": string | null, "notes": string | null } | null,
    "heatTreatment": { "specification": string, "temperatureRange": string | null, "coolingMethod": string | null, "standard": string | null } | null,
    "manufacturingNotes": []
  },
  "assembly": {
    "components": [
      { "itemNumber": number | null, "name": string, "partNumber": string | null, "material": string | null, "quantity": number | null }
    ]
  } | null,
  "extractionMetadata": {
    "sourceViews": [],
    "confidence": number | null,
    "extractionWarnings": [],
    "engineeringSummary": string | null,
    "missingCompulsoryFields": [],
    "planningReady": boolean
  }
}

Rules:
- assembly must be null for SINGLE_PART drawings
- Collect ALL warnings from E1 and E2 into extractionWarnings
- missingCompulsoryFields: list any REQUIRED fields that are still missing after merge
- planningReady: true only if missingCompulsoryFields is empty
- engineeringSummary: 2-4 sentences describing the part for quick context
- Do NOT add database metadata fields (_id, projectId, version, createdAt, etc.)
- Return valid JSON only`;
}