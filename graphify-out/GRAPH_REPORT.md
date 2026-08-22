# Graph Report - tapstand  (2026-08-22)

## Corpus Check
- Corpus is ~49,368 words - fits in a single context window. You may not need a graph.

## Summary
- 53 nodes · 58 edges · 11 communities (6 shown, 5 thin omitted)
- Extraction: 57% EXTRACTED · 43% INFERRED · 0% AMBIGUOUS · INFERRED: 25 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Freestanding Body Forms
- NFC Sourcing & Build
- Insert Design System
- Holder & Industry Data
- Photo Pipeline
- NFC Tap Interaction
- NTAG213 Disc Hardware
- Compact Form Factors
- Wall & Table Mounts
- Product Architecture
- Brand Compliance

## God Nodes (most connected - your core abstractions)
1. `Tap Stand Form Factors Diagram (12 Designs, Side Elevations)` - 14 edges
2. `Layered Insert Editor` - 9 edges
3. `Holder Suite (15 Bodies)` - 6 edges
4. `Tap Stand — Holder Suite & Insert System` - 5 edges
5. `NFC Tap Interaction Paradigm` - 4 edges
6. `Industry Coverage Matrix (14 Verticals)` - 3 edges
7. `NFC Tags (NTAG213 Variants)` - 3 edges
8. `Photo Auto-Swap (img/<slug>.jpg)` - 3 edges
9. `Holder Photo Manifest & Licence Status` - 3 edges
10. `Sourcing Prompt (Frame + Print Path)` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Seritag NFC Tag Order (x49745)` --semantically_similar_to--> `NFC Tags (NTAG213 Variants)`  [INFERRED] [semantically similar]
  SOURCING-PROMPT.md → index.html
- `Tap Stand Form Factors Diagram (12 Designs, Side Elevations)` --references--> `Bare NFC Disc Sticker (Reference Photo)`  [INFERRED]
  tap-stand-form-factors.svg → img/bare-disc.jpg
- `Compact Slant-Back Acrylic Holders (Reference Photo)` --references--> `Tap Stand Form Factors Diagram (12 Designs, Side Elevations)`  [INFERRED]
  img/compact-square.jpg → tap-stand-form-factors.svg
- `Tap Stand Form Factors Diagram (12 Designs, Side Elevations)` --references--> `Slant-Back Acrylic Sign Holder (Reference Photo)`  [INFERRED]
  tap-stand-form-factors.svg → img/slant-back.jpg
- `Tap Stand Form Factors Diagram (12 Designs, Side Elevations)` --references--> `Angled Table Wedge Sign Holder (Reference Photo)`  [INFERRED]
  tap-stand-form-factors.svg → img/table-wedge.jpg

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Insert Design System (Plates x Themes x Palettes)** — index_insert_editor, index_colour_engine, index_themes, index_procedural_graphics, index_copy_library, index_layer_system [EXTRACTED 1.00]
- **NFC Tag Lifecycle (Sourcing → Build → Editor)** — index_nfc_tags, sourcing_prompt_seritag_order, index_build_spec, index_insert_editor [EXTRACTED 1.00]
- **Photo Pipeline (Fetch → img/ → Auto-Swap)** — image_fetch_prompt, img_readme_photo_manifest, index_photo_auto_swap [EXTRACTED 1.00]
- **Freestanding Counter Form Factors** — img_slant_back, img_curved_frosted, img_magnetic_block, img_easel_back [EXTRACTED 1.00]
- **Premium and Table Form Factors** — img_walnut_wedge, img_solid_block, img_terrazzo, img_brass_pedestal [EXTRACTED 1.00]
- **Adhesive No-Footprint Form Factors** — img_a_frame, img_wall_plaque, img_table_wedge, img_bare_disc [EXTRACTED 1.00]

## Communities (11 total, 5 thin omitted)

### Community 0 - "Freestanding Body Forms"
Cohesion: 0.25
Nodes (9): A-Frame Table Tent (Reference Photo), Brass Weighted Pedestal (Reference Photo), Curved Frosted Acrylic Frame (Reference Photo), Easel-Back Frame Stand (Reference Photo), Magnetic Acrylic Block Frame (Reference Photo), Solid Walnut Block Card Holder (Reference Photo), Terrazzo Cast Base Card Holder (Reference Photo), Walnut Wedge Desk Stand with Brass Accents (Reference Photo) (+1 more)

### Community 1 - "NFC Sourcing & Build"
Cohesion: 0.22
Nodes (9): Build Spec (4 Tag Assembly Instructions), NFC Tags (NTAG213 Variants), Sourcing Prompt (Frame + Print Path), 5x7 Frame Sourcing (Holder Body), Three-Layer Custom Acrylic Stack, HP OfficeJet Pro 8720 (Current Printer), Insert Print Path (Home vs. Volume), Same-Day Turnaround Promise (+1 more)

### Community 2 - "Insert Design System"
Cohesion: 0.22
Nodes (9): Colour Engine (Palette Derivation), Copy Library (Compliance-Safe Headlines), Trim Formats (7 Sizes), Layered Insert Editor, Layer System (Drag, Reorder, Lock, Hide), Industry Presets (8 Demo Businesses), Procedural Graphics (Patterns, Heroes, Motifs), Design Themes (Typeface + Frame + Texture) (+1 more)

### Community 3 - "Holder & Industry Data"
Cohesion: 0.25
Nodes (9): Holder Suite (15 Bodies), Industry Coverage Matrix (14 Verticals), Sourcing Section (89 Links, 20 Categories), Marks & Notes Store (localStorage), Supplier Map per Body, SVG Side Elevations (Material Drawings), Tap Stand — Holder Suite & Insert System, TapCard (Loyalty Pass Sibling Repo) (+1 more)

### Community 4 - "Photo Pipeline"
Cohesion: 0.67
Nodes (4): Image Fetch Prompt (Product Photos Task), Holder Photo Manifest & Licence Status, Unverified Licence Status (All 15 Photos), Photo Auto-Swap (img/<slug>.jpg)

### Community 5 - "NFC Tap Interaction"
Cohesion: 0.67
Nodes (4): NFC Adhesive Tap Card (Reference Photo), Branded NFC Tap Cards Collection (Reference Photo), NFC Tap Interaction Paradigm, Tap Mark NFC Icon (Radio Waves + Phone)

## Knowledge Gaps
- **19 isolated node(s):** `Supplier Map per Body`, `Colour Engine (Palette Derivation)`, `Design Themes (Typeface + Frame + Texture)`, `Procedural Graphics (Patterns, Heroes, Motifs)`, `Marks & Notes Store (localStorage)` (+14 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Layered Insert Editor` connect `Insert Design System` to `NFC Sourcing & Build`, `Holder & Industry Data`?**
  _High betweenness centrality (0.166) - this node is a cross-community bridge._
- **Why does `Holder Suite (15 Bodies)` connect `Holder & Industry Data` to `NFC Sourcing & Build`, `Photo Pipeline`?**
  _High betweenness centrality (0.158) - this node is a cross-community bridge._
- **Why does `Tap Stand — Holder Suite & Insert System` connect `Holder & Industry Data` to `Insert Design System`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Are the 13 inferred relationships involving `Tap Stand Form Factors Diagram (12 Designs, Side Elevations)` (e.g. with `Compact Slant-Back Acrylic Holders (Reference Photo)` and `A-Frame Table Tent (Reference Photo)`) actually correct?**
  _`Tap Stand Form Factors Diagram (12 Designs, Side Elevations)` has 13 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `NFC Tap Interaction Paradigm` (e.g. with `NFC Adhesive Tap Card (Reference Photo)` and `Branded NFC Tap Cards Collection (Reference Photo)`) actually correct?**
  _`NFC Tap Interaction Paradigm` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Supplier Map per Body`, `Colour Engine (Palette Derivation)`, `Design Themes (Typeface + Frame + Texture)` to the rest of the system?**
  _19 weakly-connected nodes found - possible documentation gaps or missing edges._