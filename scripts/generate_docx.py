import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def create_document():
    doc = docx.Document()

    # Page Margins
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Styling Palette
    COLOR_PRIMARY = RGBColor(88, 28, 135)    # Purple 900
    COLOR_ACCENT = RGBColor(124, 0, 217)     # Brand Purple
    COLOR_TEXT = RGBColor(31, 41, 55)        # Charcoal 800
    COLOR_MUTED = RGBColor(107, 114, 128)    # Gray 500
    HEX_PURPLE = "581C87"
    HEX_LIGHT_PURPLE = "F5F3FF"
    HEX_ALT_ROW = "FAF5FF"

    # Set Default Normal Style
    style = doc.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(10.5)
    style.font.color.rgb = COLOR_TEXT
    style.paragraph_format.line_spacing = 1.15
    style.paragraph_format.space_after = Pt(4)

    def set_cell_background(cell, hex_color):
        tcPr = cell._element.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
        tcPr.append(shd)

    def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
        tcPr = cell._element.get_or_add_tcPr()
        tcMar = parse_xml(
            f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>'
        )
        tcPr.append(tcMar)

    def add_heading_1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(13.5)
        run.font.bold = True
        run.font.color.rgb = COLOR_PRIMARY
        return p

    def add_callout(text_list, title=None):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        set_cell_background(cell, HEX_LIGHT_PURPLE)
        set_cell_margins(cell, top=140, bottom=140, left=180, right=180)

        tcPr = cell._element.get_or_add_tcPr()
        borders = parse_xml(
            f'<w:tcBorders {nsdecls("w")}><w:top w:val="none"/><w:left w:val="single" w:sz="24" w:space="0" w:color="7C00D9"/><w:bottom w:val="none"/><w:right w:val="none"/></w:tcBorders>'
        )
        tcPr.append(borders)

        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(2)
        if title:
            run_title = p.add_run(title + "\n")
            run_title.font.bold = True
            run_title.font.size = Pt(11)
            run_title.font.color.rgb = COLOR_PRIMARY

        for idx, item in enumerate(text_list):
            if idx > 0 or title:
                p = cell.add_paragraph()
                p.paragraph_format.space_after = Pt(2)
            run = p.add_run(item)
            run.font.size = Pt(10)
            run.font.color.rgb = COLOR_TEXT

    # --- Document Header ---
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(2)
    run_title = title_p.add_run("ORGANLINK: RESEARCH PROTOTYPE & TECHNICAL REPORT")
    run_title.font.name = "Calibri"
    run_title.font.size = Pt(18)
    run_title.font.bold = True
    run_title.font.color.rgb = COLOR_PRIMARY

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_after = Pt(10)
    run_sub = sub_p.add_run(
        "A Secure, Transparent & Auditable Organ Allocation Architecture Inspired by Blockchain Healthcare Research\n"
    )
    run_sub.font.size = Pt(11)
    run_sub.font.italic = True
    run_sub.font.color.rgb = COLOR_MUTED

    run_meta = sub_p.add_run(
        "Author: Debashish Bordoloi  |  LinkedIn: https://www.linkedin.com/in/debashishbordoloi/  |  Date: September 2026"
    )
    run_meta.font.size = Pt(9.5)
    run_meta.font.bold = True
    run_meta.font.color.rgb = COLOR_ACCENT

    # Divider line
    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_after = Pt(8)
    run_div = p_div.add_run("―" * 70)
    run_div.font.color.rgb = RGBColor(229, 231, 235)

    # --- Section 1: Presentation Letter ---
    add_heading_1("1. Project Presentation Letter (For Faculty Advisor / Mentor)")
    letter_text = [
        "Good morning Sir,",
        "",
        'I wanted to share a research project I have been developing, OrganLink, inspired by your research paper: "An Implementation Perspective of Blockchain Technology in Leveraging Organ Donation in a Transparent Mode to both Patients and Donors."',
        "",
        "The paper particularly resonated with me because of its emphasis on transparency, traceability, algorithmic fairness, and building trust in the organ transplantation lifecycle.",
        "",
        "Architectural Approach:",
        "While the original research explored a private Ethereum/smart-contract network, I investigated an alternative production-grade web architecture that delivers the same guarantees—uncompromising transparency and tamper-evident auditability—without the latency, gas overhead, and HIPAA/GDPR data-privacy conflicts associated with public or consortium blockchains.",
        "",
        "The system is implemented using Next.js 14 App Router, TypeScript, PostgreSQL/Supabase with Row-Level Security (RLS), a deterministic matching engine, and an immutable SHA-256 sequential hash chain.",
        "",
        "• Live Demo URL: https://organ-link-seven.vercel.app/login",
        "• GitHub Repository: https://github.com/d4shhx0r/OrganLink",
    ]
    add_callout(letter_text, "Formal Presentation Letter")

    # --- Section 2: Credentials Table ---
    add_heading_1("2. Production Deployment & Live Access Credentials")
    p_cred = doc.add_paragraph(
        "The platform is live and verified. Four role-segregated accounts are pre-configured to demonstrate dynamic access control:"
    )

    cred_table = doc.add_table(rows=5, cols=4)
    cred_table.alignment = WD_TABLE_ALIGNMENT.CENTER

    headers = ["Role", "Email Address", "Password", "Key Capabilities & Views"]
    col_widths = [Inches(1.2), Inches(2.0), Inches(1.2), Inches(2.6)]

    hdr_cells = cred_table.rows[0].cells
    for idx, title in enumerate(headers):
        hdr_cells[idx].text = title
        set_cell_background(hdr_cells[idx], HEX_PURPLE)
        set_cell_margins(hdr_cells[idx], top=100, bottom=100, left=100, right=100)
        for p in hdr_cells[idx].paragraphs:
            for r in p.runs:
                r.font.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)
                r.font.size = Pt(9.5)

    cred_data = [
        (
            "Hospital / Clinician\n(Primary Demo)",
            "doctor@organlink.org",
            "Password@123",
            "Clinical Center: Donor approval, organ registration, matching engine execution, clinician review recording.",
        ),
        (
            "System Administrator",
            "admin@organlink.org",
            "Password@123",
            "Administration: System-wide clinical center oversight, hospital verification, full audit inspection.",
        ),
        (
            "Donor Portal",
            "donor@organlink.org",
            "Password@123",
            "Donor View: Track personal organ donation pledge status. Restricted from clinical matching.",
        ),
        (
            "Recipient Portal",
            "recipient@organlink.org",
            "Password@123",
            "Recipient View: Transparent waitlist position and medical status. Restricted from other patients' data.",
        ),
    ]

    for row_idx, data in enumerate(cred_data, start=1):
        row_cells = cred_table.rows[row_idx].cells
        bg = HEX_ALT_ROW if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(data):
            row_cells[col_idx].text = text
            set_cell_background(row_cells[col_idx], bg)
            set_cell_margins(row_cells[col_idx], top=80, bottom=80, left=100, right=100)
            for p in row_cells[col_idx].paragraphs:
                for r in p.runs:
                    r.font.size = Pt(9)
                    r.font.color.rgb = COLOR_TEXT

    for row in cred_table.rows:
        for idx, width in enumerate(col_widths):
            row.cells[idx].width = width

    # --- Section 3: Research Context Comparison ---
    add_heading_1("3. Research Context: Blockchain vs. Cryptographic Web Architecture")
    doc.add_paragraph(
        "The foundational paper explores using Ethereum smart contracts to prevent corruption and opacity in organ transplantation. OrganLink explores whether modern secure web engineering can achieve identical mathematical guarantees while resolving the inherent limitations of blockchain in healthcare:"
    )

    comp_table = doc.add_table(rows=5, cols=3)
    comp_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    comp_headers = [
        "Evaluation Metric",
        "Original Paper (Blockchain / Smart Contracts)",
        "OrganLink (Next.js + RLS + SHA-256 Chain)",
    ]
    comp_widths = [Inches(1.8), Inches(2.6), Inches(2.6)]

    for idx, title in enumerate(comp_headers):
        comp_table.rows[0].cells[idx].text = title
        set_cell_background(comp_table.rows[0].cells[idx], HEX_PURPLE)
        set_cell_margins(comp_table.rows[0].cells[idx], top=100, bottom=100, left=100, right=100)
        for p in comp_table.rows[0].cells[idx].paragraphs:
            for r in p.runs:
                r.font.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)
                r.font.size = Pt(9.5)

    comp_data = [
        (
            "Patient Privacy & Compliance",
            'Public/consortium ledgers risk violating HIPAA and GDPR "Right to be Forgotten" since on-chain data cannot be deleted.',
            "Row-Level Security (RLS) ensures Protected Health Information (PHI) is isolated. Only non-PII hashes are stored in the public ledger.",
        ),
        (
            "Auditability & Tamper-Evidence",
            "Immutable transaction ledger verified across distributed nodes.",
            "Sequential SHA-256 hash chaining where each event links to the preceding block hash, providing identical mathematical tamper-evidence.",
        ),
        (
            "Execution Latency & Throughput",
            "Block confirmation times (12s to minutes) and gas cost fluctuations during clinical emergencies.",
            "Sub-100ms deterministic execution via PostgreSQL and Next.js server actions with zero transaction fees.",
        ),
        (
            "Governance & Clinical Decision",
            "Risk of smart contract rigidity or automated forced allocation without human nuance.",
            "Human-in-the-Loop decision support: Algorithm calculates transparent rankings, but clinicians must provide written justification.",
        ),
    ]

    for row_idx, data in enumerate(comp_data, start=1):
        row_cells = comp_table.rows[row_idx].cells
        bg = HEX_ALT_ROW if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(data):
            row_cells[col_idx].text = text
            set_cell_background(row_cells[col_idx], bg)
            set_cell_margins(row_cells[col_idx], top=80, bottom=80, left=100, right=100)
            for p in row_cells[col_idx].paragraphs:
                for r in p.runs:
                    r.font.size = Pt(9)
                    r.font.color.rgb = COLOR_TEXT

    for row in comp_table.rows:
        for idx, width in enumerate(comp_widths):
            row.cells[idx].width = width

    # --- Section 4: Clinical Core & HLA Tissue Typing ---
    add_heading_1("4. Clinical Core: HLA Alleles & Tissue Typing Explained")
    doc.add_paragraph(
        "In organ transplantation, matching blood group (ABO) is only the first screening step. The decisive biological compatibility factor is Human Leukocyte Antigen (HLA) tissue typing:"
    )

    hla_points = [
        '• What is HLA? HLA markers are protein "barcodes" located on the surface of human white blood cells. The immune system uses them to distinguish native body cells from foreign invaders.',
        "• Why it matters: If a donor organ's HLA markers differ significantly from the recipient's, the recipient's immune system recognizes the organ as foreign and initiates acute organ rejection.",
        "• Major Alleles Checked: The algorithm compares alleles across 5 genetic loci: HLA-A, HLA-B, HLA-C, HLA-DRB1, and HLA-DQB1 (e.g., HLA-A*02, HLA-B*07, HLA-DRB1*04).",
        "• Scoring Methodology: Exact concordance on recorded loci receives a 1.0 (100%) score. Partial matches are scored proportionally (0.30 - 0.85). Total mismatches receive 0.05.",
    ]
    add_callout(hla_points, "Biological Principles of HLA Matching")

    # --- Section 5: The Transparent Matching Engine ---
    add_heading_1("5. The Transparent Deterministic Matching Engine")
    doc.add_paragraph(
        "The matching engine at /app/matching evaluates five objective clinical parameters without black-box AI bias:"
    )

    algo_steps = [
        "1. Hard ABO Blood Group Gate: Enforces biological compatibility rules (O can donate to A, B, AB, O; AB can only donate to AB). Incompatible candidates are strictly disqualified.",
        "2. HLA Concordance Score (Weight: 35%): Measures genetic tissue compatibility to prevent organ rejection.",
        "3. Medical Urgency Status (Weight: 30%): Prioritizes Status 1 (Critical) and Status 2 (Urgent) candidates based on clinical severity.",
        "4. Waiting Time Factor (Weight: 20%): Proportional scoring based on verified days spent on the national waitlist.",
        "5. Geographic Proximity & Transport Time (Weight: 15%): Minimizes cold ischemic time (preservation limit before organ deteriorates).",
    ]
    for step in algo_steps:
        p_step = doc.add_paragraph(step)
        p_step.paragraph_format.left_indent = Inches(0.2)
        p_step.paragraph_format.space_after = Pt(3)

    # --- Section 6: Cryptographic SHA-256 Hash Chain ---
    add_heading_1("6. Cryptographic Tamper-Evidence (SHA-256 Audit Trail)")
    doc.add_paragraph(
        "To guarantee integrity without blockchain gas costs, OrganLink implements a Merkle-inspired sequential hash chain. Every system event writes a block containing:"
    )
    audit_points = [
        "• Current Block Hash = SHA-256(Previous Block Hash + Action Type + Actor ID + Entity ID + Payload JSON + Timestamp)",
        "• Genesis Block: Initialized with a known cryptographic seed (64 zeroes).",
        "• Tamper Detection: If a database administrator directly modifies any past record in PostgreSQL, all subsequent block hashes in the chain break immediately. The auditor tool at /app/audit scans every link in real-time and alerts on any discrepancy.",
    ]
    add_callout(audit_points, "Mathematical Integrity Model")

    # --- Section 7: Suggested 3-Minute Live Demo ---
    add_heading_1("7. Recommended 3-Minute Demonstration Script")
    demo_steps = [
        "Step 1: Sign in as Hospital (doctor@organlink.org / Password@123) to show clinical coordinator navigation.",
        "Step 2: Navigate to Donors (/app/donors). Explain the two-step verification workflow preventing fraudulent listings.",
        "Step 3: Open Organ Matching (/app/matching). Select an available organ and click 'Run Transparent Match'. Point out the transparent factor-by-factor breakdown and the human-in-the-loop clinical review notes.",
        "Step 4: Navigate to Audit Log (/app/audit). Show the continuous SHA-256 block chain and explain how mathematical hashing delivers tamper-evidence.",
    ]
    for ds in demo_steps:
        p_ds = doc.add_paragraph(ds)
        p_ds.paragraph_format.left_indent = Inches(0.2)
        p_ds.paragraph_format.space_after = Pt(4)

    # --- Section 8: Defense & Academic Q&A Preparation ---
    add_heading_1("8. Faculty Q&A / Defense Preparation")
    qa_items = [
        (
            'Q: "The research paper used Ethereum. Why did you not use blockchain?"',
            'A: "Storing Protected Health Information (PHI) directly on a blockchain violates HIPAA and GDPR \'Right to be Forgotten\' laws. Furthermore, blockchain transactions introduce high latency and gas costs. By using a SHA-256 sequential hash chain inside PostgreSQL with RLS, we achieve identical mathematical tamper-evidence without any privacy, cost, or speed drawbacks."',
        ),
        (
            'Q: "Does the matching algorithm replace human doctors?"',
            'A: "No. OrganLink is strictly a Clinical Decision Support System (CDSS). The engine calculates deterministic ranks, but licensed clinicians must review the candidate breakdown and input written justification before confirming allocation."',
        ),
        (
            'Q: "What technology stack was used?"',
            'A: "Next.js 14 App Router and TypeScript for full-stack frontend and server actions, Supabase and PostgreSQL with Row-Level Security for database storage, and Node\'s crypto library for SHA-256 hash generation."',
        ),
    ]

    for q, a in qa_items:
        p_q = doc.add_paragraph()
        p_q.paragraph_format.space_before = Pt(6)
        p_q.paragraph_format.space_after = Pt(1)
        r_q = p_q.add_run(q)
        r_q.font.bold = True
        r_q.font.color.rgb = COLOR_PRIMARY

        p_a = doc.add_paragraph()
        p_a.paragraph_format.space_after = Pt(4)
        p_a.paragraph_format.left_indent = Inches(0.2)
        r_a = p_a.add_run(a)
        r_a.font.italic = True
        r_a.font.color.rgb = COLOR_TEXT

    desktop_path = os.path.join(
        os.path.expanduser("~"), "Desktop", "OrganLink_Project_Overview_Debashish.docx"
    )
    doc.save(desktop_path)
    print(f"Successfully generated document at: {desktop_path}")

if __name__ == "__main__":
    create_document()
