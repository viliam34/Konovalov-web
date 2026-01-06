const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the parent directory (your website)
app.use(express.static(path.join(__dirname, '..')));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
    fileFilter: (req, file, cb) => {
        // Allowed file types
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'application/zip'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Nepovolený typ súboru. Povolené formáty: PDF, DOC, DOCX, JPG, PNG, ZIP'), false);
        }
    }
});

// Create email transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

// Contact form endpoint
app.post('/api/contact', upload.array('attachment', 5), async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        // Validation
        if (!name || !email || !subject) {
            return res.status(400).json({
                success: false,
                message: 'Vyplňte prosím všetky povinné polia (meno, email, predmet).'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Zadajte prosím platnú emailovú adresu.'
            });
        }

        // Prepare attachments
        const attachments = [];
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                attachments.push({
                    filename: file.originalname,
                    content: file.buffer,
                    contentType: file.mimetype
                });
            });
        }

        // Create transporter
        const transporter = createTransporter();

        // Email content
        const mailOptions = {
            from: `"${name}" <${email}>`,
            to: process.env.EMAIL_TO || 'archvizual.studio@gmail.com',
            replyTo: email,
            subject: `[Kontakt z webu] ${subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #C9B496 0%, #B8A082 100%); padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">Nová správa z kontaktného formulára</h1>
                    </div>
                    <div style="padding: 30px; background: #f9f9f9;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">Meno:</td>
                                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
                                <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><a href="mailto:${email}">${email}</a></td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Predmet:</td>
                                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${subject}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; font-weight: bold; vertical-align: top;">Správa:</td>
                                <td style="padding: 10px 0;">${message ? message.replace(/\n/g, '<br>') : '<em>Bez správy</em>'}</td>
                            </tr>
                        </table>
                        ${attachments.length > 0 ? `
                            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                                <strong>Prílohy:</strong> ${attachments.length} súbor(ov)
                            </div>
                        ` : ''}
                    </div>
                    <div style="background: #333; color: #999; padding: 15px; text-align: center; font-size: 12px;">
                        Táto správa bola odoslaná z kontaktného formulára na webovej stránke.
                    </div>
                </div>
            `,
            text: `
Nová správa z kontaktného formulára

Meno: ${name}
Email: ${email}
Predmet: ${subject}
Správa: ${message || 'Bez správy'}
${attachments.length > 0 ? `Prílohy: ${attachments.length} súbor(ov)` : ''}
            `,
            attachments: attachments
        };

        // Send email
        await transporter.sendMail(mailOptions);

        // Send confirmation email to the sender
        const confirmationMailOptions = {
            from: `"ARCHVIZUAL.STUDIO" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Ďakujeme za Vašu správu - ARCHVIZUAL.STUDIO',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #C9B496 0%, #B8A082 100%); padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">Ďakujeme za Vašu správu</h1>
                    </div>
                    <div style="padding: 30px; background: #f9f9f9;">
                        <p>Vážený/á ${name},</p>
                        <p>ďakujeme za Vašu správu. Prijali sme Vašu žiadosť a budeme Vás kontaktovať čo najskôr.</p>
                        <p><strong>Zhrnutie Vašej správy:</strong></p>
                        <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
                            <p><strong>Predmet:</strong> ${subject}</p>
                            <p><strong>Správa:</strong> ${message || 'Bez správy'}</p>
                        </div>
                        <p>S pozdravom,<br><strong>Tím ARCHVIZUAL.STUDIO</strong></p>
                    </div>
                    <div style="background: #333; color: #999; padding: 15px; text-align: center; font-size: 12px;">
                        <p style="margin: 0;">ARCHVIZUAL.STUDIO | Letná 42, 040 01 Košice</p>
                        <p style="margin: 5px 0 0;">Tel: +421910252500 | Email: archvizual.studio@gmail.com</p>
                    </div>
                </div>
            `,
            text: `
Vážený/á ${name},

ďakujeme za Vašu správu. Prijali sme Vašu žiadosť a budeme Vás kontaktovať čo najskôr.

Zhrnutie Vašej správy:
Predmet: ${subject}
Správa: ${message || 'Bez správy'}

S pozdravom,
Tím ARCHVIZUAL.STUDIO

---
ARCHVIZUAL.STUDIO
Letná 42, 040 01 Košice
Tel: +421910252500
Email: archvizual.studio@gmail.com
            `
        };

        await transporter.sendMail(confirmationMailOptions);

        res.json({
            success: true,
            message: 'Vaša správa bola úspešne odoslaná! Potvrdenie sme Vám poslali na email.'
        });

    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({
            success: false,
            message: 'Pri odosielaní správy došlo k chybe. Skúste to prosím znova alebo nás kontaktujte telefonicky.'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📧 Contact form endpoint: http://localhost:${PORT}/api/contact`);
});
