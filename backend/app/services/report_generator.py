from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, black, white
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.units import inch, cm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from datetime import datetime
import io

TERRA  = HexColor('#C0533A')
NAVY   = HexColor('#1C2B3A')
SAGE   = HexColor('#5A8A6A')
SAND   = HexColor('#F5F0E8')
LGRAY  = HexColor('#CCCCCC')
WHITE  = HexColor('#FFFFFF')
OFFWHT = HexColor('#F8F7F4')

def get_styles():
    styles = getSampleStyleSheet()
    custom = {
        'Title': ParagraphStyle('Title',
            fontName='Helvetica-Bold', fontSize=24,
            textColor=TERRA, spaceAfter=6, alignment=TA_LEFT),
        'Subtitle': ParagraphStyle('Subtitle',
            fontName='Helvetica', fontSize=12,
            textColor=NAVY, spaceAfter=4),
        'H1': ParagraphStyle('H1',
            fontName='Helvetica-Bold', fontSize=14,
            textColor=NAVY, spaceBefore=16, spaceAfter=6),
        'H2': ParagraphStyle('H2',
            fontName='Helvetica-Bold', fontSize=12,
            textColor=TERRA, spaceBefore=12, spaceAfter=4),
        'Body': ParagraphStyle('Body',
            fontName='Helvetica', fontSize=10,
            textColor=NAVY, spaceAfter=6, leading=16),
        'BodyBold': ParagraphStyle('BodyBold',
            fontName='Helvetica-Bold', fontSize=10,
            textColor=NAVY, spaceAfter=4),
        'Small': ParagraphStyle('Small',
            fontName='Helvetica', fontSize=8,
            textColor=HexColor('#888888'), spaceAfter=4),
        'Callout': ParagraphStyle('Callout',
            fontName='Helvetica-Bold', fontSize=11,
            textColor=WHITE, spaceAfter=0, leading=16),
    }
    return custom

class ReportGenerator:

    def generate(
        self,
        template: str,
        study_info: dict,
        analysis_result: dict,
        rigor_score: dict
    ) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )
        styles = get_styles()

        if template == 'ngo':
            story = self._ngo_report(
                styles, study_info, analysis_result, rigor_score
            )
        elif template == 'student':
            story = self._student_report(
                styles, study_info, analysis_result, rigor_score
            )
        else:
            story = self._journal_report(
                styles, study_info, analysis_result, rigor_score
            )

        doc.build(story)
        return buffer.getvalue()

    def _header_block(self, styles, title, subtitle, color):
        elements = []
        elements.append(Table(
            [[Paragraph(title, styles['Title']),
              Paragraph(subtitle, styles['Subtitle'])]],
            colWidths=[12*cm, 5*cm],
            style=TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), color),
                ('PADDING', (0,0), (-1,-1), 16),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ])
        ))
        elements.append(Spacer(1, 0.3*cm))
        return elements

    def _rigor_table(self, styles, rigor_score):
        score = rigor_score.get('overall_score', 0)
        grade = rigor_score.get('grade', 'N/A')
        breakdown = rigor_score.get('breakdown', {})

        rows = [['Category', 'Score', 'Max', 'Status']]
        for key, val in breakdown.items():
            label = key.replace('_', ' ').title()
            s = val.get('score', 0)
            m = val.get('max', 25)
            pct = (s/m*100) if m > 0 else 0
            status = 'Good' if pct >= 70 else 'Fair' if pct >= 50 else 'Needs Work'
            rows.append([label, str(s), str(m), status])

        rows.append(['OVERALL RIGOR SCORE', str(score), '100', grade])

        table = Table(rows, colWidths=[7*cm, 2.5*cm, 2*cm, 3.5*cm])
        style = TableStyle([
            ('BACKGROUND', (0,0), (-1,0), NAVY),
            ('TEXTCOLOR', (0,0), (-1,0), WHITE),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('BACKGROUND', (0,-1), (-1,-1), TERRA),
            ('TEXTCOLOR', (0,-1), (-1,-1), WHITE),
            ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
            ('ROWBACKGROUNDS', (0,1), (-1,-2), [OFFWHT, WHITE]),
            ('GRID', (0,0), (-1,-1), 0.5, LGRAY),
            ('PADDING', (0,0), (-1,-1), 6),
            ('ALIGN', (1,0), (-1,-1), 'CENTER'),
        ])
        table.setStyle(style)
        return table

    def _findings_table(self, styles, odds_ratios):
        if not odds_ratios:
            return Paragraph('No odds ratios available.', styles['Body'])
        rows = [['Variable', 'Odds Ratio', '95% CI', 'P-value', 'Significant']]
        for var, vals in list(odds_ratios.items())[:10]:
            rows.append([
                var,
                str(vals.get('OR', 'N/A')),
                f"{vals.get('CI_low','?')} – {vals.get('CI_high','?')}",
                str(vals.get('p_value', 'N/A')),
                'Yes' if vals.get('significant') else 'No'
            ])
        table = Table(rows, colWidths=[5*cm, 2.5*cm, 3*cm, 2*cm, 2.5*cm])
        style = TableStyle([
            ('BACKGROUND', (0,0), (-1,0), NAVY),
            ('TEXTCOLOR', (0,0), (-1,0), WHITE),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [OFFWHT, WHITE]),
            ('GRID', (0,0), (-1,-1), 0.5, LGRAY),
            ('PADDING', (0,0), (-1,-1), 5),
            ('ALIGN', (1,0), (-1,-1), 'CENTER'),
        ])
        table.setStyle(style)
        return table

    def _ngo_report(self, styles, info, result, rigor):
        s = []
        title = info.get('title', 'Programme Evaluation Report')
        org   = info.get('organisation', 'Organisation')
        donor = info.get('donor', 'Donor')
        date  = datetime.now().strftime('%B %Y')

        # Cover
        s += self._header_block(
            styles,
            title,
            f"{org}  |  Prepared for: {donor}  |  {date}",
            SAGE
        )

        # Executive Summary
        s.append(Paragraph('Executive Summary', styles['H1']))
        s.append(HRFlowable(width='100%', color=SAGE, thickness=1))
        s.append(Spacer(1, 0.2*cm))

        interp = result.get('interpretation', 'Analysis completed successfully.')
        n      = result.get('n', 0)
        model  = result.get('model', 'Statistical analysis')
        score  = rigor.get('overall_score', 0)
        grade  = rigor.get('grade', '')

        s.append(Paragraph(
            f"This evaluation analysed data from <b>{n} programme participants</b> "
            f"using {model}. {interp}",
            styles['Body']
        ))
        s.append(Paragraph(
            f"The analysis received a ResearchFlow Rigor Score of "
            f"<b>{score}/100 ({grade})</b>, indicating the methodological "
            f"quality of this evaluation.",
            styles['Body']
        ))
        s.append(Spacer(1, 0.3*cm))

        # Key Findings Box
        s.append(Table(
            [[Paragraph('Key Findings', styles['Callout'])],
             [Paragraph(interp, ParagraphStyle('FindBody',
                fontName='Helvetica', fontSize=10,
                textColor=NAVY, leading=16))]],
            colWidths=[15*cm],
            style=TableStyle([
                ('BACKGROUND', (0,0), (0,0), SAGE),
                ('BACKGROUND', (0,1), (0,1), HexColor('#EBF3EE')),
                ('PADDING', (0,0), (-1,-1), 12),
                ('BOX', (0,0), (-1,-1), 1, SAGE),
            ])
        ))
        s.append(Spacer(1, 0.4*cm))

        # Methodology
        s.append(Paragraph('Methodology', styles['H1']))
        s.append(HRFlowable(width='100%', color=SAGE, thickness=1))
        s.append(Spacer(1, 0.2*cm))
        s.append(Paragraph(
            f"<b>Study Design:</b> {info.get('study_type','Retrospective cohort').replace('_',' ').title()}",
            styles['Body']
        ))
        s.append(Paragraph(
            f"<b>Analytical Method:</b> {model}",
            styles['Body']
        ))
        s.append(Paragraph(
            f"<b>Sample Size:</b> {n} participants",
            styles['Body']
        ))
        if result.get('model_fit'):
            fit = result['model_fit']
            s.append(Paragraph(
                f"<b>Model Fit:</b> AIC={fit.get('aic','N/A')}, "
                f"Pseudo R²={fit.get('pseudo_r2','N/A')}",
                styles['Body']
            ))
        s.append(Spacer(1, 0.4*cm))

        # Statistical Results
        s.append(Paragraph('Statistical Results', styles['H1']))
        s.append(HRFlowable(width='100%', color=SAGE, thickness=1))
        s.append(Spacer(1, 0.2*cm))
        if result.get('odds_ratios'):
            s.append(Paragraph(
                'The table below shows odds ratios for each predictor variable.',
                styles['Body']
            ))
            s.append(Spacer(1, 0.2*cm))
            s.append(self._findings_table(styles, result['odds_ratios']))
        s.append(Spacer(1, 0.4*cm))

        # Rigor Score
        s.append(Paragraph('Methodological Quality Assessment', styles['H1']))
        s.append(HRFlowable(width='100%', color=SAGE, thickness=1))
        s.append(Spacer(1, 0.2*cm))
        s.append(self._rigor_table(styles, rigor))
        s.append(Spacer(1, 0.4*cm))

        # Recommendations
        s.append(Paragraph('Recommendations', styles['H1']))
        s.append(HRFlowable(width='100%', color=SAGE, thickness=1))
        s.append(Spacer(1, 0.2*cm))
        for rec in rigor.get('recommendations', []):
            s.append(Paragraph(f"• {rec}", styles['Body']))
        s.append(Spacer(1, 0.4*cm))

        # Footer
        s.append(HRFlowable(width='100%', color=LGRAY, thickness=0.5))
        s.append(Spacer(1, 0.2*cm))
        s.append(Paragraph(
            f"Generated by ResearchFlow v0.1.0  |  {date}  |  "
            f"Rigor Score: {score}/100  |  For discussion purposes only",
            styles['Small']
        ))
        return s

    def _student_report(self, styles, info, result, rigor):
        s = []
        title  = info.get('title', 'Research Analysis Report')
        date   = datetime.now().strftime('%B %Y')
        n      = result.get('n', 0)
        model  = result.get('model', 'Statistical analysis')
        interp = result.get('interpretation', '')
        score  = rigor.get('overall_score', 0)
        grade  = rigor.get('grade', '')

        s += self._header_block(
            styles, title,
            f"Student Analysis Report  |  {date}",
            TERRA
        )

        s.append(Paragraph('Results', styles['H1']))
        s.append(HRFlowable(width='100%', color=TERRA, thickness=1))
        s.append(Spacer(1, 0.2*cm))
        s.append(Paragraph(
            f"This analysis was conducted on a dataset of "
            f"<b>{n} participants</b> using <b>{model}</b>.",
            styles['Body']
        ))
        s.append(Paragraph(interp, styles['Body']))
        s.append(Spacer(1, 0.3*cm))

        if result.get('odds_ratios'):
            s.append(Paragraph('Statistical Findings Table', styles['H2']))
            s.append(Paragraph(
                'The following table presents the odds ratios, '
                'confidence intervals, and p-values for each '
                'predictor variable included in the analysis.',
                styles['Body']
            ))
            s.append(Spacer(1, 0.2*cm))
            s.append(self._findings_table(styles, result['odds_ratios']))
            s.append(Spacer(1, 0.3*cm))

        s.append(Paragraph('Methodology Quality', styles['H1']))
        s.append(HRFlowable(width='100%', color=TERRA, thickness=1))
        s.append(Spacer(1, 0.2*cm))
        s.append(Paragraph(
            f"ResearchFlow assessed the methodological quality of "
            f"this analysis and assigned a Rigor Score of "
            f"<b>{score}/100 ({grade})</b>.",
            styles['Body']
        ))
        s.append(Spacer(1, 0.2*cm))
        s.append(self._rigor_table(styles, rigor))
        s.append(Spacer(1, 0.3*cm))

        s.append(Paragraph('What This Means For Your Dissertation', styles['H2']))
        for rec in rigor.get('recommendations', []):
            s.append(Paragraph(f"• {rec}", styles['Body']))
        s.append(Spacer(1, 0.4*cm))

        s.append(HRFlowable(width='100%', color=LGRAY, thickness=0.5))
        s.append(Spacer(1, 0.2*cm))
        s.append(Paragraph(
            f"Generated by ResearchFlow v0.1.0  |  {date}  |  "
            f"Rigor Score: {score}/100",
            styles['Small']
        ))
        return s

    def _journal_report(self, styles, info, result, rigor):
        s = []
        title  = info.get('title', 'Statistical Verification Report')
        date   = datetime.now().strftime('%B %Y')
        n      = result.get('n', 0)
        model  = result.get('model', 'Statistical analysis')
        score  = rigor.get('overall_score', 0)
        grade  = rigor.get('grade', '')

        s += self._header_block(
            styles, title,
            f"Journal Verification Report  |  {date}",
            NAVY
        )

        s.append(Paragraph('Verification Summary', styles['H1']))
        s.append(HRFlowable(width='100%', color=NAVY, thickness=1))
        s.append(Spacer(1, 0.2*cm))

        overall_status = (
            'PASSED' if score >= 75 else
            'FLAGGED' if score >= 50 else
            'FAILED'
        )
        s.append(Table(
            [[
                Paragraph('Overall Status', styles['BodyBold']),
                Paragraph(overall_status, styles['Callout']),
            ]],
            colWidths=[8*cm, 7*cm],
            style=TableStyle([
                ('BACKGROUND', (0,0), (0,0), OFFWHT),
                ('BACKGROUND', (1,0), (1,0),
                    SAGE if overall_status == 'PASSED' else
                    HexColor('#E65100') if overall_status == 'FLAGGED' else
                    HexColor('#C62828')
                ),
                ('PADDING', (0,0), (-1,-1), 12),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ])
        ))
        s.append(Spacer(1, 0.4*cm))

        s.append(Paragraph('Statistical Integrity Assessment', styles['H1']))
        s.append(HRFlowable(width='100%', color=NAVY, thickness=1))
        s.append(Spacer(1, 0.2*cm))
        s.append(Paragraph(
            f"Analysis conducted on {n} observations using {model}. "
            f"All statistical assumptions were checked automatically "
            f"by the ResearchFlow analytics engine.",
            styles['Body']
        ))
        s.append(Spacer(1, 0.2*cm))
        s.append(self._rigor_table(styles, rigor))
        s.append(Spacer(1, 0.3*cm))

        if result.get('assumptions'):
            s.append(Paragraph('Assumption Verification', styles['H1']))
            s.append(HRFlowable(width='100%', color=NAVY, thickness=1))
            s.append(Spacer(1, 0.2*cm))
            for name, check in result['assumptions'].items():
                status_text = (
                    'PASSED' if check.get('passed') else
                    'FAILED' if check.get('passed') is False else
                    'NOT CHECKED'
                )
                s.append(Paragraph(
                    f"<b>{name.replace('_',' ').title()}:</b> "
                    f"{status_text} — {check.get('detail','')}",
                    styles['Body']
                ))
            s.append(Spacer(1, 0.3*cm))

        if result.get('odds_ratios'):
            s.append(Paragraph('Statistical Results', styles['H1']))
            s.append(HRFlowable(width='100%', color=NAVY, thickness=1))
            s.append(Spacer(1, 0.2*cm))
            s.append(self._findings_table(styles, result['odds_ratios']))
            s.append(Spacer(1, 0.3*cm))

        s.append(Paragraph('Editorial Recommendations', styles['H1']))
        s.append(HRFlowable(width='100%', color=NAVY, thickness=1))
        s.append(Spacer(1, 0.2*cm))
        for rec in rigor.get('recommendations', []):
            s.append(Paragraph(f"• {rec}", styles['Body']))
        s.append(Spacer(1, 0.4*cm))

        s.append(HRFlowable(width='100%', color=LGRAY, thickness=0.5))
        s.append(Spacer(1, 0.2*cm))
        s.append(Paragraph(
            f"ResearchFlow Verification ID: RF-{date.replace(' ','-').upper()}  |  "
            f"v0.1.0  |  {date}  |  Score: {score}/100 ({grade})",
            styles['Small']
        ))
        return s
