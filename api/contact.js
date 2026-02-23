const sgMail = require('@sendgrid/mail');

// Set SendGrid API key from environment variable
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract form data
  const { 
    name, 
    email, 
    phone, 
    business,
    role,
    message, 
    fax_number, // Honeypot field
    _timestamp 
  } = req.body;

  // Basic spam protection checks
  
  // 1. Honeypot check
  if (fax_number && fax_number.trim() !== '') {
    return res.status(400).json({ error: 'Spam detected' });
  }

  // 2. Timestamp check (form must be open for at least 3 seconds)
  const now = Date.now();
  const timestamp = parseInt(_timestamp);
  if (!timestamp || (now - timestamp < 3000)) {
    return res.status(400).json({ error: 'Form submitted too quickly' });
  }

  // 3. Basic required field validation
  if (!name || !email || !role || !message) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  // 4. Basic gibberish detection (very simple)
  const gibberishPatterns = [
    /(.)\1{4,}/, // Repeated characters
    /^[a-z]{30,}$/i, // Long strings without spaces
    /(.{2,})\1{3,}/, // Repeated patterns
  ];
  
  const textToCheck = `${name} ${message}`;
  if (gibberishPatterns.some(pattern => pattern.test(textToCheck))) {
    return res.status(400).json({ error: 'Invalid content detected' });
  }

  // Format submission data
  const submissionTime = new Date().toLocaleString('en-US', {
    timeZone: 'America/Boise',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const formattedPhone = phone ? phone : 'Not provided';
  const formattedBusiness = business ? business : 'Not provided';

  // Create notification email content
  const notificationHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <h2 style="color: #1B365D;">New Hard Court Collective Lead</h2>
      
      <div style="background: #f0f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1B365D;">Contact Information</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>Phone:</strong> ${formattedPhone}</p>
        <p><strong>Business:</strong> ${formattedBusiness}</p>
        <p><strong>Role:</strong> ${role}</p>
      </div>
      
      <div style="background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #1B365D;">Project/Inquiry Details</h3>
        <p style="white-space: pre-wrap;">${message}</p>
      </div>
      
      <div style="margin-top: 20px; font-size: 14px; color: #6C757D;">
        <p><strong>Submitted:</strong> ${submissionTime}</p>
        <p><strong>Source:</strong> Hard Court Collective website contact form</p>
      </div>
    </div>
  `;

  // Create auto-reply content
  const autoReplyHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <div style="background: #1B365D; color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0;">Hard Court Collective</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Marketing Built for Performance</p>
      </div>
      
      <div style="padding: 30px; background: #f0f4f8;">
        <h2 style="color: #1B365D;">Thank You for Your Interest!</h2>
        
        <p>Hi ${name},</p>
        
        <p>Thank you for reaching out to Hard Court Collective. We've received your inquiry and our team is already reviewing the details you provided.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2E7D32;">
          <h3 style="margin-top: 0; color: #1B365D;">What Happens Next:</h3>
          <ol>
            <li><strong>Quick Response (Within 2 Hours):</strong> A member of our team will contact you to confirm receipt and gather any additional details needed for your market analysis.</li>
            <li><strong>Market Analysis (24-48 Hours):</strong> We'll analyze your local competition, search volume, and opportunity gaps specific to your market.</li>
            <li><strong>Strategy Consultation (Within 1 Week):</strong> We'll schedule a 15-30 minute call to review our findings and discuss your custom marketing roadmap.</li>
          </ol>
        </div>
        
        <p>As a sports surface professional, you understand that quality work deserves quality marketing. We're excited to show you exactly how to position your expertise where facility owners are actively searching.</p>
        
        <div style="background: #1B365D; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0;"><strong>Questions before our call?</strong></p>
          <p style="margin: 10px 0 0 0;">Reply to this email or contact us directly at <a href="mailto:info@hardcourtcollective.com" style="color: #2E7D32;">info@hardcourtcollective.com</a></p>
        </div>
        
        <p>Best regards,<br>
        <strong>The Hard Court Collective Team</strong></p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #6C757D;">
          <p><strong>Hard Court Collective</strong><br>
          Marketing Built for Performance<br>
          <a href="mailto:info@hardcourtcollective.com">info@hardcourtcollective.com</a><br>
          <a href="https://hardcourtcollective.com">hardcourtcollective.com</a></p>
        </div>
      </div>
    </div>
  `;

  try {
    // Send notification email to team
    await sgMail.send({
      to: [
        'info@hardcourtcollective.com',
        'bryce@gullstack.com'
      ],
      from: {
        email: 'notifications@hardcourtcollective.com',
        name: 'Hard Court Collective'
      },
      subject: `New Lead: ${name} (${role}) - Hard Court Collective`,
      html: notificationHtml,
      text: `New Hard Court Collective Lead

Name: ${name}
Email: ${email}
Phone: ${formattedPhone}
Business: ${formattedBusiness}
Role: ${role}

Message:
${message}

Submitted: ${submissionTime}
Source: Website contact form`
    });

    // Send auto-reply to submitter
    await sgMail.send({
      to: email,
      from: {
        email: 'info@hardcourtcollective.com',
        name: 'Hard Court Collective'
      },
      subject: 'Thank You for Your Interest - Hard Court Collective',
      html: autoReplyHtml,
      text: `Thank you for your interest in Hard Court Collective!

Hi ${name},

We've received your inquiry and our team is reviewing the details you provided.

What happens next:
1. Quick Response (Within 2 Hours): We'll contact you to confirm receipt
2. Market Analysis (24-48 Hours): We'll analyze your local competition
3. Strategy Consultation (Within 1 Week): We'll schedule a call to discuss your custom marketing roadmap

Questions? Reply to this email or contact us at info@hardcourtcollective.com

Best regards,
The Hard Court Collective Team

Hard Court Collective
Marketing Built for Performance
info@hardcourtcollective.com
https://hardcourtcollective.com`
    });

    // Return success response
    res.status(200).json({ 
      success: true, 
      message: 'Thank you for your message! We\'ll be in touch within 2 hours.' 
    });

  } catch (error) {
    console.error('Error sending email:', error);
    
    // Don't expose internal errors to users
    res.status(500).json({ 
      error: 'There was a problem sending your message. Please try again or email us directly at info@hardcourtcollective.com.' 
    });
  }
}