/**
 * Shared engineering drawing inspection rules.
 * Injected into C4 (Geometry & Features) and C5 (Dimensions & Tolerances) system prompts.
 * Do NOT change the pipeline architecture — this is a shared instruction block only.
 */
export const ENGINEERING_DRAWING_INSPECTION_RULES = `
You are interpreting a technical engineering drawing, not summarizing an image.

Systematically inspect ALL relevant parts of ALL supplied views/pages before extracting information:

- title block
- notes
- specification/material tables
- critical dimension tables
- all drawing views
- section views
- detail views
- dimension callouts
- tolerances and GD&T frames

Do not extract only the largest or most obvious dimensions.

Treat engineering callouts as complete information units.

Examples:

"4X Ø10 THRU" means:
- quantity: 4
- feature: through hole
- diameter: 10 mm

"2X Ø20 depth 12" means:
- quantity: 2
- feature: counterbore
- diameter: 20 mm
- depth: 12 mm

"R10 (4X)" means radius 10 mm applied at 4 locations.

"1 × 45° TYP" means a 1 mm, 45° chamfer applied typically to repeated locations.

"Ø40 H7" means diameter 40 mm with H7 fit/tolerance.

Information about one physical feature may be distributed across multiple views. Combine information across views only when they clearly refer to the same feature.

Do not guess or invent missing information.

If information is unclear or unreadable, leave it unresolved and add a warning.

Prioritize complete extraction of explicitly visible engineering information over a simplified summary.
`.trim();

/**
 * Container 1: Input Understanding
 * Purpose: Map the document structure before any extraction.
 * Output: compact drawingMap only — no engineering extraction.
 */

export const C1_SYSTEM = `You are an engineering document analyst.
Your ONLY job is to understand the structure of the supplied engineering drawing input set.
Do NOT extract dimensions, features, or material details.
Return compact structu+red JSON only — no explanations, no markdown.`;

export const C1_PROMPT = `Analyse all supplied files/images. They represent ONE product unless clearly indicated otherwise.

Identify:
- Whether inputs represent one product or multiple products
- What drawing views/pages are present (front, side, top, section, detail, isometric, etc.)
- Where title blocks appear (which image/page/area)
- Where notes or text blocks appear
- Where dimensions are concentrated
- Where tolerances or GD&T symbols appear
- Where tables or specification blocks appear
- Any concerns about image quality or readability

Return ONLY this JSON (fill arrays with short descriptive strings, keep it compact):

{
  "productScope": "ONE_PRODUCT" | "MULTIPLE_PRODUCTS" | "UNCERTAIN",
  "views": [],
  "sections": [],
  "detailViews": [],
  "informationLocations": {
    "titleBlocks": [],
    "notes": [],
    "dimensions": [],
    "tables": [],
    "tolerances": []
  },
  "inputCount": 0,
  "warnings": []
}

Rules:
- Keep descriptions SHORT (e.g. "image 1 - front view", "image 2 top-right title block")
- Do NOT extract any dimensions, materials, or features
- If something is unclear, add a short warning string
- Return valid JSON only`;

/**
 * Container 2: Drawing Identity
 * Input: original files + drawingMap
 */
export const C2_SYSTEM = `You are an engineering drawing identification specialist.
Extract ONLY drawing-level identification and metadata.
Do NOT extract geometry, material, dimensions, or features.
Return structured JSON only — no explanations, no markdown.`;

export function buildC2Prompt(drawingMap: object): string {
  return `Using the drawing map below as a guide to where title block and identification information is located, extract the drawing identity fields from the supplied files.

DRAWING MAP (use to focus your attention):
${JSON.stringify(drawingMap, null, 2)}

Extract ONLY:
- partName (from title block or drawing header)
- partNumber (drawing/part number)
- revision (revision letter/number)
- drawingType: "SINGLE_PART" | "ASSEMBLY" | "UNKNOWN"
- units (mm, inches, etc.)
- scale (e.g. "1:1", "1:2")
- projection ("FIRST_ANGLE" | "THIRD_ANGLE" | null)

Return ONLY this JSON:

{
  "partName": string | null,
  "partNumber": string | null,
  "revision": string | null,
  "drawingType": "SINGLE_PART" | "ASSEMBLY" | "UNKNOWN",
  "units": string | null,
  "scale": string | null,
  "projection": string | null,
  "warnings": []
}

Rules:
- Use null when absent — do NOT guess
- Do NOT extract material, dimensions, or features
- Return valid JSON only`;
}

/**
 * Container 3: Material & Requirements
 * Input: original files + drawingMap
 */
export const C3_SYSTEM = `You are a manufacturing requirements extraction specialist.
Extract ONLY material and non-geometric manufacturing requirements.
Do NOT extract geometry, dimensions, or drawing identity.
Return structured JSON only — no explanations, no markdown.`;

export function buildC3Prompt(drawingMap: object): string {
  return `Using the drawing map below as a guide to where material and notes information is located, extract material and manufacturing requirements from the supplied files.

DRAWING MAP:
${JSON.stringify(drawingMap, null, 2)}

Focus especially on: title blocks, notes columns, specification tables, general notes.

Extract:
- material.name (e.g. "Aluminium", "Stainless Steel")
- material.grade (e.g. "6061-T6", "AISI 316")
- material.standard (e.g. "ASTM B221", "EN 573")
- material.condition (e.g. "Annealed", "Hardened")
- heatTreatment: { specification, temperatureRange, coolingMethod, standard } | null
- surfaceTreatment: { type, thickness, applyStage, notes } | null
- surfaceFinish: array of { appliesTo, roughnessRa, unit, notes }
- manufacturingNotes: string[]

Return ONLY this JSON:

{
  "material": {
    "name": string | null,
    "grade": string | null,
    "standard": string | null,
    "condition": string | null
  },
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
  "manufacturingNotes": [],
  "warnings": []
}

Rules:
- Do NOT infer material from appearance or part shape
- Do NOT invent heat treatment or surface treatment when not stated
- Use null for absent optional fields
- Return valid JSON only`;
}

/**
 * Container 4: Geometry & Features
 * Input: original files + drawingMap
 */
export const C4_SYSTEM = `You are an engineering feature recognition specialist.
Identify the physical geometry and manufacturing features of the product.
Do NOT focus on precise dimensions — those are handled separately.
Return structured JSON only — no explanations, no markdown.

${ENGINEERING_DRAWING_INSPECTION_RULES}`;

export function buildC4Prompt(drawingMap: object): string {
  return `Using the drawing map below, identify all meaningful physical and manufacturing features across all drawing views for the ONE product shown in the supplied files.

DRAWING MAP:
${JSON.stringify(drawingMap, null, 2)}

Do not perform only visual shape recognition. Capture the complete engineering callout visibly associated with each feature.

Look for ALL of the following feature types across every view, section, and detail:
- holes (through holes, blind holes)
- bores
- counterbores
- countersinks
- slots
- pockets
- threads (internal and external)
- steps
- shoulders
- grooves
- chamfers
- fillets and radii
- cutouts
- repeated/symmetric features

For each feature capture:
- type: one of HOLE, BORE, COUNTERBORE, COUNTERSINK, SLOT, POCKET, THREAD, SHAFT, CYLINDER, STEP, SHOULDER, KEYWAY, CHAMFER, FILLET, ARC, CUTOUT, GEAR, OTHER
- name: short descriptive name | null
- quantity: count from callout or view (e.g. "4X" → 4) | null
- locationReference: where on the part it is located | null
- notes: include the EXACT visible engineering callout text (e.g. "4X Ø10 THRU", "M8 × 1.25 THRU", "1 × 45° TYP") — do not discard callouts because dimensions will be processed later
- dimensions: leave as [] — Container 5 populates these

Overall geometry:
- overallShape: brief description of the part's overall form
- overallDimensions: leave as [] — Container 5 handles these

Return ONLY this JSON:

{
  "overallShape": string | null,
  "overallDimensions": [],
  "features": [
    {
      "type": string,
      "name": string | null,
      "quantity": number | null,
      "dimensions": [],
      "locationReference": string | null,
      "notes": ["exact callout text if visible"]
    }
  ],
  "warnings": []
}

Rules:
- Do NOT duplicate features that appear in multiple views — merge across views when they clearly refer to the same feature
- Do NOT invent features not visible in the drawing
- Preserve the exact visible callout text in notes — do not paraphrase or discard it
- Dimensions go in Container 5 — leave dimensions arrays empty here
- Add a warning string for any feature where the callout is partially unreadable
- Return valid JSON only`;
}

/**
 * Container 5: Dimensions & Tolerances
 * Input: original files + drawingMap + compact feature list from C4
 */
export const C5_SYSTEM = `You are an engineering dimension and tolerance extraction specialist.
Extract all numerical engineering information and tolerance specifications.
Return structured JSON only — no explanations, no markdown.

${ENGINEERING_DRAWING_INSPECTION_RULES}`;

export function buildC5Prompt(drawingMap: object, featureSummary: object): string {
  return `Extract ALL dimensions and tolerances by systematically sweeping the entire drawing. Do not stop after finding overall dimensions.

DRAWING MAP (use to focus on where dimensions and tolerances appear):
${JSON.stringify(drawingMap, null, 2)}

IDENTIFIED FEATURES (use to associate dimensions with features where evidence supports it):
${JSON.stringify(featureSummary, null, 2)}

Extract in these categories:

1. OVERALL DIMENSIONS
   - length, width, height, overall diameter, overall length, etc.

2. FEATURE DIMENSIONS
   - diameters (Ø), radii (R), depths, lengths, widths, angles, thread specs,
     chamfer sizes, spacing, bolt circle diameters, groove dimensions, slot dimensions

3. REPEATED FEATURES — preserve multiplier information
   - "2X Ø10 THRU"    → quantity: 2, rawValue: "2X Ø10 THRU", value: 10, name: "holeDiameter"
   - "4X R5"          → quantity: 4, rawValue: "4X R5", value: 5, name: "cornerRadius"
   - "TYP" callouts   → note typical application in rawValue
   - "EQ SP" callouts → note equal spacing in rawValue

4. TOLERANCES
   - ± dimensional tolerances (e.g. ±0.05)
   - limit tolerances (e.g. 10.00/9.95)
   - ISO fits (e.g. H7, g6, H7/k6)
   - general/default tolerance block
   - GD&T feature control frames (flatness, perpendicularity, runout, position, etc.)
   - datum identifiers (A, B, C)

CRITICAL RULE — preserve complete engineering callout meaning:
"4X Ø10 THRU" must NOT be reduced to only value = 10.
It must capture: rawValue = "4X Ø10 THRU", value = 10, unit = "mm", quantity = 4, name = "throughHoleDiameter"

Dimension structure:
{
  "name": string,              // descriptive name: "outerDiameter", "threadSpec", "slotWidth", etc.
  "value": number | null,      // parsed numeric ONLY when safely a single number — null for "M10 x 1.5", "H7", "R5±0.1"
  "rawValue": string,          // ALWAYS the original callout text: "Ø40", "4X Ø10 THRU", "M10 x 1.5", "R5"
  "unit": string | null,       // "mm", "in", "°", etc.
  "tolerance": string | null,  // "±0.05", "H7", "+0.02/-0.00", etc.
  "critical": boolean,         // true only when explicitly marked critical or safety-related
  "quantity": number | null,   // from multiplier: "4X" → 4, "TYP" → null
  "featureRef": string | null  // name of associated feature from the feature list, or null
}

Return ONLY this JSON:

{
  "overallDimensions": [],
  "featureDimensions": [],
  "generalTolerance": {
    "value": string | null,
    "appliesUnlessSpecified": boolean
  },
  "geometricTolerances": [
    {
      "type": string,
      "value": string | null,
      "datumReferences": [],
      "appliesTo": string | null
    }
  ],
  "warnings": []
}

Rules:
- rawValue is MANDATORY for every dimension — never omit it
- value = single parsed number only when unambiguously safe; null otherwise
- quantity from "NX" callout prefix goes on the dimension itself
- Do NOT invent values — if unclear or unreadable, add a warning and skip that dimension
- featureRef may be null when the association is uncertain
- Return valid JSON only`;
}

/**
 * Container 6: Final Merge & Conflict Resolution
 * Input: drawingMap + C2 + C3 + C4 + C5 outputs (JSON only — no original files)
 */
export const C6_SYSTEM = `You are an engineering data integration specialist.
Merge structured extraction outputs into one final Unified Engineering Context.
Resolve conflicts intelligently. Preserve all valid information.
Return the final unified schema JSON only — no explanations, no markdown.`;

export function buildC6Prompt(
  drawingMap: object,
  c2DrawingIdentity: object,
  c3Material: object,
  c4Geometry: object,
  c5Dimensions: object,
): string {
  return `Merge the following structured extraction outputs into ONE Unified Engineering Context.

DRAWING MAP:
${JSON.stringify(drawingMap, null, 2)}

DRAWING IDENTITY (Container 2):
${JSON.stringify(c2DrawingIdentity, null, 2)}

MATERIAL & REQUIREMENTS (Container 3):
${JSON.stringify(c3Material, null, 2)}

GEOMETRY & FEATURES (Container 4):
${JSON.stringify(c4Geometry, null, 2)}

DIMENSIONS & TOLERANCES (Container 5):
${JSON.stringify(c5Dimensions, null, 2)}

Your responsibilities:
1. Merge all outputs into the schema below.
2. Connect featureDimensions from Container 5 to the correct features from Container 4 using featureRef.
3. Remove duplicate information caused by multiple views.
4. Detect and resolve conflicts:
   - Prefer explicit over inferred information
   - Prefer information supported by multiple sources
   - If unresolvable: use null and add extractionWarning
5. Collect ALL warnings from all containers into extractionWarnings.
6. sourceViews should reflect what views/pages were identified.

Return ONLY this JSON matching the Unified Engineering Context schema exactly:

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
    "extractionWarnings": []
  }
}

Rules:
- assembly must be null for SINGLE_PART drawings
- Collect ALL warnings from ALL containers into extractionWarnings
- Do NOT add database fields (_id, projectId, version, createdAt, etc.)
- Do NOT perform planning-readiness validation
- Return valid JSON only`;
}