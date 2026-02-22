from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from datetime import datetime
import io

TERRA  = HexColor('#C0533A')
NAVY   = HexColor('#1C2B3A')
SAGE   = HexColor('#5A8A6A')
OFFWHT = HexColor('#F8F7F4')
LGRAY  = HexColor('#CCCCCC')
WHITE  = HexColor('#FFFFFF')

def styles():
    return {
        'Title': ParagraphStyle('Title',
            fontName='Helvetica-Bold', fontSize=22,
            textColor=WHITE, spaceAfter=4),
        'Subtitle': ParagraphStyle('Subtitle',
            fontName='Helvetica', fontSize=11,
            textColor=WHITE, spaceAfter=4),
        'H1': ParagraphStyle('H1',
            fontName='Helvetica-Bold', fontSize=13,
            textColor=NAVY, spaceBefore=14, spaceAfter=6),
        'H2': ParagraphStyle('H2',
            fontName='Helvetica-Bold', fontSize=11,
            textColor=TERRA, spaceBefore=10, spaceAfter=4),
        'Body': ParagraphStyle('Body',
            fontName='Helvetica', fontSize=10,
            textColor=NAVY, spaceAfter=6, leading=16),
        'Bold': ParagraphStyle('Bold',
            fontName='Helvetica-Bold', fontSize=10,
            textColor=NAVY, spaceAfter=4),
        'Small': ParagraphStyle('Small',
            fontName='Helvetica', fontSize=8,
            textColor=HexColor('#888888'), spaceAfter=4),
        'Callout': ParagraphStyle('Callout',
            fontName='Helvetica-Bold', fontSize=11,
            textColor=WHITE, leading=16),
    }

def header_block(s, title, subtitle, color):
    return [
        Table(
            [[Paragraph(title, s['Title'])],
             [Paragraph(subtitle, s['Subtitle'])]],
            colWidths=[17*cm],
            style=TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), color),
                ('PADDING', (0,0), (-1,-1), 20),
            ])
        ),
        Spacer(1, 0.4*cm)
    ]

def rigor_table(s, rigor):
    score     = rigor.get('overall_score', 0)
    grade     = rigor.get('grade', 'N/A')
    breakdown = rigor.get('breakdown', {})
    rows = [['Category', 'Score', 'Max', 'Status']]
    for key, val in breakdown.items():
        label  = key.replace('_',' ').title()
        sc     = val.get('score', 0)
        mx     = val.get('max', 25)
        pct    = (sc/mx*100) if mx > 0 else 0
        status = 'Good' if pct >= 70 else 'Fair' if pct >= 50 else 'Needs Work'
        rows.append([label, str(sc), str(mx), status])
    rows.append(['OVERALL RIGOR SCORE', str(score), '100', grade])
    t = Table(rows, colWidths=[7*cm, 2.5*cm, 2*cm, 3.5*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND',   (0,0),  (-1,0),  NAVY),
        ('TEXTCOLOR',    (0,0),  (-1,0),  WHITE),
        ('FONTNAME',     (0,0),  (-1,0),  'Helvetica-Bold'),
        ('BACKGROUND',   (0,-1), (-1,-1), TERRA),
        ('TEXTCOLOR',    (0,-1), (-1,-1), WHITE),
        ('FONTNAME',     (0,-1), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE',     (0,0),  (-1,-1), 9),
        ('ROWBACKGROUNDS',(0,1), (-1,-2), [OFFWHT, WHITE]),
        ('GRID',         (0,0),  (-1,-1), 0.5, LGRAY),
        ('PADDING',      (0,0),  (-1,-1), 6),
        ('ALIGN',        (1,0),  (-1,-1), 'CENTER'),
    ]))
    return t

def odds_table(s, odds_ratios):
    if not odds_ratios:
        return Paragraph('No odds ratios available.', s['Body'])
    rows = [['Variable', 'Odds Ratio', '95% CI', 'P-value', 'Significant']]
    for var, vals in list(odds_ratios.items())[:10]:
        rows.append([
            var,
            str(vals.get('OR', 'N/A')),
            f"{vals.get('CI_low','?')} – {vals.get('CI_high','?')}",
            str(vals.get('p_value', 'N/A')),
            'Yes' if vals.get('significant') else 'No'
        ])
    t = Table(rows, colWidths=[5*cm, 2.5*cm, 3*cm, 2*cm, 2.5*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND',    (0,0),  (-1,0),  NAVY),
        ('TEXTCOLOR',     (0,0),  (-1,0),  WHITE),
        ('FONTNAME',      (0,0),  (-1,0),  'Helvetica-Bold'),
        ('FONTSIZE',      (0,0),  (-1,-1), 8),
        ('ROWBACKGROUNDS',(0,1),  (-1,-1), [OFFWHT, WHITE]),
        ('GRID',          (0,0),  (-1,-1), 0.5, LGRAY),
        ('PADDING',       (0,0),  (-1,-1), 5),
        ('ALIGN',         (1,0),  (-1,-1), 'CENTER'),
    ]))
    return t

class ReportGenerator:

    def generate(self, template, study_info, analysis_result, rigor_score):
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, pagesize=A4,
            rightMargin=2*cm, leftMargin=2*cm,
            topMargin=2*cm,   bottomMargin=2*cm
        )
        s = styles()
        if template == 'ngo':
            story = self._ngo(s, study_info, analysis_result, rigor_score)
        elif template == 'student':
            story = self._student(s, study_info, analysis_result, rigor_score)
        else:
            story = self._journal(s, study_info, analysis_result, rigor_score)
        doc.build(story)
        return buffer.getvalue()

    def _ngo(self, s, info, result, rigor):
        el = []
        title  = info.get('title', 'Programme Evaluation Report')
        org    = info.get('organisation', 'Organisation')
        donor  = info.get('donor', 'Donor')
        date   = datetime.now().strftime('%B %Y')
        n      = result.get('n', 0)
        model  = result.get('model', 'Statistical analysis')
        interp = result.get('interpretation', 'Analysis completed.')
        score  = rigor.get('overall_score', 0)
        grade  = rigor.get('grade', '')

        el += header_block(s, title, f"{org}  |  Prepared for: {donor}  |  {date}", SAGE)

        el.append(Paragraph('Executive Summary', s['H1']))
        el.append(HRFlowable(width='100%', color=SAGE, thickness=1))
        el.append(Spacer(1, 0.2*cm))
        el.append(Paragraph(
            f"This evaluation analysed data from <b>{n} programme participants</b> "
            f"using {model}. {interp} "
            f"The analysis received a ResearchFlow Rigor Score of "
            f"<b>{score}/100 ({grade})</b>.",
            s['Body']
        ))

        el.append(Table(
            [[Paragraph('Key Finding', s['Callout'])],
             [Paragraph(interp, s['Body'])]],
            colWidths=[15*cm],
            style=TableStyle([
                ('BACKGROUND', (0,0), (0,0), SAGE),
                ('BACKGROUND', (0,1), (0,1), HexColor('#EBF3EE')),
                ('PADDING',    (0,0), (-1,-1), 12),
                ('BOX',        (0,0), (-1,-1), 1, SAGE),
            ])
        ))
        el.append(Spacer(1, 0.4*cm))

        el.append(Paragraph('Methodology', s['H1']))
        el.append(HRFlowable(width='100%', color=SAGE, thickness=1))
        el.append(Spacer(1, 0.2*cm))
        el.append(Paragraph(f"<b>Study Design:</b> {info.get('study_type','Retrospective cohort').replace('_',' ').title()}", s['Body']))
        el.append(Paragraph(f"<b>Analytical Method:</b> {model}", s['Body']))
        el.append(Paragraph(f"<b>Sample Size:</b> {n} participants", s['Body']))
        if result.get('model_fit'):
            fit = result['model_fit']
            el.append(Paragraph(
                f"<b>Model Fit:</b> AIC={fit.get('aic','N/A')}, Pseudo R²={fit.get('pseudo_r2','N/A')}",
                s['Body']
            ))
        el.append(Spacer(1, 0.4*cm))

        if result.get('odds_ratios'):
            el.append(Paragraph('Statistical Results', s['H1']))
            el.append(HRFlowable(width='100%', color=SAGE, thickness=1))
            el.append(Spacer(1, 0.2*cm))
            el.append(odds_table(s, result['odds_ratios']))
            el.append(Spacer(1, 0.4*cm))

        el.append(Paragraph('Methodological Quality', s['H1']))
        el.append(HRFlowable(width='100%', color=SAGE, thickness=1))
        el.append(Spacer(1, 0.2*cm))
        el.append(rigor_table(s, rigor))
        el.append(Spacer(1, 0.4*cm))

        el.append(Paragraph('Recommendations', s['H1']))
        el.append(HRFlowable(width='100%', color=SAGE, thickness=1))
        el.append(Spacer(1, 0.2*cm))
        for rec in rigor.get('recommendations', []):
            el.append(Paragraph(f"• {rec}", s['Body']))

        el.append(Spacer(1, 0.4*cm))
        el.append(HRFlowable(width='100%', color=LGRAY, thickness=0.5))
        el.append(Spacer(1, 0.2*cm))
        el.append(Paragraph(
            f"Generated by ResearchFlow v0.1.0  |  {date}  |  Rigor Score: {score}/100  |  Confidential",
            s['Small']
        ))
        return el

    def _student(self, s, info, result, rigor):
        el = []
        title  = info.get('title', 'Research Analysis Report')
        date   = datetime.now().strftime('%B %Y')
        n      = result.get('n', 0)
        model  = result.get('model', 'Statistical analysis')
        interp = result.get('interpretation', '')
        score  = rigor.get('overall_score', 0)
        grade  = rigor.get('grade', '')

        el += header_block(s, title, f"Student Analysis Report  |  {date}", TERRA)

        el.append(Paragraph('Results', s['H1']))
        el.append(HRFlowable(width='100%', color=TERRA, thickness=1))
        el.append(Spacer(1, 0.2*cm))
        el.append(Paragraph(
            f"This analysis was conducted on a dataset of <b>{n} participants</b> "
            f"using <b>{model}</b>. {interp}",
            s['Body']
        ))
        el.append(Spacer(1, 0.3*cm))

        if result.get('odds_ratios'):
            el.append(Paragraph('Statistical Findings', s['H2']))
            el.append(odds_table(s, result['odds_ratios']))
            el.append(Spacer(1, 0.3*cm))

        el.append(Paragraph('Methodology Quality Assessment', s['H1']))
        el.append(HRFlowable(width='100%', color=TERRA, thickness=1))
        el.append(Spacer(1, 0.2*cm))
        el.append(Paragraph(
            f"ResearchFlow assessed the methodological quality and assigned a "
            f"Rigor Score of <b>{score}/100 ({grade})</b>.",
            s['Body']
        ))
        el.append(Spacer(1, 0.2*cm))
        el.append(rigor_table(s, rigor))
        el.append(Spacer(1, 0.3*cm))

        el.append(Paragraph('What This Means For Your Dissertation', s['H2']))
        for rec in rigor.get('recommendations', []):
            el.append(Paragraph(f"• {rec}", s['Body']))

        if result.get('assumptions'):
            el.append(Spacer(1, 0.3*cm))
            el.append(Paragraph('Assumption Checks', s['H2']))
            for name, check in result['assumptions'].items():
                status = 'PASSED' if check.get('passed') else 'FAILED' if check.get('passed') is False else 'NOT CHECKED'
                el.append(Paragraph(
                    f"<b>{name.replace('_',' ').title()}:</b> {status} — {check.get('detail','')}",
                    s['Body']
                ))

        el.append(Spacer(1, 0.4*cm))
        el.append(HRFlowable(width='100%', color=LGRAY, thickness=0.5))
        el.append(Spacer(1, 0.2*cm))
        el.append(Paragraph(
            f"Generated by ResearchFlow v0.1.0  |  {date}  |  Rigor Score: {score}/100",
            s['Small']
        ))
        return el

    def _journal(self, s, info, result, rigor):
        el = []
        title  = info.get('title', 'Statistical Verification Report')
        date   = datetime.now().strftime('%B %Y')
        n      = result.get('n', 0)
        model  = result.get('model', 'Statistical analysis')
        score  = rigor.get('overall_score', 0)
        grade  = rigor.get('grade', '')
        status = 'PASSED' if score >= 75 else 'FLAGGED' if score >= 50 else 'FAILED'
        status_color = SAGE if status == 'PASSED' else HexColor('#E65100') if status == 'FLAGGED' else HexColor('#C62828')

        el += header_block(s, title, f"Journal Verification Report  |  {date}", NAVY)

        el.append(Table(
            [[Paragraph('Overall Status', s['Bold']),
              Paragraph(status, s['Callout'])]],
            colWidths=[8*cm, 7*cm],
            style=TableStyle([
                ('BACKGROUND', (0,0), (0,0), OFFWHT),
                ('BACKGROUND', (1,0), (1,0), status_color),
                ('PADDING',    (0,0), (-1,-1), 12),
                ('VALIGN',     (0,0), (-1,-1), 'MIDDLE'),
            ])
        ))
        el.append(Spacer(1, 0.4*cm))

        el.append(Paragraph('Statistical Integrity Assessment', s['H1']))
        el.append(HRFlowable(width='100%', color=NAVY, thickness=1))
        el.append(Spacer(1, 0.2*cm))
        el.append(Paragraph(
            f"Analysis conducted on {n} observations using {model}. "
            f"All statistical assumptions were checked automatically.",
            s['Body']
        ))
        el.append(Spacer(1, 0.2*cm))
        el.append(rigor_table(s, rigor))
        el.append(Spacer(1, 0.3*cm))

        if result.get('assumptions'):
            el.append(Paragraph('Assumption Verification', s['H1']))
            el.append(HRFlowable(width='100%', color=NAVY, thickness=1))
            el.append(Spacer(1, 0.2*cm))
            for name, check in result['assumptions'].items():
                passed = 'PASSED' if check.get('passed') else 'FAILED' if check.get('passed') is False else 'NOT CHECKED'
                el.append(Paragraph(
                    f"<b>{name.replace('_',' ').title()}:</b> {passed} — {check.get('detail','')}",
                    s['Body']
                ))
            el.append(Spacer(1, 0.3*cm))

        if result.get('odds_ratios'):
            el.append(Paragraph('Statistical Results', s['H1']))
            el.append(HRFlowable(width='100%', color=NAVY, thickness=1))
            el.append(Spacer(1, 0.2*cm))
            el.append(odds_table(s, result['odds_ratios']))
            el.append(Spacer(1, 0.3*cm))

        el.append(Paragraph('Editorial Recommendations', s['H1']))
        el.append(HRFlowable(width='100%', color=NAVY, thickness=1))
        el.append(Spacer(1, 0.2*cm))
        for rec in rigor.get('recommendations', []):
            el.append(Paragraph(f"• {rec}", s['Body']))

        el.append(Spacer(1, 0.4*cm))
        el.append(HRFlowable(width='100%', color=LGRAY, thickness=0.5))
        el.append(Spacer(1, 0.2*cm))
        el.append(Paragraph(
            f"ResearchFlow Verification ID: RF-{date.replace(' ','-').upper()}  |  "
            f"v0.1.0  |  {date}  |  Score: {score}/100 ({grade})",
            s['Small']
        ))
        return el
