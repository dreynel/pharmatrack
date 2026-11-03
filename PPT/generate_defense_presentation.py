"""
generate_defense_presentation.py
Generates the complete Capstone Pre-Oral Defense Presentation for PharmaTrack
strictly following the Capstone Pre-Oral Presentation Guide with Complete Sample.

Design Philosophy:
- Clean, academic, appropriate design (not overdesigned)
- 16:9 Widescreen (13.333 x 7.5 inches)
- Professional pharmacy color palette: Deep Navy, Medical Teal, Clean White/Ice Blue
- Strict fidelity to approved manuscript Chapters I-III
- High-resolution monochrome diagrams directly embedded
- Official PowerPoint speaker notes added to every slide
"""

import os
import pptx
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.dml.color import RGBColor

# Color definitions
C_NAVY = RGBColor(0x10, 0x24, 0x40)       # #102440 - Primary headers
C_TEAL = RGBColor(0x0A, 0x9A, 0x99)       # #0A9A99 - Accent / category tags
C_CHARCOAL = RGBColor(0x24, 0x33, 0x41)   # #243341 - Body text
C_SLATE = RGBColor(0x5B, 0x6E, 0x7E)      # #5B6E7E - Subtitles & footers
C_LIGHT_BG = RGBColor(0xEC, 0xF5, 0xFA)   # #ECF5FA - Card backgrounds
C_CARD_BORDER = RGBColor(0xCF, 0xE2, 0xEE)# #CFE2EE - Card borders
C_NOTE_TEXT = RGBColor(0x16, 0x65, 0xA8)   # #1665A8 - Presenter note text
C_WHITE = RGBColor(0xFF, 0xFF, 0xFF)      # #FFFFFF - Pure white
C_GREEN = RGBColor(0x0E, 0x8A, 0x16)      # #0E8A16 - Checkmark green
C_GRAY_ROW = RGBColor(0xF8, 0xFA, 0xFC)   # #F8FAFC - Table alternate row

FONT_NAME = "Aptos"  # Professional, modern default; falls back gracefully

def create_presentation():
    prs = pptx.Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]  # Blank layout

    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(base_dir)
    diagrams_dir = os.path.join(project_dir, "Documentation", "diagrams")

    # Candidate proponent photos
    photo_files = [
        os.path.join(base_dir, "873261612_1666221848249041_2346490323806827963_n.jpg"),
        os.path.join(base_dir, "884938197_1150620997506299_7643748251243424854_n.jpg"),
        os.path.join(base_dir, "887554916_1112045918387693_1033680730610810006_n.jpg"),
    ]
    has_photos = all(os.path.exists(p) for p in photo_files)

    def add_base_decorations(slide, category_text, title_text, slide_num, presenter_note_text=None):
        """Adds top accent bar, category breadcrumb, slide title, footer, and slide number."""
        # Top accent bar
        top_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.14))
        top_bar.fill.solid()
        top_bar.fill.fore_color.rgb = C_TEAL
        top_bar.line.fill.background()

        # Category / breadcrumb
        tb_cat = slide.shapes.add_textbox(Inches(0.8), Inches(0.35), Inches(11.7), Inches(0.35))
        tf_cat = tb_cat.text_frame
        tf_cat.word_wrap = True
        tf_cat.margin_left = tf_cat.margin_top = tf_cat.margin_right = tf_cat.margin_bottom = 0
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = category_text.upper()
        p_cat.font.name = FONT_NAME
        p_cat.font.size = Pt(11)
        p_cat.font.bold = True
        p_cat.font.color.rgb = C_TEAL

        # Slide title
        tb_title = slide.shapes.add_textbox(Inches(0.8), Inches(0.68), Inches(11.7), Inches(0.75))
        tf_title = tb_title.text_frame
        tf_title.word_wrap = True
        tf_title.margin_left = tf_title.margin_top = tf_title.margin_right = tf_title.margin_bottom = 0
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.name = FONT_NAME
        p_title.font.size = Pt(26)
        p_title.font.bold = True
        p_title.font.color.rgb = C_NAVY

        # Footer divider line
        divider = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(6.82), Inches(11.733), Inches(0.015))
        divider.fill.solid()
        divider.fill.fore_color.rgb = C_CARD_BORDER
        divider.line.fill.background()

        # Footer left text
        tb_foot = slide.shapes.add_textbox(Inches(0.8), Inches(6.92), Inches(10.0), Inches(0.3))
        tf_foot = tb_foot.text_frame
        tf_foot.word_wrap = True
        tf_foot.margin_left = tf_foot.margin_top = tf_foot.margin_right = tf_foot.margin_bottom = 0
        p_foot = tf_foot.paragraphs[0]
        p_foot.text = "CAPSTONE PRE-ORAL DEFENSE  •  CHAPTERS I–III  •  ISAT U – DUMANGAS CAMPUS"
        p_foot.font.name = FONT_NAME
        p_foot.font.size = Pt(9.5)
        p_foot.font.color.rgb = C_SLATE

        # Slide number
        tb_num = slide.shapes.add_textbox(Inches(11.533), Inches(6.92), Inches(1.0), Inches(0.3))
        tf_num = tb_num.text_frame
        tf_num.word_wrap = False
        tf_num.margin_left = tf_num.margin_top = tf_num.margin_right = tf_num.margin_bottom = 0
        p_num = tf_num.paragraphs[0]
        p_num.alignment = PP_ALIGN.RIGHT
        p_num.text = str(slide_num)
        p_num.font.name = FONT_NAME
        p_num.font.size = Pt(10)
        p_num.font.bold = True
        p_num.font.color.rgb = C_SLATE

        # Presenter note on slide (if provided)
        if presenter_note_text:
            tb_note = slide.shapes.add_textbox(Inches(0.8), Inches(6.25), Inches(11.733), Inches(0.45))
            tf_note = tb_note.text_frame
            tf_note.word_wrap = True
            tf_note.margin_left = tf_note.margin_top = tf_note.margin_right = tf_note.margin_bottom = 0
            p_note = tf_note.paragraphs[0]
            r_tag = p_note.add_run()
            r_tag.text = "PRESENTER NOTE: "
            r_tag.font.name = FONT_NAME
            r_tag.font.size = Pt(11)
            r_tag.font.bold = True
            r_tag.font.color.rgb = C_NOTE_TEXT

            r_body = p_note.add_run()
            r_body.text = presenter_note_text
            r_body.font.name = FONT_NAME
            r_body.font.size = Pt(11)
            r_body.font.color.rgb = C_CHARCOAL

            # Also add to official PowerPoint speaker notes
            slide.notes_slide.notes_text_frame.text = f"PRESENTER NOTE: {presenter_note_text}"

    def add_card(slide, left, top, width, height, lead_in, text_content, font_size=14, bullet=True):
        """Creates a clean rounded container card with lead-in and text."""
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = C_LIGHT_BG
        card.line.color.rgb = C_CARD_BORDER
        card.line.width = Pt(1)

        tb = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.12), width - Inches(0.4), height - Inches(0.24))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        p = tf.paragraphs[0]
        if bullet:
            r_b = p.add_run()
            r_b.text = "•  "
            r_b.font.name = FONT_NAME
            r_b.font.size = Pt(font_size)
            r_b.font.bold = True
            r_b.font.color.rgb = C_TEAL

        if lead_in:
            r_lead = p.add_run()
            r_lead.text = lead_in + ": "
            r_lead.font.name = FONT_NAME
            r_lead.font.size = Pt(font_size)
            r_lead.font.bold = True
            r_lead.font.color.rgb = C_NAVY

        r_text = p.add_run()
        r_text.text = text_content
        r_text.font.name = FONT_NAME
        r_text.font.size = Pt(font_size)
        r_text.font.color.rgb = C_CHARCOAL
        return card

    # =========================================================================
    # SLIDE 1: TITLE PAGE
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    # Header bar
    tbar = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.2))
    tbar.fill.solid()
    tbar.fill.fore_color.rgb = C_TEAL
    tbar.line.fill.background()

    # Subtitle / Department banner
    tb1_sub = s1.shapes.add_textbox(Inches(0.8), Inches(0.8), Inches(11.733), Inches(0.4))
    p = tb1_sub.text_frame.paragraphs[0]
    p.text = "ILOILO SCIENCE AND TECHNOLOGY UNIVERSITY  •  DUMANGAS CAMPUS"
    p.font.name = FONT_NAME
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_TEAL

    tb1_dept = s1.shapes.add_textbox(Inches(0.8), Inches(1.15), Inches(11.733), Inches(0.35))
    p = tb1_dept.text_frame.paragraphs[0]
    p.text = "Bachelor of Science in Information Technology  |  Capstone Pre-Oral Defense"
    p.font.name = FONT_NAME
    p.font.size = Pt(12)
    p.font.color.rgb = C_SLATE

    # Main Project Title Box
    title_box = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.65), Inches(11.733), Inches(2.2))
    title_box.fill.solid()
    title_box.fill.fore_color.rgb = C_LIGHT_BG
    title_box.line.color.rgb = C_CARD_BORDER
    title_box.line.width = Pt(1.5)

    tb_main = s1.shapes.add_textbox(Inches(1.1), Inches(1.85), Inches(11.133), Inches(1.8))
    tf_main = tb_main.text_frame
    tf_main.word_wrap = True
    p_proj = tf_main.paragraphs[0]
    p_proj.text = "PHARMATRACK"
    p_proj.font.name = FONT_NAME
    p_proj.font.size = Pt(36)
    p_proj.font.bold = True
    p_proj.font.color.rgb = C_NAVY

    p_proj_sub = tf_main.add_paragraph()
    p_proj_sub.text = "Sales and Inventory Management System with Demand Forecasting for Xyra Andrea Pharmacy"
    p_proj_sub.font.name = FONT_NAME
    p_proj_sub.font.size = Pt(20)
    p_proj_sub.font.color.rgb = C_CHARCOAL
    p_proj_sub.space_before = Pt(6)

    # Proponents & Details Section
    if has_photos:
        # Show 3 photo cards side-by-side
        card_w = Inches(3.64)
        for i, (photo_p, label) in enumerate(zip(photo_files, ["[Proponent Name 1]", "[Proponent Name 2]", "[Proponent Name 3]"])):
            c_left = Inches(0.8) + i * Inches(4.04)
            card = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, c_left, Inches(3.95), card_w, Inches(1.85))
            card.fill.solid()
            card.fill.fore_color.rgb = C_WHITE
            card.line.color.rgb = C_CARD_BORDER

            # Proponent photo
            s1.shapes.add_picture(photo_p, c_left + Inches(0.18), Inches(4.1), Inches(1.55), Inches(1.55))

            # Proponent label
            tb_lbl = s1.shapes.add_textbox(c_left + Inches(1.85), Inches(4.2), Inches(1.65), Inches(1.4))
            tf_lbl = tb_lbl.text_frame
            tf_lbl.word_wrap = True
            p1 = tf_lbl.paragraphs[0]
            p1.text = label
            p1.font.name = FONT_NAME
            p1.font.size = Pt(12)
            p1.font.bold = True
            p1.font.color.rgb = C_NAVY
            p2 = tf_lbl.add_paragraph()
            p2.text = "BSIT Student\nResearcher"
            p2.font.name = FONT_NAME
            p2.font.size = Pt(10)
            p2.font.color.rgb = C_SLATE
            p2.space_before = Pt(3)

        # Capstone Adviser Bar
        c_adv = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(5.95), Inches(11.733), Inches(0.68))
        c_adv.fill.solid()
        c_adv.fill.fore_color.rgb = C_LIGHT_BG
        c_adv.line.color.rgb = C_CARD_BORDER

        tb_adv = s1.shapes.add_textbox(Inches(1.0), Inches(6.05), Inches(11.333), Inches(0.48))
        tf_adv = tb_adv.text_frame
        p_adv = tf_adv.paragraphs[0]
        r_a1 = p_adv.add_run()
        r_a1.text = "CAPSTONE ADVISER:  "
        r_a1.font.name = FONT_NAME
        r_a1.font.size = Pt(11)
        r_a1.font.bold = True
        r_a1.font.color.rgb = C_TEAL

        r_a2 = p_adv.add_run()
        r_a2.text = "[Adviser Name]    |    Bachelor of Science in Information Technology    |    ISAT U – Dumangas Campus"
        r_a2.font.name = FONT_NAME
        r_a2.font.size = Pt(11)
        r_a2.font.bold = True
        r_a2.font.color.rgb = C_NAVY
    else:
        # Standard Clean Card for Proponents & Adviser
        c_prop = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(4.1), Inches(11.733), Inches(2.4))
        c_prop.fill.solid()
        c_prop.fill.fore_color.rgb = C_WHITE
        c_prop.line.color.rgb = C_CARD_BORDER

        tb_p = s1.shapes.add_textbox(Inches(1.2), Inches(4.35), Inches(11.0), Inches(1.9))
        tf_p = tb_p.text_frame
        p_pr = tf_p.paragraphs[0]
        p_pr.text = "PROPONENTS:"
        p_pr.font.name = FONT_NAME
        p_pr.font.size = Pt(13)
        p_pr.font.bold = True
        p_pr.font.color.rgb = C_TEAL

        p_pr_names = tf_p.add_paragraph()
        p_pr_names.text = "Student Researcher 1  •  Student Researcher 2  •  Student Researcher 3"
        p_pr_names.font.name = FONT_NAME
        p_pr_names.font.size = Pt(16)
        p_pr_names.font.bold = True
        p_pr_names.font.color.rgb = C_NAVY
        p_pr_names.space_before = Pt(4)

        p_adv = tf_p.add_paragraph()
        p_adv.text = "CAPSTONE ADVISER:  [Adviser Name]"
        p_adv.font.name = FONT_NAME
        p_adv.font.size = Pt(13)
        p_adv.font.bold = True
        p_adv.font.color.rgb = C_TEAL
        p_adv.space_before = Pt(14)

        p_adv_desc = tf_p.add_paragraph()
        p_adv_desc.text = "Bachelor of Science in Information Technology  |  ISAT U – Dumangas Campus"
        p_adv_desc.font.name = FONT_NAME
        p_adv_desc.font.size = Pt(12)
        p_adv_desc.font.color.rgb = C_SLATE
        p_adv_desc.space_before = Pt(2)

    # Footer line & text
    div = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(6.82), Inches(11.733), Inches(0.015))
    div.fill.solid()
    div.fill.fore_color.rgb = C_CARD_BORDER
    div.line.fill.background()

    tb_foot = s1.shapes.add_textbox(Inches(0.8), Inches(6.92), Inches(11.733), Inches(0.3))
    p = tb_foot.text_frame.paragraphs[0]
    p.text = "ISAT U – DUMANGAS CAMPUS  •  CAPSTONE PRE-ORAL DEFENSE  •  CHAPTERS I–III"
    p.font.name = FONT_NAME
    p.font.size = Pt(10)
    p.font.color.rgb = C_SLATE

    # =========================================================================
    # SLIDE 2: BACKGROUND OF THE STUDY
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    add_base_decorations(
        s2,
        "PHARMATRACK  •  CHAPTER I: INTRODUCTION",
        "Background of the Study",
        2,
        "Speak about context and empirical evidence from Xyra Andrea Pharmacy in Dumangas, Iloilo; avoid reading full paragraphs."
    )
    add_card(
        s2, Inches(0.8), Inches(1.6), Inches(11.733), Inches(1.25),
        "Current Practice",
        "Xyra Andrea Pharmacy in Dumangas, Iloilo manages daily counter sales, stock updates, and batch expirations using manual paper notebooks, handwritten receipts, and physical shelf inspections.",
        font_size=15
    )
    add_card(
        s2, Inches(0.8), Inches(3.05), Inches(11.733), Inches(1.35),
        "Identified Problems",
        "Manual record-keeping causes severe stock-count discrepancies, unexpected shortages of high-demand medications, undetected shelf expirations resulting in dead stock, and a lack of real-time sales visibility for the business owner.",
        font_size=15
    )
    add_card(
        s2, Inches(0.8), Inches(4.6), Inches(11.733), Inches(1.35),
        "Proposed Solution",
        "PharmaTrack: an integrated web-based sales and inventory management system with an internal POS checkout module, real-time stock deduction, automated low-stock and expiry alerts (<90 days), and seasonal demand forecasting based on previous sales.",
        font_size=15
    )

    # =========================================================================
    # SLIDE 3: OBJECTIVES OF THE STUDY (GENERAL & SPECIFIC)
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    add_base_decorations(
        s3,
        "PHARMATRACK  •  CHAPTER I: INTRODUCTION",
        "Objectives of the Study",
        3,
        "Present objectives verbatim as approved in the manuscript; do not paraphrase, merge, or omit specific items."
    )
    # General Objective Box
    c_gen = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(11.733), Inches(1.1))
    c_gen.fill.solid()
    c_gen.fill.fore_color.rgb = C_NAVY
    c_gen.line.fill.background()

    tb_g = s3.shapes.add_textbox(Inches(1.0), Inches(1.58), Inches(11.333), Inches(0.95))
    tf_g = tb_g.text_frame
    tf_g.word_wrap = True
    p_gh = tf_g.paragraphs[0]
    p_gh.text = "GENERAL OBJECTIVE"
    p_gh.font.name = FONT_NAME
    p_gh.font.size = Pt(11)
    p_gh.font.bold = True
    p_gh.font.color.rgb = C_TEAL
    p_gt = tf_g.add_paragraph()
    p_gt.text = "To design, develop, and evaluate PharmaTrack, a web-based sales and inventory management system with demand forecasting for Xyra Andrea Pharmacy in Dumangas, Iloilo."
    p_gt.font.name = FONT_NAME
    p_gt.font.size = Pt(13.5)
    p_gt.font.color.rgb = C_WHITE
    p_gt.space_before = Pt(3)

    # 6 Specific Objectives (2 columns of 3 cards)
    spec_objs = [
        ("Specific 1: POS Sales Processing", "Develop a web application with an integrated Point of Sale (POS) module for counter sales and automatic real-time stock deduction."),
        ("Specific 2: Inventory Control", "Create an inventory module to add, edit, and monitor medicine stocks, batch lots, and packaging unit conversions (boxes to pieces)."),
        ("Specific 3: Automated Alert Monitoring", "Build an automated alert feature notifying users when medicine stock is low or nearing expiration (<90 days)."),
        ("Specific 4: Web Sales Summaries", "Provide the pharmacy owner with daily, weekly, and monthly sales summaries and inventory balances via web browser."),
        ("Specific 5: Demand Forecasting", "Incorporate a demand forecasting module comparing same-month historical demand from last year against current stock to calculate reorders."),
        ("Specific 6: ISO/IEC 25010 Evaluation", "Evaluate the system's software quality using the international ISO/IEC 25010 software quality standards.")
    ]

    col_w = Inches(5.72)
    card_h = Inches(1.05)
    for idx, (title, desc) in enumerate(spec_objs):
        col = idx // 3
        row = idx % 3
        c_left = Inches(0.8) + col * Inches(6.01)
        c_top = Inches(2.75) + row * Inches(1.15)
        add_card(s3, c_left, c_top, col_w, card_h, title, desc, font_size=11.5, bullet=True)

    # =========================================================================
    # SLIDE 4: CONCEPTUAL FRAMEWORK (IPO MODEL)
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    add_base_decorations(
        s4,
        "PHARMATRACK  •  CHAPTER I: INTRODUCTION",
        "Conceptual Framework — Input-Process-Output (IPO)",
        4,
        "Explain orally that a single consolidated flow connects the bulleted inputs into the core processes, resulting in the completed system output and ISO/IEC 25010 evaluation feedback."
    )
    fig1_file = os.path.join(diagrams_dir, "fig1_conceptual_framework.png")
    if os.path.exists(fig1_file):
        # Insert high-res diagram
        s4.shapes.add_picture(fig1_file, Inches(0.8), Inches(1.45), Inches(8.3), Inches(4.7))
    else:
        # Fallback card
        add_card(s4, Inches(0.8), Inches(1.5), Inches(8.3), Inches(4.6), "IPO Framework", "Diagram fig1_conceptual_framework.png", font_size=13)

    # Right-side key explanation card
    c_right = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(9.3), Inches(1.45), Inches(3.233), Inches(4.7))
    c_right.fill.solid()
    c_right.fill.fore_color.rgb = C_LIGHT_BG
    c_right.line.color.rgb = C_CARD_BORDER

    tb_rk = s4.shapes.add_textbox(Inches(9.45), Inches(1.6), Inches(2.933), Inches(4.4))
    tf_rk = tb_rk.text_frame
    tf_rk.word_wrap = True
    p1 = tf_rk.paragraphs[0]
    p1.text = "CORE ALIGNMENT"
    p1.font.name = FONT_NAME
    p1.font.size = Pt(13)
    p1.font.bold = True
    p1.font.color.rgb = C_TEAL

    points = [
        ("Unified Flow", "A single central connection line channels all bulleted data inputs directly into the system processes."),
        ("Integrated POS", "POS checkout is inside the system, enabling instant atomic inventory deduction in real time."),
        ("Forecasting Engine", "Historical demand from same month last year evaluates against current stock on hand."),
        ("Evaluation Loop", "ISO/IEC 25010 feedback continuously refines system inputs and processing routines.")
    ]
    for h_txt, b_txt in points:
        p_pt = tf_rk.add_paragraph()
        p_pt.space_before = Pt(8)
        r1 = p_pt.add_run()
        r1.text = f"• {h_txt}: "
        r1.font.name = FONT_NAME
        r1.font.size = Pt(11)
        r1.font.bold = True
        r1.font.color.rgb = C_NAVY
        r2 = p_pt.add_run()
        r2.text = b_txt
        r2.font.name = FONT_NAME
        r2.font.size = Pt(10.5)
        r2.font.color.rgb = C_CHARCOAL

    # =========================================================================
    # SLIDE 5: SIGNIFICANCE OF THE STUDY
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    add_base_decorations(
        s5,
        "PHARMATRACK  •  CHAPTER I: INTRODUCTION",
        "Significance of the Study",
        5,
        "Highlight practical local benefits to suburban/rural community drugstores operating under resource constraints."
    )
    stakeholders = [
        ("Pharmacy Owner", "Provides real-time sales visibility, automated expiry warnings, and data-driven restocking guidance from same-month sales demand to prevent overstocking and dead stock."),
        ("Pharmacy Staff", "Eliminates tedious manual receipt writing and end-of-day stock counting through a fast, integrated Point of Sale screen with automatic stock deduction and packaging unit conversion."),
        ("Customers", "Ensures faster counter transactions, reduced waiting times during peak hours, and guaranteed access to safe, unexpired, and readily available medications."),
        ("Future Researchers", "Serves as an empirical and technical reference for IT students developing localized web-based sales, batch-tracking, and demand forecasting systems for small retail drugstores.")
    ]
    for idx, (sh_name, sh_desc) in enumerate(stakeholders):
        top_pos = Inches(1.55) + idx * Inches(1.15)
        add_card(s5, Inches(0.8), top_pos, Inches(11.733), Inches(1.02), sh_name, sh_desc, font_size=13.5)

    # =========================================================================
    # SLIDE 6: SCOPE AND LIMITATIONS OF THE STUDY
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    add_base_decorations(
        s6,
        "PHARMATRACK  •  CHAPTER I: INTRODUCTION",
        "Scope and Limitations of the Study",
        6,
        "Clearly distinguish planned and implemented functionality from intentional project boundaries and constraints."
    )
    # Left Column: Scope
    c_sc = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(5.72), Inches(4.65))
    c_sc.fill.solid()
    c_sc.fill.fore_color.rgb = C_LIGHT_BG
    c_sc.line.color.rgb = C_CARD_BORDER

    tb_sc = s6.shapes.add_textbox(Inches(1.0), Inches(1.65), Inches(5.32), Inches(4.35))
    tf_sc = tb_sc.text_frame
    tf_sc.word_wrap = True
    p_sc_h = tf_sc.paragraphs[0]
    p_sc_h.text = "PROJECT SCOPE"
    p_sc_h.font.name = FONT_NAME
    p_sc_h.font.size = Pt(13)
    p_sc_h.font.bold = True
    p_sc_h.font.color.rgb = C_TEAL

    scope_items = [
        ("Target Entity", "Xyra Andrea Pharmacy in Dumangas, Iloilo."),
        ("User Roles", "Owner/Admin (full privileges) and Staff/Cashier (restricted POS/inventory) via Role-Based Access Control (RBAC)."),
        ("Core Modules", "Integrated POS cashiering, barcode lookup, FEFO batch allocation, stock-in/stock-out logging, packaging unit conversions (boxes to pieces)."),
        ("Intelligent Alerting", "Automated low-stock threshold badges and batch expiry warnings (<90 days)."),
        ("Forecasting Engine", "Calculates depletion risk and suggested reorders using same-month historical demand vs. current stock.")
    ]
    for h_txt, b_txt in scope_items:
        p_item = tf_sc.add_paragraph()
        p_item.space_before = Pt(6)
        r1 = p_item.add_run()
        r1.text = f"• {h_txt}: "
        r1.font.name = FONT_NAME
        r1.font.size = Pt(11)
        r1.font.bold = True
        r1.font.color.rgb = C_NAVY
        r2 = p_item.add_run()
        r2.text = b_txt
        r2.font.name = FONT_NAME
        r2.font.size = Pt(10.5)
        r2.font.color.rgb = C_CHARCOAL

    # Right Column: Limitations
    c_lim = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.81), Inches(1.5), Inches(5.72), Inches(4.65))
    c_lim.fill.solid()
    c_lim.fill.fore_color.rgb = C_LIGHT_BG
    c_lim.line.color.rgb = C_CARD_BORDER

    tb_lim = s6.shapes.add_textbox(Inches(7.01), Inches(1.65), Inches(5.32), Inches(4.35))
    tf_lim = tb_lim.text_frame
    tf_lim.word_wrap = True
    p_lim_h = tf_lim.paragraphs[0]
    p_lim_h.text = "OPERATIONAL LIMITATIONS"
    p_lim_h.font.name = FONT_NAME
    p_lim_h.font.size = Pt(13)
    p_lim_h.font.bold = True
    p_lim_h.font.color.rgb = C_TEAL

    lim_items = [
        ("On-Premise Deployment", "Operates locally on store desktop hardware via XAMPP (Apache/MySQL) and local LAN/localhost; no external public cloud hosting."),
        ("Single Drugstore", "Designed exclusively for a single store location; does not support multi-branch synchronization or warehouse transfers."),
        ("Manual Payment Verification", "Cashiers record Cash, GCash, and Maya tenders, but transactions are verified manually (no direct bank API/gateway integration)."),
        ("Exclusions", "Excludes biometric employee timekeeping, payroll computation, and automated supplier electronic ordering.")
    ]
    for h_txt, b_txt in lim_items:
        p_item = tf_lim.add_paragraph()
        p_item.space_before = Pt(8)
        r1 = p_item.add_run()
        r1.text = f"• {h_txt}: "
        r1.font.name = FONT_NAME
        r1.font.size = Pt(11)
        r1.font.bold = True
        r1.font.color.rgb = C_NAVY
        r2 = p_item.add_run()
        r2.text = b_txt
        r2.font.name = FONT_NAME
        r2.font.size = Pt(10.5)
        r2.font.color.rgb = C_CHARCOAL

    # =========================================================================
    # SLIDE 7: DEFINITION OF TERMS
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    add_base_decorations(
        s7,
        "PHARMATRACK  •  CHAPTER I: INTRODUCTION",
        "Definition of Terms",
        7,
        "List all terms defined in the manuscript in alphabetical order. Complete conceptual and operational definitions belong in the manuscript."
    )
    terms_list = [
        "Alert Notification", "Barcode", "Local Database", "Dead Stock",
        "Demand Forecasting", "Expiration Date", "Inventory Management", "Low Stock Alert",
        "Owner or Admin Account", "Point of Sale (POS)", "Real-Time Update", "Restocking",
        "Sales Report", "Sales Transaction", "Staff or Cashier Account", "Supplier Directory",
        "Stock Keeping Unit (SKU)", "Stock Level", "Stock-In", "Stock-Out",
        "User Authentication", "Web Application"
    ]
    # Display in 4 columns of terms
    card_term = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(11.733), Inches(4.1))
    card_term.fill.solid()
    card_term.fill.fore_color.rgb = C_LIGHT_BG
    card_term.line.color.rgb = C_CARD_BORDER

    tb_t = s7.shapes.add_textbox(Inches(1.1), Inches(1.7), Inches(11.133), Inches(3.7))
    tf_t = tb_t.text_frame
    tf_t.word_wrap = True

    p_stat = tf_t.paragraphs[0]
    p_stat.text = "“The terms are defined conceptually and operationally in Chapter I of the manuscript.”"
    p_stat.font.name = FONT_NAME
    p_stat.font.size = Pt(14)
    p_stat.font.italic = True
    p_stat.font.bold = True
    p_stat.font.color.rgb = C_NAVY
    p_stat.alignment = PP_ALIGN.CENTER

    # 4 columns for 22 terms
    col_size = 6
    for c_idx in range(4):
        col_terms = terms_list[c_idx*col_size : (c_idx+1)*col_size]
        tb_col = s7.shapes.add_textbox(Inches(1.1) + c_idx * Inches(2.8), Inches(2.3), Inches(2.7), Inches(3.1))
        tf_col = tb_col.text_frame
        tf_col.word_wrap = True
        tf_col.margin_left = tf_col.margin_top = tf_col.margin_right = tf_col.margin_bottom = 0
        for t_i, term in enumerate(col_terms):
            p = tf_col.paragraphs[0] if t_i == 0 else tf_col.add_paragraph()
            p.space_before = Pt(4)
            r = p.add_run()
            r.text = f"•  {term}"
            r.font.name = FONT_NAME
            r.font.size = Pt(11)
            r.font.color.rgb = C_CHARCOAL

    # =========================================================================
    # SLIDE 8: REVIEW OF RELATED LITERATURE
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    add_base_decorations(
        s8,
        "PHARMATRACK  •  CHAPTER II: LITERATURE AND STUDIES",
        "Review of Related Literature",
        8,
        "Explain relevance verbally; write each source's actual title and 1-sentence key takeaway."
    )
    literature_items = [
        ("What is a Point-of-Sale System and How Does It Work?", "Square (2026)",
         "Web-based POS software running on standard browsers provides cost-effective flexibility for small retail stores, eliminating paper errors and manual receipt transfers."),
        ("Inventory Management Practices of Small-Scale Pharmacies", "Soliveres et al. (2024)",
         "Systematic inventory control prevents extreme outcomes—costly stockouts of vital medicines and overstocking slow-moving drugs that reach expiration."),
        ("GS1 Barcodes: Global Standards for Retail Product Identification", "GS1 (2026)",
         "Optical barcode scanning retrieves accurate product information in under one second, accelerating counter service and preventing medication dispensing errors."),
        ("Guidelines on Licensing of Drugstore/Pharmacy Outlets", "FDA Philippines (2014)",
         "Strict pharmacy regulations mandate systematic batch expiration tracking and the immediate removal of expired medicines to safeguard consumer health.")
    ]
    for idx, (title, author, finding) in enumerate(literature_items):
        top_pos = Inches(1.5) + idx * Inches(1.15)
        card = s8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), top_pos, Inches(11.733), Inches(1.05))
        card.fill.solid()
        card.fill.fore_color.rgb = C_LIGHT_BG
        card.line.color.rgb = C_CARD_BORDER

        tb = s8.shapes.add_textbox(Inches(1.0), top_pos + Inches(0.1), Inches(11.333), Inches(0.85))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p1 = tf.paragraphs[0]
        r1 = p1.add_run()
        r1.text = f"“{title}”  "
        r1.font.name = FONT_NAME
        r1.font.size = Pt(12)
        r1.font.bold = True
        r1.font.color.rgb = C_NAVY
        r2 = p1.add_run()
        r2.text = f"—  {author}"
        r2.font.name = FONT_NAME
        r2.font.size = Pt(11)
        r2.font.italic = True
        r2.font.color.rgb = C_TEAL

        p2 = tf.add_paragraph()
        p2.text = finding
        p2.font.name = FONT_NAME
        p2.font.size = Pt(11)
        p2.font.color.rgb = C_CHARCOAL
        p2.space_before = Pt(2)

    # =========================================================================
    # SLIDE 9: REVIEW OF RELATED STUDIES
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    add_base_decorations(
        s9,
        "PHARMATRACK  •  CHAPTER II: LITERATURE AND STUDIES",
        "Review of Related Studies",
        9,
        "Present actual reviewed study titles with key empirical contributions and identify relevance to PharmaTrack."
    )
    studies_items = [
        ("Stocks Inventory Management System: A Mobile Application", "Gatpolintan et al. (2023) — ISAT U Miagao",
         "Demonstrated that shifting from paper notebooks to role-separated digital stock tracking significantly reduced entry errors in local retail, but lacked POS and expiration monitoring."),
        ("Development and Quality Evaluation of a Web-Based Drug Inventory System", "Budianto et al. (2026)",
         "Achieved a 98.61% User Acceptance rating for web-based pharmacy stock control; validated the need for prominent in-app visual alert badges over browser notifications."),
        ("Simplified Barcode-Based POS and Inventory System with Replenishment Decision", "Panganiban & Bermusa (2020)",
         "Proved that barcode checkout cuts transaction times by >60% and automated replenishment logic based on sales velocity prevents over-purchasing."),
        ("The Mediating Effect of Replenishment Decisions on Cloud-Based Inventory Management", "Moreno et al. (2023)",
         "Empirical survey of 52 microbusinesses confirmed that digital inventory oversight significantly enhances record accuracy and reduces stockout frequency.")
    ]
    for idx, (title, author, finding) in enumerate(studies_items):
        top_pos = Inches(1.5) + idx * Inches(1.15)
        card = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), top_pos, Inches(11.733), Inches(1.05))
        card.fill.solid()
        card.fill.fore_color.rgb = C_LIGHT_BG
        card.line.color.rgb = C_CARD_BORDER

        tb = s9.shapes.add_textbox(Inches(1.0), top_pos + Inches(0.1), Inches(11.333), Inches(0.85))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p1 = tf.paragraphs[0]
        r1 = p1.add_run()
        r1.text = f"“{title}”  "
        r1.font.name = FONT_NAME
        r1.font.size = Pt(12)
        r1.font.bold = True
        r1.font.color.rgb = C_NAVY
        r2 = p1.add_run()
        r2.text = f"—  {author}"
        r2.font.name = FONT_NAME
        r2.font.size = Pt(11)
        r2.font.italic = True
        r2.font.color.rgb = C_TEAL

        p2 = tf.add_paragraph()
        p2.text = finding
        p2.font.name = FONT_NAME
        p2.font.size = Pt(11)
        p2.font.color.rgb = C_CHARCOAL
        p2.space_before = Pt(2)

    # =========================================================================
    # SLIDE 10: SYNTHESIS OF RELATED LITERATURE AND STUDIES
    # =========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    add_base_decorations(
        s10,
        "PHARMATRACK  •  CHAPTER II: LITERATURE AND STUDIES",
        "Synthesis of Related Literature and Studies",
        10,
        "Summarize shared insights and articulate the exact research gap that PharmaTrack addresses."
    )
    add_card(
        s10, Inches(0.8), Inches(1.55), Inches(11.733), Inches(1.3),
        "Shared Insights from Prior Research",
        "Prior studies consistently demonstrate that shifting from manual paper logs to digital retail software improves inventory accuracy, eliminates calculation mistakes, speeds up cashier checkout, and empowers business owners with timely sales data.",
        font_size=14
    )
    add_card(
        s10, Inches(0.8), Inches(3.05), Inches(11.733), Inches(1.4),
        "Identified Gap in Existing Systems",
        "Existing solutions typically address general retail merchandise or only isolated functions. Prior drugstore systems focused on back-office stock tracking without integrated POS cashiering, or lacked batch-level expiration alerts and historical sales demand forecasting.",
        font_size=14
    )
    add_card(
        s10, Inches(0.8), Inches(4.65), Inches(11.733), Inches(1.4),
        "PharmaTrack's Proposed Contribution",
        "PharmaTrack bridges these gaps by combining an integrated Point of Sale (POS) module, automatic stock deduction, FEFO batch allocation, medicine expiration monitoring, packaging unit conversion, and seasonal demand forecasting into a single cohesive web application.",
        font_size=14
    )

    # =========================================================================
    # SLIDE 11: COMPARISON OF RELATED STUDIES' FEATURES
    # =========================================================================
    s11 = prs.slides.add_slide(blank_layout)
    add_base_decorations(
        s11,
        "PHARMATRACK  •  CHAPTER II: LITERATURE AND STUDIES",
        "Comparison of Related Studies’ Features (Table 1)",
        11,
        "Rows represent major system functions; columns show reviewed studies and PharmaTrack. Use checkmarks for confirmed presence."
    )
    # Feature comparison table
    tbl_shape = s11.shapes.add_table(8, 6, Inches(0.8), Inches(1.5), Inches(11.733), Inches(4.6))
    tbl = tbl_shape.table

    # Column widths
    tbl.columns[0].width = Inches(3.733)
    tbl.columns[1].width = Inches(1.6)
    tbl.columns[2].width = Inches(1.6)
    tbl.columns[3].width = Inches(1.6)
    tbl.columns[4].width = Inches(1.6)
    tbl.columns[5].width = Inches(1.6)

    table_data = [
        ["System Features / Criteria", "Gatpolintan (2023)", "Budianto (2026)", "Panganiban (2020)", "Moreno (2023)", "PharmaTrack (Proposed)"],
        ["Digital Sales Recording (POS)", "✓", "—", "✓", "✓", "✓"],
        ["Automatic Stock Deduction", "✓", "✓", "✓", "✓", "✓"],
        ["Medicine Expiration Alerts", "—", "✓", "—", "—", "✓"],
        ["Barcode Product Lookup", "—", "—", "✓", "—", "✓"],
        ["Remote Owner Access / Summary", "—", "—", "—", "✓", "✓"],
        ["Low-Stock Automated Warnings", "✓", "✓", "—", "—", "✓"],
        ["Demand Forecasting (Previous Sales)", "—", "—", "✓", "—", "✓"]
    ]

    for r_idx, row in enumerate(table_data):
        for c_idx, val in enumerate(row):
            cell = tbl.cell(r_idx, c_idx)
            cell.text = val
            p = cell.text_frame.paragraphs[0]
            p.font.name = FONT_NAME
            if r_idx == 0:
                cell.fill.solid()
                cell.fill.fore_color.rgb = C_NAVY if c_idx < 5 else C_TEAL
                p.font.bold = True
                p.font.size = Pt(11)
                p.font.color.rgb = C_WHITE
                p.alignment = PP_ALIGN.LEFT if c_idx == 0 else PP_ALIGN.CENTER
            else:
                cell.fill.solid()
                if c_idx == 5:
                    cell.fill.fore_color.rgb = C_LIGHT_BG
                else:
                    cell.fill.fore_color.rgb = C_WHITE if r_idx % 2 == 1 else C_GRAY_ROW
                p.font.size = Pt(12)
                p.alignment = PP_ALIGN.LEFT if c_idx == 0 else PP_ALIGN.CENTER
                if val == "✓":
                    p.font.bold = True
                    p.font.color.rgb = C_GREEN if c_idx == 5 else C_CHARCOAL
                elif val == "—":
                    p.font.color.rgb = C_SLATE
                else:
                    p.font.color.rgb = C_NAVY

    # =========================================================================
    # SLIDE 12: PROJECT DESCRIPTION
    # =========================================================================
    s12 = prs.slides.add_slide(blank_layout)
    add_base_decorations(
        s12,
        "PHARMATRACK  •  CHAPTER III: METHODOLOGY",
        "Project Description",
        12,
        "Explain what the system is, who will use it, and how POS cashiering operates natively inside the system."
    )
    add_card(
        s12, Inches(0.8), Inches(1.5), Inches(11.733), Inches(1.25),
        "What PharmaTrack Is",
        "PharmaTrack is an on-premise, web-based sales and inventory management system with demand forecasting engineered specifically for Xyra Andrea Pharmacy in Dumangas, Iloilo to replace manual paper logbooks.",
        font_size=14.5
    )

    # Two columns: User roles
    add_card(
        s12, Inches(0.8), Inches(2.95), Inches(5.72), Inches(1.95),
        "Owner / Admin Role",
        "Executive administrative authority over business operations:\n• Master Stock Catalog editing and retail pricing\n• Supplier directory management and purchase history\n• Staff user account provisioning\n• Sales audits, profit summaries, and seasonal demand forecasting",
        font_size=12
    )
    add_card(
        s12, Inches(6.81), Inches(2.95), Inches(5.72), Inches(1.95),
        "Staff / Cashier Role",
        "Dedicated counter cashiering and inventory support:\n• Built-in POS checkout with FEFO batch allocation\n• Barcode scanning, discounts (Senior/PWD), and receipt printing\n• Stock-In delivery logging and Stock-Out disposal records\n• Packaging unit conversions (boxes to loose pieces)",
        font_size=12
    )

    add_card(
        s12, Inches(0.8), Inches(5.1), Inches(11.733), Inches(0.95),
        "Technology Stack",
        "PHP 8.1+ (Backend Logic)  |  MySQL / MariaDB (Relational Database)  |  HTML5, CSS3, Bootstrap 5.3, JavaScript ES6 (Frontend UI)  |  Apache via XAMPP Local Environment",
        font_size=13
    )

    # =========================================================================
    # SLIDE 13: PROJECT DEVELOPMENT (PROTOTYPING MODEL SDLC)
    # =========================================================================
    s13 = prs.slides.add_slide(blank_layout)
    add_base_decorations(
        s13,
        "PHARMATRACK  •  CHAPTER III: METHODOLOGY",
        "Project Development — Prototyping Model (Figure 2)",
        13,
        "Explain why the Prototyping Model was chosen: continuous user feedback from drugstore personnel guided iterative refinements."
    )
    fig2_file = os.path.join(diagrams_dir, "fig2_prototyping_model.png")
    if os.path.exists(fig2_file):
        s13.shapes.add_picture(fig2_file, Inches(0.8), Inches(1.5), Inches(6.5), Inches(4.5))

    # Right side: Phase descriptions
    c_sdlc = s13.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.5), Inches(1.5), Inches(5.033), Inches(4.6))
    c_sdlc.fill.solid()
    c_sdlc.fill.fore_color.rgb = C_LIGHT_BG
    c_sdlc.line.color.rgb = C_CARD_BORDER

    tb_sd = s13.shapes.add_textbox(Inches(7.7), Inches(1.65), Inches(4.633), Inches(4.3))
    tf_sd = tb_sd.text_frame
    tf_sd.word_wrap = True
    p1 = tf_sd.paragraphs[0]
    p1.text = "PROTOTYPING PHASES"
    p1.font.name = FONT_NAME
    p1.font.size = Pt(13)
    p1.font.bold = True
    p1.font.color.rgb = C_TEAL

    sdlc_steps = [
        ("Planning & Requirements", "On-site visits to Xyra Andrea Pharmacy; identified paper log bottlenecks and established project scope."),
        ("Quick Design", "Drafted wireframes, relational database schemas, and navigation flowcharts for counter sales and stock tracking."),
        ("Prototype Development", "Built functional working prototype in PHP/MySQL featuring POS cashiering and real-time inventory updates."),
        ("User Evaluation & Refinement", "Pharmacy owner and staff tested prototype; refined POS layout, unit conversion, and dashboard alerts."),
        ("Implementation & Testing", "Constructed final modules, executed unit, integration, and black box testing; conducted ISO/IEC 25010 evaluation.")
    ]
    for h_txt, b_txt in sdlc_steps:
        p_pt = tf_sd.add_paragraph()
        p_pt.space_before = Pt(6)
        r1 = p_pt.add_run()
        r1.text = f"• {h_txt}: "
        r1.font.name = FONT_NAME
        r1.font.size = Pt(11)
        r1.font.bold = True
        r1.font.color.rgb = C_NAVY
        r2 = p_pt.add_run()
        r2.text = b_txt
        r2.font.name = FONT_NAME
        r2.font.size = Pt(10)
        r2.font.color.rgb = C_CHARCOAL

    # =========================================================================
    # SLIDE 14: USE CASE DIAGRAM
    # =========================================================================
    s14 = prs.slides.add_slide(blank_layout)
    add_base_decorations(
        s14,
        "PHARMATRACK  •  CHAPTER III: METHODOLOGY",
        "Use Case Diagram — Actor Functions (Figure 3)",
        14,
        "Briefly explain actor responsibilities and how administrative privileges protect master pricing and supplier contracts."
    )
    fig3_file = os.path.join(diagrams_dir, "fig3_use_case_diagram.png")
    if os.path.exists(fig3_file):
        s14.shapes.add_picture(fig3_file, Inches(0.8), Inches(1.45), Inches(8.3), Inches(4.7))

    # Right side: Actor summary
    c_uc = s14.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(9.3), Inches(1.45), Inches(3.233), Inches(4.7))
    c_uc.fill.solid()
    c_uc.fill.fore_color.rgb = C_LIGHT_BG
    c_uc.line.color.rgb = C_CARD_BORDER

    tb_uc = s14.shapes.add_textbox(Inches(9.45), Inches(1.6), Inches(2.933), Inches(4.4))
    tf_uc = tb_uc.text_frame
    tf_uc.word_wrap = True
    p1 = tf_uc.paragraphs[0]
    p1.text = "ACTOR RESPONSIBILITIES"
    p1.font.name = FONT_NAME
    p1.font.size = Pt(12)
    p1.font.bold = True
    p1.font.color.rgb = C_TEAL

    p_st = tf_uc.add_paragraph()
    p_st.space_before = Pt(6)
    r1 = p_st.add_run()
    r1.text = "Staff / Cashier:\n"
    r1.font.name = FONT_NAME
    r1.font.size = Pt(11)
    r1.font.bold = True
    r1.font.color.rgb = C_NAVY
    r2 = p_st.add_run()
    r2.text = "• Process Sales (POS)\n• Record Stock-In\n• Record Stock-Out\n• Unit Conversion\n• View Stock Alerts\n• View Counter Logs"
    r2.font.name = FONT_NAME
    r2.font.size = Pt(10)
    r2.font.color.rgb = C_CHARCOAL

    p_ow = tf_uc.add_paragraph()
    p_ow.space_before = Pt(8)
    r3 = p_ow.add_run()
    r3.text = "Owner / Admin:\n"
    r3.font.name = FONT_NAME
    r3.font.size = Pt(11)
    r3.font.bold = True
    r3.font.color.rgb = C_NAVY
    r4 = p_ow.add_run()
    r4.text = "• All Cashier Functions\n• Manage Products & Prices\n• Manage Suppliers\n• Manage User Accounts\n• Demand Forecasting\n• Sales & Audit Reports"
    r4.font.name = FONT_NAME
    r4.font.size = Pt(10)
    r4.font.color.rgb = C_CHARCOAL

    # =========================================================================
    # SLIDE 15: ACTIVITY DIAGRAM — STAFF / CASHIER
    # =========================================================================
    s15 = prs.slides.add_slide(blank_layout)
    add_base_decorations(
        s15,
        "PHARMATRACK  •  CHAPTER III: METHODOLOGY",
        "Activity Diagram — Staff / Cashier Workflow (Figure 4)",
        15,
        "Emphasize that successful cashier login routes directly into the built-in POS module inside PharmaTrack."
    )
    fig4_file = os.path.join(diagrams_dir, "fig4_activity_staff.png")
    if os.path.exists(fig4_file):
        s15.shapes.add_picture(fig4_file, Inches(0.8), Inches(1.45), Inches(7.5), Inches(4.7))

    # Right side: Flow highlights
    c_act = s15.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.5), Inches(1.45), Inches(4.033), Inches(4.7))
    c_act.fill.solid()
    c_act.fill.fore_color.rgb = C_LIGHT_BG
    c_act.line.color.rgb = C_CARD_BORDER

    tb_a = s15.shapes.add_textbox(Inches(8.7), Inches(1.6), Inches(3.633), Inches(4.4))
    tf_a = tb_a.text_frame
    tf_a.word_wrap = True
    p1 = tf_a.paragraphs[0]
    p1.text = "CASHIER WORKFLOW"
    p1.font.name = FONT_NAME
    p1.font.size = Pt(13)
    p1.font.bold = True
    p1.font.color.rgb = C_TEAL

    act_steps = [
        ("Login Authentication", "Cashier submits credentials; valid authentication routes directly to the built-in POS module."),
        ("Point of Sale (POS)", "Scan barcode or search name; First-Expiry First-Out (FEFO) batch priority tags; cash/GCash/Maya payment tenders."),
        ("Atomic Deduction", "Real-time stock decrement from database batch records upon checkout completion; issues thermal receipt."),
        ("Inventory Support", "Record stock-in shipments, document damaged/expired stock-out pullouts, and convert whole boxes to pieces.")
    ]
    for h_txt, b_txt in act_steps:
        p_pt = tf_a.add_paragraph()
        p_pt.space_before = Pt(8)
        r1 = p_pt.add_run()
        r1.text = f"• {h_txt}: "
        r1.font.name = FONT_NAME
        r1.font.size = Pt(11)
        r1.font.bold = True
        r1.font.color.rgb = C_NAVY
        r2 = p_pt.add_run()
        r2.text = b_txt
        r2.font.name = FONT_NAME
        r2.font.size = Pt(10)
        r2.font.color.rgb = C_CHARCOAL

    # =========================================================================
    # SLIDE 16: ACTIVITY DIAGRAM — OWNER / ADMIN
    # =========================================================================
    s16 = prs.slides.add_slide(blank_layout)
    add_base_decorations(
        s16,
        "PHARMATRACK  •  CHAPTER III: METHODOLOGY",
        "Activity Diagram — Owner / Admin Workflow (Figure 5)",
        16,
        "Describe the 4 executive branches: Demand Forecasting, Master Catalog, Supplier Directory, and Financial Audits."
    )
    fig5_file = os.path.join(diagrams_dir, "fig5_activity_owner.png")
    if os.path.exists(fig5_file):
        s16.shapes.add_picture(fig5_file, Inches(0.8), Inches(1.45), Inches(7.5), Inches(4.7))

    # Right side: Flow highlights
    c_acto = s16.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.5), Inches(1.45), Inches(4.033), Inches(4.7))
    c_acto.fill.solid()
    c_acto.fill.fore_color.rgb = C_LIGHT_BG
    c_acto.line.color.rgb = C_CARD_BORDER

    tb_ao = s16.shapes.add_textbox(Inches(8.7), Inches(1.6), Inches(3.633), Inches(4.4))
    tf_ao = tb_ao.text_frame
    tf_ao.word_wrap = True
    p1 = tf_ao.paragraphs[0]
    p1.text = "ADMINISTRATIVE WORKFLOW"
    p1.font.name = FONT_NAME
    p1.font.size = Pt(13)
    p1.font.bold = True
    p1.font.color.rgb = C_TEAL

    acto_steps = [
        ("Admin Authentication", "Owner logs in; system grants complete access to the centralized Admin Dashboard."),
        ("Demand Forecasting", "Queries historical demand from same month of prior year; compares against current stock; applies 20% safety buffer to compute suggested reorders."),
        ("Administrative Control", "Manages master product catalog, classifications, selling prices, supplier contact directory, and staff accounts."),
        ("Sales & Auditing", "Audits daily gross revenue, payment tender breakdowns (Cash/GCash/Maya), and shelf low-stock/expiry alerts.")
    ]
    for h_txt, b_txt in acto_steps:
        p_pt = tf_ao.add_paragraph()
        p_pt.space_before = Pt(8)
        r1 = p_pt.add_run()
        r1.text = f"• {h_txt}: "
        r1.font.name = FONT_NAME
        r1.font.size = Pt(11)
        r1.font.bold = True
        r1.font.color.rgb = C_NAVY
        r2 = p_pt.add_run()
        r2.text = b_txt
        r2.font.name = FONT_NAME
        r2.font.size = Pt(10)
        r2.font.color.rgb = C_CHARCOAL

    # =========================================================================
    # SLIDE 17: SEQUENCE DIAGRAM — OWNER / ADMIN WORKFLOW
    # =========================================================================
    s17 = prs.slides.add_slide(blank_layout)
    add_base_decorations(
        s17,
        "PHARMATRACK  •  CHAPTER III: METHODOLOGY",
        "Sequence Diagram — Owner / Admin Workflow (Figure 6)",
        17,
        "Demarcated by process separators: Authentication -> Demand Forecasting -> Stock Catalog -> Suppliers -> Staff Accounts -> Audits."
    )
    fig6_file = os.path.join(diagrams_dir, "fig6_sequence_owner.png")
    if os.path.exists(fig6_file):
        s17.shapes.add_picture(fig6_file, Inches(0.8), Inches(1.45), Inches(7.5), Inches(4.7))

    # Right side: Owner sequence explanation
    c_seqo = s17.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.5), Inches(1.45), Inches(4.033), Inches(4.7))
    c_seqo.fill.solid()
    c_seqo.fill.fore_color.rgb = C_LIGHT_BG
    c_seqo.line.color.rgb = C_CARD_BORDER

    tb_so = s17.shapes.add_textbox(Inches(8.7), Inches(1.6), Inches(3.633), Inches(4.4))
    tf_so = tb_so.text_frame
    tf_so.word_wrap = True
    p1 = tf_so.paragraphs[0]
    p1.text = "ADMINISTRATIVE MESSAGES"
    p1.font.name = FONT_NAME
    p1.font.size = Pt(13)
    p1.font.bold = True
    p1.font.color.rgb = C_TEAL

    seqo_steps = [
        ("Authentication & Access", "Browser sends admin credentials; PHP server validates against MySQL users table and renders Admin Dashboard."),
        ("Demand Forecasting", "Queries historical demand for same month last year vs. current stock; returns depletion risk and reorder quantities."),
        ("Catalog & Pricing", "Commits master product additions, classifications, and retail price modifications to the database."),
        ("Supplier Directory", "Encodes distributor profiles, contact persons, and delivery references into suppliers table."),
        ("Sales Audit & Reports", "Aggregates revenue totals, gross margins, and tender distributions from sales records.")
    ]
    for h_txt, b_txt in seqo_steps:
        p_pt = tf_so.add_paragraph()
        p_pt.space_before = Pt(6)
        r1 = p_pt.add_run()
        r1.text = f"• {h_txt}: "
        r1.font.name = FONT_NAME
        r1.font.size = Pt(11)
        r1.font.bold = True
        r1.font.color.rgb = C_NAVY
        r2 = p_pt.add_run()
        r2.text = b_txt
        r2.font.name = FONT_NAME
        r2.font.size = Pt(9.5)
        r2.font.color.rgb = C_CHARCOAL

    # =========================================================================
    # SLIDE 18: SEQUENCE DIAGRAM — STAFF / CASHIER WORKFLOW
    # =========================================================================
    s18 = prs.slides.add_slide(blank_layout)
    add_base_decorations(
        s18,
        "PHARMATRACK  •  CHAPTER III: METHODOLOGY",
        "Sequence Diagram — Staff / Cashier Workflow (Figure 7)",
        18,
        "Notice: Point of Sale cashiering operates inside the system; checkout executes an atomic stock deduction in real time."
    )
    fig7_file = os.path.join(diagrams_dir, "fig7_sequence_staff.png")
    if os.path.exists(fig7_file):
        s18.shapes.add_picture(fig7_file, Inches(0.8), Inches(1.45), Inches(7.5), Inches(4.7))

    # Right side: Cashier sequence explanation
    c_seqs = s18.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.5), Inches(1.45), Inches(4.033), Inches(4.7))
    c_seqs.fill.solid()
    c_seqs.fill.fore_color.rgb = C_LIGHT_BG
    c_seqs.line.color.rgb = C_CARD_BORDER

    tb_ss = s18.shapes.add_textbox(Inches(8.7), Inches(1.6), Inches(3.633), Inches(4.4))
    tf_ss = tb_ss.text_frame
    tf_ss.word_wrap = True
    p1 = tf_ss.paragraphs[0]
    p1.text = "CASHIERING MESSAGES"
    p1.font.name = FONT_NAME
    p1.font.size = Pt(13)
    p1.font.bold = True
    p1.font.color.rgb = C_TEAL

    seqs_steps = [
        ("Login -> Direct to POS", "Validation confirms staff role and routes the browser natively into the built-in POS cashiering module."),
        ("POS Atomic Checkout", "Cashier submits sale; server verifies batch availability, inserts sale record, and decrements batch counts in real time."),
        ("Stock-In Recording", "Logs received delivery lots, batch numbers, supplier info, and increments inventory balances."),
        ("Stock-Out Disposal", "Records discarded or expired items with justifications, immediately updating usable stock counts."),
        ("Packaging Unit Conversion", "Converts master packaging boxes into individual dispensing pieces using defined conversion ratios.")
    ]
    for h_txt, b_txt in seqs_steps:
        p_pt = tf_ss.add_paragraph()
        p_pt.space_before = Pt(6)
        r1 = p_pt.add_run()
        r1.text = f"• {h_txt}: "
        r1.font.name = FONT_NAME
        r1.font.size = Pt(11)
        r1.font.bold = True
        r1.font.color.rgb = C_NAVY
        r2 = p_pt.add_run()
        r2.text = b_txt
        r2.font.name = FONT_NAME
        r2.font.size = Pt(9.5)
        r2.font.color.rgb = C_CHARCOAL

    # =========================================================================
    # SLIDE 19: CLASS DIAGRAM — DATABASE ARCHITECTURE
    # =========================================================================
    s19 = prs.slides.add_slide(blank_layout)
    add_base_decorations(
        s19,
        "PHARMATRACK  •  CHAPTER III: METHODOLOGY",
        "Class Diagram — Relational Database Architecture (Figure 8)",
        19,
        "Illustrates the 8 core relational entities: User, Product, Supplier, Sale, SaleItem, StockIn, StockOut, and Batch."
    )
    fig8_file = os.path.join(diagrams_dir, "fig8_class_diagram.png")
    if os.path.exists(fig8_file):
        s19.shapes.add_picture(fig8_file, Inches(0.8), Inches(1.45), Inches(7.5), Inches(4.7))

    # Right side: Database entities explanation
    c_cls = s19.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.5), Inches(1.45), Inches(4.033), Inches(4.7))
    c_cls.fill.solid()
    c_cls.fill.fore_color.rgb = C_LIGHT_BG
    c_cls.line.color.rgb = C_CARD_BORDER

    tb_cl = s19.shapes.add_textbox(Inches(8.7), Inches(1.6), Inches(3.633), Inches(4.4))
    tf_cl = tb_cl.text_frame
    tf_cl.word_wrap = True
    p1 = tf_cl.paragraphs[0]
    p1.text = "CORE DATABASE ENTITIES"
    p1.font.name = FONT_NAME
    p1.font.size = Pt(13)
    p1.font.bold = True
    p1.font.color.rgb = C_TEAL

    entities = [
        ("User", "Manages user credentials, hashed passwords (bcrypt), and role permissions (Admin vs. Staff)."),
        ("Product & Batch", "Tracks medicine details, barcodes, categories, retail prices, batch numbers, and expiry dates."),
        ("Sale & SaleItem", "Stores transactional receipt headers, total revenue, line items, and tender allocations."),
        ("StockIn & StockOut", "Logs delivery shipments, supplier references, and recorded item disposal justifications."),
        ("Referential Integrity", "Enforces foreign keys, preventing orphan transactions and ensuring accurate audit trails.")
    ]
    for h_txt, b_txt in entities:
        p_pt = tf_cl.add_paragraph()
        p_pt.space_before = Pt(6)
        r1 = p_pt.add_run()
        r1.text = f"• {h_txt}: "
        r1.font.name = FONT_NAME
        r1.font.size = Pt(11)
        r1.font.bold = True
        r1.font.color.rgb = C_NAVY
        r2 = p_pt.add_run()
        r2.text = b_txt
        r2.font.name = FONT_NAME
        r2.font.size = Pt(9.5)
        r2.font.color.rgb = C_CHARCOAL

    # =========================================================================
    # SLIDE 20: SYSTEM ARCHITECTURE
    # =========================================================================
    s20 = prs.slides.add_slide(blank_layout)
    add_base_decorations(
        s20,
        "PHARMATRACK  •  CHAPTER III: METHODOLOGY",
        "System Architecture — Local Deployment (Figure 9)",
        20,
        "Show client PC, LAN network, Apache application server, and local MySQL database. No external cloud infrastructure required."
    )
    fig9_file = os.path.join(diagrams_dir, "fig9_system_architecture.png")
    if os.path.exists(fig9_file):
        s20.shapes.add_picture(fig9_file, Inches(0.8), Inches(1.45), Inches(7.5), Inches(4.7))

    # Right side: Architecture component details
    c_arch = s20.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.5), Inches(1.45), Inches(4.033), Inches(4.7))
    c_arch.fill.solid()
    c_arch.fill.fore_color.rgb = C_LIGHT_BG
    c_arch.line.color.rgb = C_CARD_BORDER

    tb_ar = s20.shapes.add_textbox(Inches(8.7), Inches(1.6), Inches(3.633), Inches(4.4))
    tf_ar = tb_ar.text_frame
    tf_ar.word_wrap = True
    p1 = tf_ar.paragraphs[0]
    p1.text = "3-TIER ARCHITECTURE"
    p1.font.name = FONT_NAME
    p1.font.size = Pt(13)
    p1.font.bold = True
    p1.font.color.rgb = C_TEAL

    arch_parts = [
        ("Client Tier", "PC / Cashier Terminal (running built-in POS) and PC / Admin Workstation accessing PharmaTrack via web browsers."),
        ("Network Infrastructure", "Local Area Network (LAN) / Localhost connection inside the pharmacy; no external internet required for sales."),
        ("Application Server", "Apache Web Server and PHP backend engine executing business logic, RBAC, and demand forecasting calculations."),
        ("Database Tier", "MySQL relational database storing products, batch lot numbers, expiration dates, transactions, and user accounts.")
    ]
    for h_txt, b_txt in arch_parts:
        p_pt = tf_ar.add_paragraph()
        p_pt.space_before = Pt(8)
        r1 = p_pt.add_run()
        r1.text = f"• {h_txt}: "
        r1.font.name = FONT_NAME
        r1.font.size = Pt(11)
        r1.font.bold = True
        r1.font.color.rgb = C_NAVY
        r2 = p_pt.add_run()
        r2.text = b_txt
        r2.font.name = FONT_NAME
        r2.font.size = Pt(10)
        r2.font.color.rgb = C_CHARCOAL

    # =========================================================================
    # SLIDE 21: PROJECT EVALUATION (ISO/IEC 25010)
    # =========================================================================
    s21 = prs.slides.add_slide(blank_layout)
    add_base_decorations(
        s21,
        "PHARMATRACK  •  CHAPTER III: METHODOLOGY",
        "Project Evaluation — ISO/IEC 25010 Quality Model",
        21,
        "Name the 8 ISO/IEC 25010 characteristics; identify the 10 purposively selected evaluators (5 IT experts and 5 pharmacy domain users)."
    )
    # 8 ISO Characteristics in 2 columns
    iso_chars = [
        ("Functional Suitability", "Degree to which POS, inventory, alerts, and demand forecasting meet specified requirements."),
        ("Usability", "Ease of navigation, learnability, and operational clarity for drugstore staff and owner."),
        ("Reliability", "Consistent transaction processing and stock subtraction without system faults or data loss."),
        ("Performance Efficiency", "Fast barcode lookup (<1s), instant cart calculations, and responsive interface."),
        ("Maintainability", "Modular PHP/MySQL codebase structured for effortless updates and future expansion."),
        ("Portability", "Cross-platform compatibility across modern browsers on desktop PCs and laptops."),
        ("Security", "Role-based access control (RBAC), bcrypt password hashing, and session management."),
        ("Compatibility", "Seamless operation over local area network alongside thermal printers and barcode scanners.")
    ]
    col_w = Inches(5.72)
    card_h = Inches(1.02)
    for idx, (char_name, char_desc) in enumerate(iso_chars):
        col = idx // 4
        row = idx % 4
        c_left = Inches(0.8) + col * Inches(6.01)
        c_top = Inches(1.55) + row * Inches(1.15)
        add_card(s21, c_left, c_top, col_w, card_h, char_name, char_desc, font_size=11.5, bullet=True)

    # =========================================================================
    # SLIDE 22: DATA GATHERING INSTRUMENT AND STATISTICAL TOOL
    # =========================================================================
    s22 = prs.slides.add_slide(blank_layout)
    add_base_decorations(
        s22,
        "PHARMATRACK  •  CHAPTER III: METHODOLOGY",
        "Data Gathering Instrument and Statistical Tool",
        22,
        "Identify the 24-item ISO/IEC 25010 questionnaire, weighted mean statistical treatment, and 5-point Likert interpretation scale."
    )
    # Left Card: Instrument & Sampling
    c_inst = s22.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(5.72), Inches(4.6))
    c_inst.fill.solid()
    c_inst.fill.fore_color.rgb = C_LIGHT_BG
    c_inst.line.color.rgb = C_CARD_BORDER

    tb_in = s22.shapes.add_textbox(Inches(1.0), Inches(1.65), Inches(5.32), Inches(4.3))
    tf_in = tb_in.text_frame
    tf_in.word_wrap = True
    p1 = tf_in.paragraphs[0]
    p1.text = "EVALUATION INSTRUMENT & RESPONDENTS"
    p1.font.name = FONT_NAME
    p1.font.size = Pt(13)
    p1.font.bold = True
    p1.font.color.rgb = C_TEAL

    inst_items = [
        ("Instrument", "24-item evaluation questionnaire adapted from ISO/IEC 25010 (3 indicators per characteristic) on a 5-point Likert scale."),
        ("Qualitative Feedback", "Open-ended recommendation section for interface comments and usability suggestions."),
        ("Purposive Sampling", "Total of 10 qualified evaluators:\n• 5 IT Experts (Faculty & Software Engineers) evaluating architecture, security, and database design\n• 5 Domain Users (Owner, Licensed Pharmacy Assistants, Cashiers) evaluating practical usability and counter workflows."),
        ("Statistical Treatment", "Weighted Mean formula:\nWeighted Mean = (Sum of Ratings) / (Total Respondents)")
    ]
    for h_txt, b_txt in inst_items:
        p_pt = tf_in.add_paragraph()
        p_pt.space_before = Pt(8)
        r1 = p_pt.add_run()
        r1.text = f"• {h_txt}: "
        r1.font.name = FONT_NAME
        r1.font.size = Pt(11)
        r1.font.bold = True
        r1.font.color.rgb = C_NAVY
        r2 = p_pt.add_run()
        r2.text = b_txt
        r2.font.name = FONT_NAME
        r2.font.size = Pt(10.5)
        r2.font.color.rgb = C_CHARCOAL

    # Right Card: Table 4 (Likert Scale)
    c_tbl_box = s22.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.81), Inches(1.5), Inches(5.72), Inches(4.6))
    c_tbl_box.fill.solid()
    c_tbl_box.fill.fore_color.rgb = C_WHITE
    c_tbl_box.line.color.rgb = C_CARD_BORDER

    tb_th = s22.shapes.add_textbox(Inches(7.01), Inches(1.65), Inches(5.32), Inches(0.4))
    p_th = tb_th.text_frame.paragraphs[0]
    p_th.text = "FIVE-POINT LIKERT SCALE (TABLE 4)"
    p_th.font.name = FONT_NAME
    p_th.font.size = Pt(13)
    p_th.font.bold = True
    p_th.font.color.rgb = C_TEAL

    tbl_s22_shape = s22.shapes.add_table(6, 3, Inches(7.01), Inches(2.15), Inches(5.32), Inches(3.7))
    tbl_s22 = tbl_s22_shape.table
    tbl_s22.columns[0].width = Inches(1.3)
    tbl_s22.columns[1].width = Inches(1.8)
    tbl_s22.columns[2].width = Inches(2.22)

    scale_data = [
        ["Scale / Rating", "Mean Range", "Descriptive Interpretation"],
        ["5", "4.21 – 5.00", "Excellent"],
        ["4", "3.41 – 4.20", "Very Good"],
        ["3", "2.61 – 3.40", "Good"],
        ["2", "1.81 – 2.60", "Poor"],
        ["1", "1.00 – 1.80", "Very Poor"]
    ]
    for r_idx, row in enumerate(scale_data):
        for c_idx, val in enumerate(row):
            cell = tbl_s22.cell(r_idx, c_idx)
            cell.text = val
            p = cell.text_frame.paragraphs[0]
            p.font.name = FONT_NAME
            if r_idx == 0:
                cell.fill.solid()
                cell.fill.fore_color.rgb = C_NAVY
                p.font.bold = True
                p.font.size = Pt(11)
                p.font.color.rgb = C_WHITE
                p.alignment = PP_ALIGN.CENTER
            else:
                cell.fill.solid()
                cell.fill.fore_color.rgb = C_LIGHT_BG if r_idx == 1 else (C_WHITE if r_idx % 2 == 1 else C_GRAY_ROW)
                p.font.size = Pt(12)
                p.alignment = PP_ALIGN.CENTER
                if r_idx == 1:
                    p.font.bold = True
                    p.font.color.rgb = C_TEAL
                else:
                    p.font.color.rgb = C_CHARCOAL

    # =========================================================================
    # SLIDE 23: CONCLUSION & DEFENSE READINESS
    # =========================================================================
    s23 = prs.slides.add_slide(blank_layout)
    add_base_decorations(
        s23,
        "PHARMATRACK  •  CHAPTERS I–III SUMMARY",
        "Conclusion & Readiness for Defense",
        23,
        "Summarize project readiness and open the floor to the distinguished panel of examiners for questions and recommendations."
    )
    add_card(
        s23, Inches(0.8), Inches(1.5), Inches(11.733), Inches(1.4),
        "Methodological Rigor & Alignment",
        "PharmaTrack directly addresses the real operational challenges of Xyra Andrea Pharmacy. Every specific objective is systematically fulfilled through dedicated system modules, verified by clear UML behavioral models, and grounded in published pharmaceutical retail literature.",
        font_size=14
    )
    add_card(
        s23, Inches(0.8), Inches(3.05), Inches(11.733), Inches(1.4),
        "Operational Practicality",
        "By integrating Point of Sale cashiering natively inside the system, enforcing atomic inventory deduction, and applying a seasonal demand forecasting formula based on previous sales, the system delivers an accessible, dependable, on-premise drugstore solution.",
        font_size=14
    )

    # Thank you / Q&A Box
    c_ty = s23.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(4.6), Inches(11.733), Inches(1.45))
    c_ty.fill.solid()
    c_ty.fill.fore_color.rgb = C_NAVY
    c_ty.line.fill.background()

    tb_ty = s23.shapes.add_textbox(Inches(1.0), Inches(4.75), Inches(11.333), Inches(1.15))
    tf_ty = tb_ty.text_frame
    tf_ty.word_wrap = True
    p_th1 = tf_ty.paragraphs[0]
    p_th1.text = "THANK YOU VERY MUCH!"
    p_th1.font.name = FONT_NAME
    p_th1.font.size = Pt(22)
    p_th1.font.bold = True
    p_th1.font.color.rgb = C_TEAL
    p_th1.alignment = PP_ALIGN.CENTER

    p_th2 = tf_ty.add_paragraph()
    p_th2.text = "We are now ready for the questions, comments, and recommendations of the distinguished panel."
    p_th2.font.name = FONT_NAME
    p_th2.font.size = Pt(14)
    p_th2.font.color.rgb = C_WHITE
    p_th2.alignment = PP_ALIGN.CENTER
    p_th2.space_before = Pt(4)

    # Save presentation
    output_filename = "PharmaTrack_Pre_Oral_Defense_Presentation.pptx"
    output_path = os.path.join(base_dir, output_filename)
    prs.save(output_path)
    print(f"Presentation successfully generated and saved to: {output_path}")

if __name__ == "__main__":
    create_presentation()
