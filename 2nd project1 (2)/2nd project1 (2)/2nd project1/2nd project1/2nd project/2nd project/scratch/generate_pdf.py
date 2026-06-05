from fpdf import FPDF

class PDF(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 15)
        self.cell(0, 10, 'Smart Revise - System Architecture & Tech Stack', 0, 1, 'C')
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

def create_pdf():
    pdf = PDF()
    pdf.add_page()
    pdf.set_font('Arial', '', 12)

    # 1. Tech Stack Section
    pdf.set_font('Arial', 'B', 14)
    pdf.cell(0, 10, '1. TECHNOLOGY STACK USED', 0, 1, 'L')
    pdf.ln(5)
    
    pdf.set_font('Arial', '', 12)
    tech_stack = [
        ("Frontend", "HTML5, CSS3, JavaScript (Vanilla)"),
        ("Backend", "Python (Flask Framework)"),
        ("Database", "SQLite (SQLAlchemy ORM)"),
        ("AI / ML", "Large Language Models (Groq / OpenAI API)"),
        ("Security", "Flask-Bcrypt (Hashing), JWT (Sessions)"),
        ("Hardware", "Raspberry Pi 4 Model B (IoT Integration)")
    ]
    
    for label, tech in tech_stack:
        pdf.set_font('Arial', 'B', 12)
        pdf.cell(40, 10, f'{label}:', 0, 0)
        pdf.set_font('Arial', '', 12)
        pdf.cell(0, 10, tech, 0, 1)

    pdf.ln(10)

    # 2. System Architecture Section
    pdf.set_font('Arial', 'B', 14)
    pdf.cell(0, 10, '2. SYSTEM ARCHITECTURE LAYERS', 0, 1, 'L')
    pdf.ln(5)

    layers = [
        ("Frontend Layer", "Handles User Interaction, Response Rendering, and input collection."),
        ("Application Layer", "Flask Backend manages business logic, routes, and API calls."),
        ("Data Layer", "Relational SQLite database for storing persistent user and study data."),
        ("Intelligence Layer", "AI Engine generates custom revision notes and chatbot replies."),
        ("Hardware Layer", "Raspberry Pi triggers physical study notifications via GPIO pins."),
        ("Security Layer", "Ensures encrypted passwords and authenticated user sessions.")
    ]

    for layer, desc in layers:
        pdf.set_font('Arial', 'B', 12)
        pdf.cell(0, 10, layer, 0, 1)
        pdf.set_font('Arial', '', 11)
        pdf.multi_cell(0, 8, desc)
        pdf.ln(2)

    pdf.ln(10)

    # 3. Key Features
    pdf.set_font('Arial', 'B', 14)
    pdf.cell(0, 10, '3. KEY SYSTEM FEATURES', 0, 1, 'L')
    pdf.ln(5)
    
    features = [
        "- AI-Powered Revision Note Generation",
        "- Real-time AI Study Assistant (Chatbot)",
        "- Dynamic Study Planner and Task Manager",
        "- Daily Login Streaks and Progress Analytics",
        "- Hardware-integrated Study Reminders (Raspberry Pi)"
    ]
    
    pdf.set_font('Arial', '', 12)
    for feature in features:
        pdf.cell(0, 10, feature, 0, 1)

    pdf.output('Smart_Revise_Architecture.pdf')
    print("PDF generated successfully: Smart_Revise_Architecture.pdf")

if __name__ == "__main__":
    create_pdf()
