import resend
import os
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv('RESEND_API_KEY', '')

def send_email(to_email, subject, html_content):
    """Send email using Resend"""
    try:
        if not resend.api_key:
            print("Warning: RESEND_API_KEY not configured")
            return False
        
        params = {
            "from": "Placement Portal <onboarding@resend.dev>",  # Resend's test domain
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }
        
        email = resend.Emails.send(params)
        print(f"Email sent successfully to {to_email}: {email}")
        return True
        
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False


# Email Templates
def get_registration_email(name, email, role):
    """Welcome email template"""
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #14B8A6 0%, #0EA5E9 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Welcome to Placement Portal! 🎉</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937;">Hello {name}!</h2>
            
            <p style="color: #4b5563; line-height: 1.6;">
                Thank you for registering with Placement Portal. Your account has been created successfully.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Email:</strong> {email}</p>
                <p style="margin: 5px 0;"><strong>Role:</strong> {role.upper()}</p>
            </div>
            
            <p style="color: #4b5563;">
                You can now login to your dashboard and start exploring placement opportunities.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:5173/login" 
                   style="background: #14B8A6; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Login Now
                </a>
            </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>© 2025 Placement Portal. All rights reserved.</p>
        </div>
    </body>
    </html>
    """
    return html


def get_application_submitted_email(student_name, company_name, job_role):
    """Application confirmation email"""
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Application Received! 📝</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937;">Hi {student_name}!</h2>
            
            <p style="color: #4b5563; line-height: 1.6;">
                Great news! Your application has been successfully submitted.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6;">
                <p style="margin: 5px 0;"><strong>Company:</strong> {company_name}</p>
                <p style="margin: 5px 0;"><strong>Position:</strong> {job_role}</p>
                <p style="margin: 5px 0; color: #10B981;"><strong>Status:</strong> Applied ✓</p>
            </div>
            
            <p style="color: #4b5563;">
                We'll notify you about further updates. Keep checking your dashboard!
            </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>© 2025 Placement Portal. All rights reserved.</p>
        </div>
    </body>
    </html>
    """
    return html


def get_shortlisted_email(student_name, company_name, job_role, round_name):
    """Shortlisted notification email"""
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #A855F7 0%, #EC4899 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Congratulations! You're Shortlisted! ⭐</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937;">Excellent news, {student_name}!</h2>
            
            <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
                You have been <strong style="color: #A855F7;">shortlisted</strong> for the next round!
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #A855F7;">
                <p style="margin: 5px 0;"><strong>Company:</strong> {company_name}</p>
                <p style="margin: 5px 0;"><strong>Position:</strong> {job_role}</p>
                <p style="margin: 5px 0;"><strong>Next Round:</strong> {round_name}</p>
            </div>
            
            <p style="color: #4b5563;">
                Prepare well and give your best! All the best! 💪
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:5173/student/applications" 
                   style="background: #A855F7; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 6px; font-weight: bold;">
                    View Details
                </a>
            </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>© 2025 Placement Portal. All rights reserved.</p>
        </div>
    </body>
    </html>
    """
    return html


def get_selected_email(student_name, company_name, job_role, package):
    """Selection notification email"""
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10B981 0%, #14B8A6 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px;">🎉 CONGRATULATIONS! 🎉</h1>
            <p style="color: white; font-size: 20px; margin: 10px 0;">You're SELECTED!</p>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937;">Dear {student_name},</h2>
            
            <p style="color: #4b5563; line-height: 1.6; font-size: 18px;">
                We are thrilled to inform you that you have been <strong style="color: #10B981;">SELECTED</strong>!
            </p>
            
            <div style="background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border: 3px solid #10B981;">
                <p style="margin: 10px 0; font-size: 16px;"><strong>Company:</strong> {company_name}</p>
                <p style="margin: 10px 0; font-size: 16px;"><strong>Position:</strong> {job_role}</p>
                <p style="margin: 10px 0; font-size: 18px;"><strong>Package:</strong> <span style="color: #10B981;">₹{package}</span></p>
            </div>
            
            <p style="color: #4b5563; line-height: 1.6;">
                This is a remarkable achievement! The TPO will contact you soon with further details.
            </p>
            
            <p style="color: #4b5563; font-weight: bold;">
                Congratulations once again! 🌟
            </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>© 2025 Placement Portal. All rights reserved.</p>
        </div>
    </body>
    </html>
    """
    return html


def get_rejected_email(student_name, company_name, job_role):
    """Rejection email"""
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #6B7280; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Application Update</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937;">Dear {student_name},</h2>
            
            <p style="color: #4b5563; line-height: 1.6;">
                Thank you for your interest in the {job_role} position at {company_name}.
            </p>
            
            <p style="color: #4b5563; line-height: 1.6;">
                After careful consideration, we regret to inform you that we will not be moving forward 
                with your application at this time.
            </p>
            
            <p style="color: #4b5563; line-height: 1.6;">
                We encourage you to keep applying to other opportunities. Your perfect match is out there!
            </p>
            
            <p style="color: #4b5563; font-weight: bold;">
                Keep going! Success is just around the corner. 💪
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:5173/student/drives" 
                   style="background: #14B8A6; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Explore More Drives
                </a>
            </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>© 2025 Placement Portal. All rights reserved.</p>
        </div>
    </body>
    </html>
    """
    return html
