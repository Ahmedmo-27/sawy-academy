# DESIGN.md — Sawy Academy Design System & Standard Specification

> **Specification Standard**: Open-Source `DESIGN.md` for AI UI Generators (Google Stitch) & Modern Web Platforms.  
> **Product**: Sawy Academy (Architecture · Education · Research)  
> **Founder & Director**: Prof. Mohamed El Sawy (Vice Dean, Faculty of Engineering at Misr International University — MIU)  
> **Studio Location**: 12 Hassan Sabry Street, Zamalek, Cairo, Egypt (Est. 2012)

---

## 1. Product Overview & Identity

Sawy Academy is an elite architectural education institute and research platform based in Cairo. The platform offers structured **100% online studio courses**, on-demand architectural video masterclasses, a foundational online Architecture Diploma, and advanced geometric research programs directed personally by Prof. Mohamed El Sawy.

### Course Delivery Model: 100% Online
* **Format**: Fully online, self-paced & cohort-guided digital courses with streaming high-definition video lessons.
* **Exercises**: Downloadable digital drawing sheets (.DWG, .PDF, .3DM) and assignments completed remotely.
* **Critique & Support**: Asynchronous digital reviews and critique feedback submitted through the online student portal.
* **Access**: Lifetime or term-based online studio access from anywhere in the world. (No in-person or 1-on-1 private tutoring; all programs are digital online masterclasses).

### Core Philosophy
* **Discipline of Proportion**: Space is understood as the deliberate void between masses, governed by modular grids and orthographic truth.
* **Academic Authority**: Backed by university-level academic leadership (MIU Engineering) and real built practice in Egypt.
* **Modern Kinetic Experience**: Seamless, scroll-driven storytelling using GSAP animations without ever compromising usability or clarity.

---

## 2. Design Principles & Anti-Patterns

### Mandatory Principles
1. **Content-First Hierarchy**: The tangible learning outcomes (drawing sheets, skills, exercises, jury defense) must dominate every card. The tuition price is treated as a discreet, dignified academic studio fee in the lower corner—never an e-commerce sale banner.
2. **Anti-Pale & High Contrast**: Zero washed-out light-gray text on off-white backgrounds. Contrast ratios must meet WCAG AAA (7:1+). Surfaces are rich, deep, and textured.
3. **Anti-Crowded & Breathable**: Minimum 100px–120px vertical margins between sections; minimum 32px–40px gaps between cards. Generous negative space that reflects architectural scale.
4. **Purposeful Kinetic Motion**: Animations are physical and structural—vector lines drafting on scroll, screens pinning gracefully, and scale bars measuring depth.

### Explicit Anti-Patterns (Banned)
* ❌ **No Pale / Washed-Out Palettes**: No light-gray on light-gray, no ghostly illegible text.
* ❌ **No Cheap / Generic SaaS Layouts**: No rounded candy-like 3D bubbles, no purple/pink gradient blobs, no generic stock vectors.
* ❌ **No Dominant Price Tags**: Giant discount tags or loud colored numbers are strictly prohibited.
* ❌ **No Cluttered Grids**: Do not cram 6 cards in a row. Maintain 2 to 3 cards maximum per view with ample breathing room.

---

## 3. Color Tokens & Surface Palette

### Option A: Obsidian Luxury & Champagne Bronze (Dark Mode Default)
* `--bg-canvas`: `#0B0C0E` (Deep pitch obsidian)
* `--surface-card`: `#14161B` (Smoked architectural glass)
* `--surface-border`: `rgba(255, 255, 255, 0.10)` (1px hairline drafting edge)
* `--surface-border-hover`: `#D4AF37` (Champagne metallic glow)
* `--text-primary`: `#FFFFFF` (Stark optical white)
* `--text-secondary`: `#A0A5AD` (Legible architectural silver)
* `--text-muted`: `#686E78` (Discreet metadata)
* `--accent-bronze`: `#D4AF37` (Refined Egyptian champagne bronze)
* `--accent-active`: `#E5A93C` (Kinetic focus indicator)

### Option B: High-Contrast Modernist & Corten Steel (Light Mode Alternative)
* `--bg-canvas`: `#FFFFFF` (Pure crisp white)
* `--surface-card`: `#F9F9F8` (Fine alabaster stone)
* `--surface-border`: `#111111` (1px sharp Swiss grid line)
* `--text-primary`: `#050505` (Deep ink black)
* `--text-secondary`: `#4A4A4A` (Charcoal body)
* `--accent-corten`: `#C45A2C` (Warm Corten steel rust / burnt amber)

---

## 4. Typography System

* **Display & Section Headers**: `Space Grotesk` or `Neue Haas Grotesk`
  * Weight: `700 Bold` / `600 SemiBold`
  * Tracking: `-0.03em` (Tight, sculptural)
  * Scale: `clamp(2.5rem, 6vw, 5.5rem)`
* **Body & Explanations**: `Inter` / `Helvetica Now`
  * Weight: `400 Regular` / `500 Medium`
  * Line Height: `1.6`
  * Scale: `16px` to `18px`
* **Metadata, Drawing Codes & Studio Fees**: `Space Mono` or `JetBrains Mono`
  * Weight: `400 Regular`
  * Transform: `UPPERCASE`
  * Scale: `12px` to `14px`
  * Tracking: `+0.05em`

---

## 5. Layout & Spatial System

* **Container Max Width**: `1440px` (Desktop)
* **Modular Base Grid**: `8px` base unit
* **Columns**: 12-column Swiss grid with `32px` gutters
* **Section Padding**: `120px` top and bottom for expansive architectural breathing room
* **Card Padding**: `36px` internal padding with `0px` to `2px` subtle corners (sharp architectural edges)

---

## 6. Kinetic & GSAP Animation Specifications

All interactive components must reflect the actual GSAP implementations in the codebase:

1. **`HeroConstruction` (Hero Section Canvas)**:
   * Orthographic vector wireframes that draw and assemble their coordinates (`x, y, z`) upon initial viewport entry.
2. **`SplitTextReveal` (Headlines)**:
   * Staggered word/character reveal with subtle translation and opacity fade (`y: 40px`, `duration: 0.8s`, `ease: "power3.out"`).
3. **`HorizontalPinGallery` (Diploma Showcase)**:
   * Viewport pins on vertical scroll; cards glide horizontally along a continuous rail with an active sheet indicator (`1 of 4`).
4. **`PinScrubStats` (Studio Metrics)**:
   * Metric numbers scrub-animate in sync with the user's scroll speed (`12+ Years`, `2,400+ Alumni`).
5. **`BlueprintPathDraw` (Card Hover & Triggers)**:
   * Hovering a course card triggers a continuous 1px SVG hairline vector trace around the card perimeter.
6. **`ScrollProgressScale` (Margin Datum)**:
   * A fixed architectural elevation scale bar (`0.00m` to `100.00m` / `1:100` to `1:50`) that fills dynamically based on page scroll depth.
7. **`Magnetic` (Interactive Buttons)**:
   * Primary CTA buttons exhibit magnetic physics, softly tethering to the user's cursor position on hover.

---

## 7. Canonical Content & Screen Specifications

### Screen 1: Home Page (The Architectural Atelier)
* **Navigation**: Minimal hairline bar with wordmark `SAWY ACADEMY`, `[ZAMALEK, CAIRO // EST. 2012]`, navigation items (Courses, Practice, Research, About), and `Magnetic` CTA `[Explore Diploma ↓]`.
* **Hero Section**:
  * Title: *"Where Architectural Proportion Meets Spatial Truth."*
  * Subtitle: *"Directed by Prof. Mohamed El Sawy — Vice Dean, Faculty of Engineering at MIU."*
  * Media: Real-time `HeroConstruction` vector stage paired with `ScrollProgressScale`.
* **Pinned Metrics (`PinScrubStats`)**:
  * 12+ Years Teaching Experience
  * 2,400+ Enrolled Online Students
  * 100% Online On-Demand Video Access
* **Featured Showcase (`HorizontalPinGallery`)**:
  * Programme: `The Architecture Diploma (Complete 4-Module Series)`
  * Modules:
    1. `Spatial Composition I` (Proportion, 8px Module, Void & Mass)
    2. `Drawing & Representation` (Orthographic Projections & The Section Cut)
    3. `Material Studies` (Concrete Formwork, Timber Joints & Bearing Stone)
    4. `Design Studio I` (Site Constraints, Parti Logic & Public Defense)
  * Price Format: Discreet mono tag in card corner `Tuition: EGP 52,000 // Full Diploma Track` + Button `[Inspect Syllabus →]`.
* **Footer**: Architectural title block featuring `12 Hassan Sabry Street, Zamalek, Cairo` and payment methods (InstaPay & Cards).

### Screen 2: Courses Page (The Studio Curriculum)
* **Header**: `Studio Programmes & Masterclasses` with format badge `[100% Online Digital Courses]` and instant filter pills: `All Online Courses (05)`, `Core Diploma (04)`, `Biogeometry (01)`.
* **Course Badges**: Every course card must feature an `[ONLINE COURSE]` or `[SELF-PACED / VIDEO LESSONS]` metadata chip. (Strictly DO NOT label as "1-on-1" or "in-person").
* **Diploma Cards (2-Column Spacious Grid)**:
  * **Card 1: ARC-D01 — Spatial Composition I**
    * Deliverables: 8px modular grids, solid-to-void poche drawings, 1:50 pavilion brief.
    * Sheets: `SC-01 Proportion` • `SC-02 Void & Mass` • `SC-03 Scale` • `SC-04 Studio Brief`
    * Fee: `Studio Fee: EGP 18,500`
  * **Card 2: ARC-D02 — Drawing & Representation**
    * Deliverables: Line-weight hierarchy, section cut poche, presentation sheet sets.
    * Sheets: `DR-01 Conventions` • `DR-02 Section Cut` • `DR-03 Set Composition` • `DR-04 Review`
    * Fee: `Studio Fee: EGP 16,800`
  * **Card 3: ARC-D03 — Material Studies**
    * Deliverables: Timber joints at 1:2 scale, Cairo board-marked concrete, bearing stone.
    * Fee: `Studio Fee: EGP 19,900`
  * **Card 4: ARC-D04 — Design Studio I**
    * Deliverables: Full site brief, parti diagram, structural bay, and guest jury defense.
    * Fee: `Studio Fee: EGP 22,000`
* **Specialized Research Card**:
  * **BIO-01 — Biogeometry: Level 01 / 03**
    * Deliverables: Harmonic proportions, center-of-gravity calculations, and spatial energy balancing.
    * Fee: `Studio Fee: EGP 14,500`
* **Interactive Animation Demo**: Hovering any course card triggers the `BlueprintPathDraw` hairline vector trace.
