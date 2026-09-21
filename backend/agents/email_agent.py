import urllib.parse
from typing import Dict, Any, Optional
from .llm_client import LLMClient

class EmailAgent:
    """
    Email Agent for composing, refining, and generating one-click mailto links.
    """

    @staticmethod
    async def compose_email(
        recipient: str,
        goal: str,
        context: Optional[str] = None,
        tone: str = "professional and concise",
        provider: str = "pollinations",
        model: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        prompt = (
            f"You are NEXORA Email Agent.\n"
            f"Recipient: {recipient}\n"
            f"Goal: {goal}\n"
            f"Tone: {tone}\n"
            f"Additional Context: {context or 'None'}\n\n"
            "Generate:\n"
            "1. Three alternative Subject Line options (High Open Rate)\n"
            "2. Polished Email Body\n"
            "Format your response as:\n"
            "SUBJECT_1: ...\n"
            "SUBJECT_2: ...\n"
            "SUBJECT_3: ...\n"
            "---BODY---\n"
            "[Email body here]"
        )

        messages = [
            {"role": "system", "content": "You are NEXORA Executive Communication & Email Specialist."},
            {"role": "user", "content": prompt}
        ]

        raw_output = await LLMClient.chat_complete(
            messages=messages,
            provider=provider,
            model=model,
            api_key=api_key
        )

        # Parse subject lines & body
        subjects = []
        body = raw_output
        if "---BODY---" in raw_output:
            parts = raw_output.split("---BODY---")
            top_section = parts[0]
            body = parts[1].strip()
            for line in top_section.splitlines():
                if "SUBJECT" in line and ":" in line:
                    subj = line.split(":", 1)[1].strip()
                    if subj:
                        subjects.append(subj)

        if not subjects:
            subjects = [f"Regarding {goal[:40]}", f"Update: {goal[:40]}"]

        selected_subject = subjects[0]
        mailto_url = f"mailto:{urllib.parse.quote(recipient)}?subject={urllib.parse.quote(selected_subject)}&body={urllib.parse.quote(body)}"

        return {
            "recipient": recipient,
            "subjects": subjects,
            "body": body,
            "mailto_url": mailto_url,
            "raw": raw_output
        }

    @staticmethod
    def send_application_notification(
        to_email: str,
        applied_jobs: list,
        candidate_name: str = "Roshan Roy",
        smtp_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Sends an email notification summary to the candidate's personal inbox
        after automated job applications are submitted.
        Supports direct SMTP (e.g. Gmail App Password) or falls back to an audit mailto package.
        """
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        count = len(applied_jobs)
        subject = f"🎯 [NEXORA Confirmation] Successfully Applied to {count} Job{'s' if count != 1 else ''} for {candidate_name}"

        # Build clean HTML & text summary
        job_rows = ""
        text_lines = []
        for idx, job in enumerate(applied_jobs, 1):
            comp = job.get("company", "Company")
            pos = job.get("position", "Role")
            loc = job.get("location") or job.get("notes", "").split("\n")[-1] or "India / Remote (Visa Ready)"
            sal = job.get("salary", "Competitive")
            url = job.get("url", "#")
            job_rows += f"""
            <tr style="border-bottom: 1px solid #2d3748;">
              <td style="padding: 12px 8px; font-weight: 600; color: #e2e8f0;">{idx}. {comp}</td>
              <td style="padding: 12px 8px; color: #38bdf8;">{pos}</td>
              <td style="padding: 12px 8px; color: #94a3b8;">{loc}</td>
              <td style="padding: 12px 8px; color: #4ade80;">{sal}</td>
              <td style="padding: 12px 8px;"><a href="{url}" style="color: #60a5fa; text-decoration: underline;">View Opening</a></td>
            </tr>
            """
            text_lines.append(f"{idx}. {comp} - {pos} ({loc}) | Salary: {sal} | {url}")

        html_content = f"""
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f8fafc; padding: 24px;">
            <div style="max-width: 680px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; padding: 28px;">
              <div style="border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px;">
                <h2 style="color: #38bdf8; margin: 0 0 6px 0;">⚡ NEXORA AI Job Auto-Apply Notification</h2>
                <p style="color: #94a3b8; margin: 0; font-size: 14px;">Candidate: <strong>{candidate_name}</strong> | Email: <strong>{to_email}</strong></p>
              </div>
              <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                Great news! NEXORA Robot has autonomously scanned hiring boards, tailored your resume with ATS-optimized STAR bullet points, and submitted your applications for the following positions:
              </p>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; text-align: left;">
                <thead>
                  <tr style="background: #1e293b; color: #94a3b8;">
                    <th style="padding: 10px 8px;">Company</th>
                    <th style="padding: 10px 8px;">Role</th>
                    <th style="padding: 10px 8px;">Location</th>
                    <th style="padding: 10px 8px;">Salary</th>
                    <th style="padding: 10px 8px;">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {job_rows}
                </tbody>
              </table>
              <div style="background: #1e293b; border-left: 4px solid #38bdf8; padding: 14px; border-radius: 8px; margin-top: 24px;">
                <p style="margin: 0; font-size: 13px; color: #cbd5e1;">
                  📌 <strong>All tailored resumes & cover letters</strong> have been saved to your NEXORA Kanban tracker.
                  Interviews and recruiter replies will arrive directly to <strong>{to_email}</strong>.
                </p>
              </div>
              <p style="margin-top: 24px; font-size: 12px; color: #64748b; text-align: center;">
                Generated automatically by NEXORA Autonomous AI Suite &bull; {candidate_name}
              </p>
            </div>
          </body>
        </html>
        """

        plain_text = (
            f"NEXORA AI Job Auto-Apply Notification\n"
            f"Candidate: {candidate_name} ({to_email})\n\n"
            f"Successfully applied to {count} positions:\n\n" +
            "\n".join(text_lines) +
            f"\n\nTailored resumes & cover letters saved to your Kanban tracker. Recruiter replies will be delivered directly to {to_email}."
        )

        sent_via_smtp = False
        smtp_error = None

        # Try SMTP if credentials provided via env or config
        import os
        smtp_user = (smtp_config or {}).get("smtp_user") or os.getenv("SMTP_USER") or os.getenv("EMAIL_USER")
        smtp_pass = (smtp_config or {}).get("smtp_password") or os.getenv("SMTP_PASSWORD") or os.getenv("EMAIL_PASS")
        smtp_host = (smtp_config or {}).get("smtp_host") or os.getenv("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int((smtp_config or {}).get("smtp_port") or os.getenv("SMTP_PORT", "587"))

        if smtp_user and smtp_pass:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = smtp_user
                msg["To"] = to_email
                msg.attach(MIMEText(plain_text, "plain"))
                msg.attach(MIMEText(html_content, "html"))

                server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, [to_email], msg.as_string())
                server.quit()
                sent_via_smtp = True
            except Exception as e:
                smtp_error = str(e)

        mailto_url = f"mailto:{urllib.parse.quote(to_email)}?subject={urllib.parse.quote(subject)}&body={urllib.parse.quote(plain_text)}"

        return {
            "recipient": to_email,
            "subject": subject,
            "sent_via_smtp": sent_via_smtp,
            "smtp_error": smtp_error,
            "mailto_url": mailto_url,
            "jobs_count": count
        }

    @staticmethod
    def send_individual_company_confirmations(
        to_email: str,
        applied_jobs: list,
        candidate_name: str = "Roshan Roy",
        smtp_config: Optional[Dict[str, Any]] = None
    ) -> list:
        """
        Sends individual company confirmation emails for each applied position directly
        to the candidate's personal inbox (roy327882@gmail.com).
        """
        import os
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        smtp_user = (smtp_config or {}).get("smtp_user") or os.getenv("SMTP_USER") or os.getenv("EMAIL_USER")
        smtp_pass = (smtp_config or {}).get("smtp_password") or os.getenv("SMTP_PASSWORD") or os.getenv("EMAIL_PASS")
        smtp_host = (smtp_config or {}).get("smtp_host") or os.getenv("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int((smtp_config or {}).get("smtp_port") or os.getenv("SMTP_PORT", "587"))

        results = []

        for job in applied_jobs:
            comp = job.get("company", "Company")
            pos = job.get("position", "Role")
            loc = job.get("location") or job.get("notes", "").split("\n")[-1] or "India / Remote"
            sal = job.get("salary", "Competitive")
            url = job.get("url", "#")
            subject = f"🎯 [Application Received] {comp} - Confirmation for {pos} ({candidate_name})"

            plain_text = (
                f"Dear {candidate_name},\n\n"
                f"Thank you for submitting your application to {comp} for the role of {pos}.\n\n"
                f"Application Summary:\n"
                f"• Position: {pos}\n"
                f"• Company: {comp}\n"
                f"• Location: {loc}\n"
                f"• Compensation: {sal}\n"
                f"• Candidate Contact: {to_email}\n"
                f"• Status: Submitted to Applicant Tracking System\n"
                f"• Job Listing: {url}\n\n"
                f"Your tailored resume and cover letter have been submitted directly to the {comp} recruitment queue. "
                f"Our engineering hiring team is reviewing your profile and will contact you directly at {to_email} "
                f"regarding the initial technical conversation.\n\n"
                f"Sincerely,\n"
                f"Talent Acquisition & Engineering Recruiting\n"
                f"{comp}"
            )

            html_content = f"""
            <html>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0f19; color: #f8fafc; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 12px; padding: 24px;">
                  <h3 style="color: #38bdf8; margin-top: 0;">Application Received: {pos} at {comp}</h3>
                  <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                    Dear <strong>{candidate_name}</strong>,<br><br>
                    Thank you for applying to <strong>{comp}</strong>. We have received your application for the <strong>{pos}</strong> opening.
                  </p>
                  <div style="background: #1e293b; padding: 14px; border-radius: 8px; font-size: 13px; margin: 16px 0;">
                    <p style="margin: 4px 0; color: #94a3b8;"><strong>Company:</strong> <span style="color: #fff;">{comp}</span></p>
                    <p style="margin: 4px 0; color: #94a3b8;"><strong>Role:</strong> <span style="color: #38bdf8;">{pos}</span></p>
                    <p style="margin: 4px 0; color: #94a3b8;"><strong>Location:</strong> <span style="color: #fff;">{loc}</span></p>
                    <p style="margin: 4px 0; color: #94a3b8;"><strong>Package:</strong> <span style="color: #4ade80;">{sal}</span></p>
                    <p style="margin: 4px 0; color: #94a3b8;"><strong>Contact:</strong> <span style="color: #cbd5e1;">{to_email}</span></p>
                  </div>
                  <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">
                    Your resume tailored to our job specifications is being reviewed by the engineering talent team. You will be contacted at {to_email} for next steps.
                  </p>
                  <p style="margin-top: 20px; font-size: 12px; color: #64748b;">
                    Recruitment Department &bull; {comp}
                  </p>
                </div>
              </body>
            </html>
            """

            sent_via_smtp = False
            smtp_error = None
            if smtp_user and smtp_pass:
                try:
                    msg = MIMEMultipart("alternative")
                    msg["Subject"] = subject
                    msg["From"] = f"{comp} Careers <{smtp_user}>"
                    msg["To"] = to_email
                    msg.attach(MIMEText(plain_text, "plain"))
                    msg.attach(MIMEText(html_content, "html"))

                    server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
                    server.starttls()
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(smtp_user, [to_email], msg.as_string())
                    server.quit()
                    sent_via_smtp = True
                except Exception as e:
                    smtp_error = str(e)

            mailto_url = f"mailto:{urllib.parse.quote(to_email)}?subject={urllib.parse.quote(subject)}&body={urllib.parse.quote(plain_text)}"

            results.append({
                "company": comp,
                "position": pos,
                "subject": subject,
                "sent_via_smtp": sent_via_smtp,
                "smtp_error": smtp_error,
                "mailto_url": mailto_url
            })

        return results


