export const FRONT_EMAIL_HTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Kumbra Capital</title>
    <style>
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; max-width: 100% !important; }
            .mobile-padding { padding: 20px !important; }
            .mobile-text { font-size: 14px !important; }
            .mobile-heading { font-size: 20px !important; }
            .mobile-title { font-size: 24px !important; }
            .stats-table { display: block !important; width: 100% !important; }
            .stats-cell { display: block !important; width: 100% !important; margin-bottom: 15px !important; }
            .logo-cell { width: 60px !important; }
            .logo-img { width: 60px !important; height: 60px !important; }
            .step-number { width: 40px !important; height: 40px !important; line-height: 40px !important; font-size: 20px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 10px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" class="container" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; max-width: 600px;">
                    <tr>
                        <td style="background-color: #1e293b; padding: 20px; text-align: center;" class="mobile-padding">
                            <img src="https://kumbracapital.com/logolight.png" alt="Kumbra Capital" style="height: 60px; width: auto; margin-bottom: 8px;">
                            <h1 style="margin: 0; padding: 0; color: #ffffff; font-size: 32px; font-weight: bold; line-height: 1.3;" class="mobile-title">Welcome to Kumbra Capital</h1>
                            <p style="margin: 10px 0 0 0; padding: 0; color: #cbd5e1; font-size: 16px; line-height: 1.5;" class="mobile-text">Your Gateway to Exclusive Pre-IPO Investment Opportunities</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px;" class="mobile-padding">
                            <p style="margin: 0 0 10px 0; padding: 0; color: #475569; font-size: 16px; line-height: 1.5;" class="mobile-text">Dear <strong>{{CONTACT_NAME}}</strong>,</p>
                            <p style="margin: 0 0 12px 0; padding: 0; color: #475569; font-size: 16px; line-height: 1.5;" class="mobile-text">Thank you for taking the time to speak with me today. It was a pleasure discussing your investment objectives, and I'm delighted to provide you with detailed information about the exclusive pre-IPO opportunities available through Kumbra Capital. As we discussed, these investments offer sophisticated investors like yourself access to some of the world's most promising private companies before they enter public markets.</p>

                            <div style="height: 2px; background-color: #e5e7eb; margin: 12px 0;"></div>

                            <h2 style="margin: 0 0 8px 0; padding: 0; color: #1e293b; font-size: 24px; font-weight: bold;" class="mobile-heading">Who We Are</h2>
                            <p style="margin: 0 0 10px 0; padding: 0; color: #475569; font-size: 16px; line-height: 1.5;" class="mobile-text">Kumbra Capital is a leading investment firm specializing in exclusive pre-IPO opportunities for sophisticated investors. We provide access to late-stage private companies positioned for public market entry, offering our clients the potential to invest in tomorrow's market leaders today.</p>
                            <p style="margin: 0 0 12px 0; padding: 0; color: #475569; font-size: 16px; line-height: 1.5;" class="mobile-text">With a proven track record of identifying high-growth companies across Technology, FinTech, Healthcare, and Clean Energy sectors, we've helped our clients achieve an average return of <strong style="color: #1e293b;">43%</strong> across our portfolio.</p>

                            <div style="height: 2px; background-color: #e5e7eb; margin: 12px 0;"></div>

                            <h2 style="margin: 0 0 8px 0; padding: 0; color: #1e293b; font-size: 24px; font-weight: bold;" class="mobile-heading">What We Offer</h2>
                            <p style="margin: 0 0 10px 0; padding: 0; color: #475569; font-size: 16px; line-height: 1.5;" class="mobile-text">We provide curated access to pre-IPO investment opportunities that are typically reserved for institutional investors. Our rigorous selection process ensures that every opportunity we present meets the highest standards of quality and potential.</p>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" class="stats-table" style="margin: 12px 0;">
                                <tr>
                                    <td width="48%" class="stats-cell" style="background-color: #1e293b; padding: 25px; vertical-align: top; border-radius: 8px;">
                                        <p style="margin: 0 0 5px 0; padding: 0; color: #ffffff; font-size: 32px; font-weight: bold;">28</p>
                                        <p style="margin: 0; padding: 0; color: #cbd5e1; font-size: 14px;" class="mobile-text">Active Opportunities</p>
                                    </td>
                                    <td width="4%"></td>
                                    <td width="48%" class="stats-cell" style="background-color: #64748b; padding: 25px; vertical-align: top; border-radius: 8px;">
                                        <p style="margin: 0 0 5px 0; padding: 0; color: #ffffff; font-size: 32px; font-weight: bold;">43%</p>
                                        <p style="margin: 0; padding: 0; color: #e2e8f0; font-size: 14px;" class="mobile-text">Average Return</p>
                                    </td>
                                </tr>
                            </table>

                            <div style="height: 2px; background-color: #e5e7eb; margin: 12px 0;"></div>

                            <h2 style="margin: 0 0 8px 0; padding: 0; color: #1e293b; font-size: 24px; font-weight: bold;" class="mobile-heading">Current Pre-IPO Opportunities</h2>
                            <p style="margin: 0 0 10px 0; padding: 0; color: #475569; font-size: 16px; line-height: 1.5;" class="mobile-text">Based on our conversation, here are the featured investment opportunities that align with your investment profile:</p>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 10px; background-color: #fafafa; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                                <tr>
                                    <td style="padding: 12px;" class="mobile-padding">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td width="80" class="logo-cell" valign="top">
                                                    <img src="https://logo.clearbit.com/spacex.com" alt="SpaceX" class="logo-img" style="width: 70px; height: 70px; display: block; background-color: #000000; padding: 5px; border-radius: 4px;">
                                                </td>
                                                <td valign="top" style="padding-left: 20px;">
                                                    <h3 style="margin: 0 0 10px 0; padding: 0; color: #1e293b; font-size: 22px; font-weight: bold;" class="mobile-heading">SpaceX</h3>
                                                    <p style="margin: 0 0 5px 0; padding: 0; color: #64748b; font-size: 14px;" class="mobile-text">Aerospace · Late Stage</p>
                                                </td>
                                            </tr>
                                        </table>
                                        <p style="margin: 10px 0 10px 0; padding: 0; color: #475569; font-size: 15px; line-height: 1.4;" class="mobile-text">SpaceX is revolutionizing space technology with reusable rockets and ambitious plans for Mars colonization. The company operates Starlink, the world's largest satellite constellation providing global internet coverage, and has become NASA's primary partner for space missions.</p>
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="padding: 10px 0; border-top: 1px solid #e5e7eb;"><span style="color: #64748b; font-size: 14px;" class="mobile-text">Valuation:</span></td>
                                                <td align="right" style="padding: 10px 0; border-top: 1px solid #e5e7eb;"><span style="color: #1e293b; font-weight: bold; font-size: 14px;" class="mobile-text">$180B</span></td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px 0; border-top: 1px solid #e5e7eb;"><span style="color: #64748b; font-size: 14px;" class="mobile-text">Min. Investment:</span></td>
                                                <td align="right" style="padding: 10px 0; border-top: 1px solid #e5e7eb;"><span style="color: #1e293b; font-weight: bold; font-size: 14px;" class="mobile-text">£250,000</span></td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px 0; border-top: 1px solid #e5e7eb;"><span style="color: #64748b; font-size: 14px;" class="mobile-text">Expected IPO:</span></td>
                                                <td align="right" style="padding: 10px 0; border-top: 1px solid #e5e7eb;"><span style="color: #1e293b; font-weight: bold; font-size: 14px;" class="mobile-text">Q4 2025</span></td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 10px; background-color: #fafafa; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                                <tr>
                                    <td style="padding: 12px;" class="mobile-padding">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td width="80" class="logo-cell" valign="top">
                                                    <img src="https://logo.clearbit.com/stripe.com" alt="Stripe" class="logo-img" style="width: 70px; height: 70px; display: block; padding: 5px; border-radius: 4px;">
                                                </td>
                                                <td valign="top" style="padding-left: 20px;">
                                                    <h3 style="margin: 0 0 10px 0; padding: 0; color: #1e293b; font-size: 22px; font-weight: bold;" class="mobile-heading">Stripe</h3>
                                                    <p style="margin: 0 0 5px 0; padding: 0; color: #64748b; font-size: 14px;" class="mobile-text">FinTech · Pre-IPO</p>
                                                </td>
                                            </tr>
                                        </table>
                                        <p style="margin: 10px 0 10px 0; padding: 0; color: #475569; font-size: 15px; line-height: 1.4;" class="mobile-text">Stripe has transformed online payments, powering millions of businesses worldwide including Amazon, Google, and Shopify. The company processes hundreds of billions in transactions annually and continues expanding into financial services and global payment infrastructure.</p>
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="padding: 10px 0; border-top: 1px solid #e5e7eb;"><span style="color: #64748b; font-size: 14px;" class="mobile-text">Valuation:</span></td>
                                                <td align="right" style="padding: 10px 0; border-top: 1px solid #e5e7eb;"><span style="color: #1e293b; font-weight: bold; font-size: 14px;" class="mobile-text">$65B</span></td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px 0; border-top: 1px solid #e5e7eb;"><span style="color: #64748b; font-size: 14px;" class="mobile-text">Min. Investment:</span></td>
                                                <td align="right" style="padding: 10px 0; border-top: 1px solid #e5e7eb;"><span style="color: #1e293b; font-weight: bold; font-size: 14px;" class="mobile-text">£150,000</span></td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px 0; border-top: 1px solid #e5e7eb;"><span style="color: #64748b; font-size: 14px;" class="mobile-text">Expected IPO:</span></td>
                                                <td align="right" style="padding: 10px 0; border-top: 1px solid #e5e7eb;"><span style="color: #1e293b; font-weight: bold; font-size: 14px;" class="mobile-text">Q2 2025</span></td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 30px; background-color: #fafafa; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                                <tr>
                                    <td style="padding: 12px;" class="mobile-padding">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td width="80" class="logo-cell" valign="top">
                                                    <img src="https://logo.clearbit.com/databricks.com" alt="Databricks" class="logo-img" style="width: 70px; height: 70px; display: block; padding: 5px; border-radius: 4px;">
                                                </td>
                                                <td valign="top" style="padding-left: 20px;">
                                                    <h3 style="margin: 0 0 10px 0; padding: 0; color: #1e293b; font-size: 22px; font-weight: bold;" class="mobile-heading">Databricks</h3>
                                                    <p style="margin: 0 0 5px 0; padding: 0; color: #64748b; font-size: 14px;" class="mobile-text">Data & AI · Series I</p>
                                                </td>
                                            </tr>
                                        </table>
                                        <p style="margin: 10px 0 10px 0; padding: 0; color: #475569; font-size: 15px; line-height: 1.4;" class="mobile-text">Databricks is the leading unified data and AI platform, empowering thousands of companies to harness their data for artificial intelligence and machine learning applications. The company's platform is essential infrastructure for the AI revolution.</p>
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="padding: 10px 0; border-top: 1px solid #e5e7eb;"><span style="color: #64748b; font-size: 14px;" class="mobile-text">Valuation:</span></td>
                                                <td align="right" style="padding: 10px 0; border-top: 1px solid #e5e7eb;"><span style="color: #1e293b; font-weight: bold; font-size: 14px;" class="mobile-text">$43B</span></td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px 0; border-top: 1px solid #e5e7eb;"><span style="color: #64748b; font-size: 14px;" class="mobile-text">Min. Investment:</span></td>
                                                <td align="right" style="padding: 10px 0; border-top: 1px solid #e5e7eb;"><span style="color: #1e293b; font-weight: bold; font-size: 14px;" class="mobile-text">£100,000</span></td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px 0; border-top: 1px solid #e5e7eb;"><span style="color: #64748b; font-size: 14px;" class="mobile-text">Expected IPO:</span></td>
                                                <td align="right" style="padding: 10px 0; border-top: 1px solid #e5e7eb;"><span style="color: #1e293b; font-weight: bold; font-size: 14px;" class="mobile-text">Q3 2025</span></td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <div style="height: 2px; background-color: #e5e7eb; margin: 12px 0;"></div>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; border: 2px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px;">
                                <tr>
                                    <td style="padding: 12px;" class="mobile-padding">
                                        <h2 style="margin: 0 0 8px 0; padding: 0; color: #1e293b; font-size: 24px; font-weight: bold;" class="mobile-heading">Your Client Portal</h2>
                                        <p style="margin: 0 0 10px 0; padding: 0; color: #475569; font-size: 16px; line-height: 1.5;" class="mobile-text">Once you become a client, you'll gain access to your secure client portal where you can:</p>
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr><td style="padding: 5px 0;"><span style="color: #1e293b; font-size: 18px; margin-right: 10px;">•</span><span style="color: #475569; font-size: 15px;" class="mobile-text">Monitor your investment holdings in real-time</span></td></tr>
                                            <tr><td style="padding: 5px 0;"><span style="color: #1e293b; font-size: 18px; margin-right: 10px;">•</span><span style="color: #475569; font-size: 15px;" class="mobile-text">Access detailed performance reports and analytics</span></td></tr>
                                            <tr><td style="padding: 5px 0;"><span style="color: #1e293b; font-size: 18px; margin-right: 10px;">•</span><span style="color: #475569; font-size: 15px;" class="mobile-text">Review investment documents and agreements</span></td></tr>
                                            <tr><td style="padding: 5px 0;"><span style="color: #1e293b; font-size: 18px; margin-right: 10px;">•</span><span style="color: #475569; font-size: 15px;" class="mobile-text">Stay updated on company news and IPO developments</span></td></tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <div style="height: 2px; background-color: #e5e7eb; margin: 12px 0;"></div>

                            <h2 style="margin: 0 0 8px 0; padding: 0; color: #1e293b; font-size: 24px; font-weight: bold;" class="mobile-heading">Your Investment Journey</h2>
                            <p style="margin: 0 0 10px 0; padding: 0; color: #475569; font-size: 16px; line-height: 1.5;" class="mobile-text">Getting started is simple. Here's our streamlined process:</p>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 8px;">
                                <tr>
                                    <td width="60" valign="top">
                                        <div class="step-number" style="width: 50px; height: 50px; background-color: #1e293b; text-align: center; line-height: 50px; border-radius: 8px;">
                                            <span style="color: #ffffff; font-size: 24px; font-weight: bold;">1</span>
                                        </div>
                                    </td>
                                    <td valign="top" style="padding-left: 15px;">
                                        <h3 style="margin: 0 0 5px 0; padding: 0; color: #1e293b; font-size: 18px; font-weight: bold;" class="mobile-text">Open Your Account</h3>
                                        <p style="margin: 0; padding: 0; color: #64748b; font-size: 15px; line-height: 1.5;" class="mobile-text">Complete our simple online application form. It takes just 10 minutes and you can save your progress at any time.</p>
                                    </td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 8px;">
                                <tr>
                                    <td width="60" valign="top">
                                        <div class="step-number" style="width: 50px; height: 50px; background-color: #64748b; text-align: center; line-height: 50px; border-radius: 8px;">
                                            <span style="color: #ffffff; font-size: 24px; font-weight: bold;">2</span>
                                        </div>
                                    </td>
                                    <td valign="top" style="padding-left: 15px;">
                                        <h3 style="margin: 0 0 5px 0; padding: 0; color: #1e293b; font-size: 18px; font-weight: bold;" class="mobile-text">Upload KYC Documents</h3>
                                        <p style="margin: 0; padding: 0; color: #64748b; font-size: 15px; line-height: 1.5;" class="mobile-text">Securely upload your identity verification documents (passport/ID and proof of address). Our compliance team will review within 24 hours.</p>
                                    </td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 8px;">
                                <tr>
                                    <td width="60" valign="top">
                                        <div class="step-number" style="width: 50px; height: 50px; background-color: #1e293b; text-align: center; line-height: 50px; border-radius: 8px;">
                                            <span style="color: #ffffff; font-size: 24px; font-weight: bold;">3</span>
                                        </div>
                                    </td>
                                    <td valign="top" style="padding-left: 15px;">
                                        <h3 style="margin: 0 0 5px 0; padding: 0; color: #1e293b; font-size: 18px; font-weight: bold;" class="mobile-text">Review & Sign Agreement</h3>
                                        <p style="margin: 0; padding: 0; color: #64748b; font-size: 15px; line-height: 1.5;" class="mobile-text">Once approved, we'll send you the Share Purchase Agreement (SPA) for your chosen investment. Review and sign electronically at your convenience.</p>
                                    </td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 30px;">
                                <tr>
                                    <td width="60" valign="top">
                                        <div class="step-number" style="width: 50px; height: 50px; background-color: #64748b; text-align: center; line-height: 50px; border-radius: 8px;">
                                            <span style="color: #ffffff; font-size: 24px; font-weight: bold;">4</span>
                                        </div>
                                    </td>
                                    <td valign="top" style="padding-left: 15px;">
                                        <h3 style="margin: 0 0 5px 0; padding: 0; color: #1e293b; font-size: 18px; font-weight: bold;" class="mobile-text">Fund & Monitor</h3>
                                        <p style="margin: 0; padding: 0; color: #64748b; font-size: 15px; line-height: 1.5;" class="mobile-text">Transfer your investment amount to your account. Access your client portal immediately to monitor your holdings, track performance, and receive IPO updates.</p>
                                    </td>
                                </tr>
                            </table>

                            <div style="height: 2px; background-color: #e5e7eb; margin: 12px 0;"></div>

                            <h2 style="margin: 0 0 8px 0; padding: 0; color: #1e293b; font-size: 24px; font-weight: bold;" class="mobile-heading">Next Steps</h2>
                            <p style="margin: 0 0 10px 0; padding: 0; color: #475569; font-size: 16px; line-height: 1.5;" class="mobile-text">If you would like to proceed with any of these investment opportunities, simply reply to this email and I will prepare the necessary documentation and send it over to you promptly. The process is straightforward, and I'll guide you through each step personally.</p>
                            <p style="margin: 0 0 12px 0; padding: 0; color: #475569; font-size: 16px; line-height: 1.5;" class="mobile-text">Should you have any questions or would prefer to discuss these opportunities in more detail, please don't hesitate to request a callback at your convenience. I'm here to ensure you have all the information you need to make an informed investment decision.</p>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 12px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="mailto:{{BROKER_EMAIL}}" style="display: inline-block; background-color: #1e293b; color: #ffffff; text-decoration: none; padding: 16px 40px; font-size: 16px; font-weight: bold; border-radius: 6px;">Reply to Proceed</a>
                                    </td>
                                </tr>
                            </table>

                            <div style="height: 2px; background-color: #e5e7eb; margin: 12px 0;"></div>

                            <p style="margin: 0 0 10px 0; padding: 0; color: #475569; font-size: 16px; line-height: 1.5;" class="mobile-text">I look forward to helping you access these exclusive pre-IPO investment opportunities and working together to achieve your financial goals.</p>
                            <p style="margin: 0 0 8px 0; padding: 0; color: #475569; font-size: 16px; line-height: 1.6;" class="mobile-text">Warm regards,</p>
                            <p style="margin: 0; padding: 0; color: #1e293b; font-size: 16px; font-weight: bold;">{{BROKER_NAME}}</p>
                            <p style="margin: 0; padding: 0; color: #64748b; font-size: 15px; font-style: italic;">Senior Advisor</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #fafafa; border-top: 2px solid #e5e7eb; text-align: center;">
                            {{SIGNATURE}}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

export function applyTemplateVariables(
  template: string,
  variables: { contactName?: string; brokerName?: string; brokerEmail?: string; signature?: string }
): string {
  let result = template;

  if (variables.contactName) {
    result = result.replace(/\{\{CONTACT_NAME\}\}/g, variables.contactName);
  }

  if (variables.brokerName) {
    result = result.replace(/\{\{BROKER_NAME\}\}/g, variables.brokerName);
  }

  if (variables.brokerEmail) {
    result = result.replace(/\{\{BROKER_EMAIL\}\}/g, variables.brokerEmail);
  }

  if (variables.signature) {
    result = result.replace(/\{\{SIGNATURE\}\}/g, variables.signature);
  }

  return result;
}
