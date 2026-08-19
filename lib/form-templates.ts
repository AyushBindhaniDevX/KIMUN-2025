// lib/form-templates.ts
import { FormSchema } from '@/types/form-engine'

export const FORM_TEMPLATES: FormSchema[] = [
  {
    id: 'tpl_kimun_delegate_2025',
    title: 'KIMUN 2025 Delegate Registration',
    slug: 'kimun-2025-delegate',
    description: 'Official delegate registration portal for KIMUN 2025 international conference.',
    category: 'mun_registration',
    status: 'published',
    requireAuth: true,
    allowMultipleSubmissions: false,
    themeConfig: {
      primaryColor: '#4f46e5',
      accentColor: '#3b82f6',
      backgroundStyle: 'dark_glass',
      borderRadius: 'xl',
      logoUrl: '/images/logo/kimun-logo.png'
    },
    paymentConfig: {
      enabled: true,
      currency: 'INR',
      baseAmount: 1800,
      paymentGateway: 'razorpay',
      allowCouponCodes: true,
      dynamicPricingFieldId: 'delegate_type'
    },
    notificationConfig: {
      sendApplicantReceipt: true,
      receiptSubject: 'KIMUN 2025 Delegate Registration Confirmation',
      adminNotifyEmails: ['secgen@kimun.in', 'delegateaffairs@kimun.in'],
      enableWhatsAppAlerts: true
    },
    sections: [
      {
        id: 'sec_personal_details',
        title: 'Personal & Institutional Details',
        subtitle: 'Basic delegate background and contact credentials',
        icon: 'User',
        fields: [
          {
            id: 'full_name',
            type: 'text',
            label: 'Full Name',
            placeholder: 'e.g. John Doe',
            validation: { required: true, minLength: 2 },
            width: 'half'
          },
          {
            id: 'email',
            type: 'email',
            label: 'Email Address',
            placeholder: 'john.doe@example.com',
            validation: { required: true },
            width: 'half'
          },
          {
            id: 'phone',
            type: 'phone',
            label: 'WhatsApp Contact Number',
            placeholder: '+91 98765 43210',
            validation: { required: true },
            width: 'half'
          },
          {
            id: 'institution',
            type: 'text',
            label: 'Institution / College / University',
            placeholder: 'e.g. KIIT University',
            validation: { required: true },
            width: 'half'
          },
          {
            id: 'course_year',
            type: 'text',
            label: 'Degree & Year of Study',
            placeholder: 'e.g. B.Tech CSE (3rd Year)',
            width: 'half'
          },
          {
            id: 'city',
            type: 'text',
            label: 'City & State',
            placeholder: 'Bhubaneswar, Odisha',
            width: 'half'
          }
        ]
      },
      {
        id: 'sec_preferences',
        title: 'Committee & Portfolio Preferences',
        subtitle: 'Select your preferred council and delegation style',
        icon: 'Globe',
        fields: [
          {
            id: 'delegate_type',
            type: 'radio',
            label: 'Delegation Format',
            defaultValue: 'single',
            options: [
              { label: 'Single Delegate (1 Person)', value: 'single', priceDelta: 0 },
              { label: 'Double Delegation (2 Persons)', value: 'double', priceDelta: 1600, description: 'Requires co-delegate details' }
            ],
            validation: { required: true }
          },
          {
            id: 'co_delegate_name',
            type: 'text',
            label: 'Co-Delegate Full Name',
            placeholder: 'Enter partner name',
            conditionalLogic: { targetFieldId: 'delegate_type', operator: 'equals', value: 'double' },
            width: 'half'
          },
          {
            id: 'co_delegate_email',
            type: 'email',
            label: 'Co-Delegate Email Address',
            placeholder: 'partner@example.com',
            conditionalLogic: { targetFieldId: 'delegate_type', operator: 'equals', value: 'double' },
            width: 'half'
          },
          {
            id: 'committee_pref_1',
            type: 'select',
            label: 'First Committee Preference',
            options: [
              { label: 'UNSC - United Nations Security Council', value: 'UNSC' },
              { label: 'UNHRC - United Nations Human Rights Council', value: 'UNHRC' },
              { label: 'AIPPM - All India Political Parties Meet', value: 'AIPPM' },
              { label: 'ECOFIN - Economic and Financial Committee', value: 'ECOFIN' },
              { label: 'IP - International Press Corps', value: 'IP' }
            ],
            validation: { required: true }
          },
          {
            id: 'portfolio_pref_1',
            type: 'text',
            label: 'First Choice Country / Portfolio',
            placeholder: 'e.g. United States of America / Narendra Modi',
            validation: { required: true }
          },
          {
            id: 'mun_experience',
            type: 'textarea',
            label: 'Past MUN & Debate Experience',
            placeholder: 'Mention conferences attended, awards won, and committees participated in...',
            helperText: 'Helps Executive Board in matrix allocation prioritization.'
          }
        ]
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tpl_oc_application_2025',
    title: 'KIMUN 2025 Organizing Committee Application',
    slug: 'kimun-2025-oc-application',
    description: 'Apply for key leadership, logistical, and technical roles in the KIMUN Secretariat.',
    category: 'oc_recruitment',
    status: 'published',
    requireAuth: true,
    themeConfig: {
      primaryColor: '#2563eb',
      accentColor: '#1d4ed8',
      backgroundStyle: 'midnight_blue',
      borderRadius: 'xl'
    },
    notificationConfig: {
      sendApplicantReceipt: true,
      adminNotifyEmails: ['oc@kimun.in']
    },
    sections: [
      {
        id: 'sec_oc_personal',
        title: 'Applicant Profile',
        subtitle: 'Tell us about yourself and your background',
        fields: [
          { id: 'name', type: 'text', label: 'Full Name', validation: { required: true }, width: 'half' },
          { id: 'email', type: 'email', label: 'Email Address', validation: { required: true }, width: 'half' },
          { id: 'phone', type: 'phone', label: 'Phone Number', validation: { required: true }, width: 'half' },
          { id: 'roll_no', type: 'text', label: 'University Roll Number', validation: { required: true }, width: 'half' }
        ]
      },
      {
        id: 'sec_oc_department',
        title: 'Department Choice & Motivation',
        subtitle: 'Select your preferred field of contribution',
        fields: [
          {
            id: 'department_pref',
            type: 'select',
            label: 'Preferred Department',
            options: [
              { label: 'Business Relations & Corporate Strategy', value: 'Business Relations & Corporate Strategy' },
              { label: 'Operations & Infrastructure Logistics', value: 'Operations & Infrastructure Logistics' },
              { label: 'Delegate Affairs & Global Relations', value: 'Delegate Affairs & Global Relations' },
              { label: 'Design, Media & Digital Identity', value: 'Design, Media & Digital Identity' }
            ],
            validation: { required: true }
          },
          {
            id: 'sop',
            type: 'textarea',
            label: 'Statement of Purpose (SOP)',
            placeholder: 'Why are you the best fit for this department? Describe your past experience and skills...',
            validation: { required: true, minLength: 50 }
          },
          {
            id: 'resume_upload',
            type: 'file_upload',
            label: 'Resume / Portfolio (PDF)',
            helperText: 'Upload your latest CV or design portfolio link',
            validation: { acceptedFileTypes: ['.pdf', '.docx', 'image/*'] }
          }
        ]
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tpl_corporate_partner',
    title: 'Enterprise & Sponsor Partnership Inquiry',
    slug: 'partner-inquiry',
    description: 'Connect with KIMUN for corporate branding, campus recruitment, and summit partnerships.',
    category: 'corporate_event',
    status: 'published',
    themeConfig: {
      primaryColor: '#059669',
      accentColor: '#10b981',
      backgroundStyle: 'dark_glass',
      borderRadius: 'lg'
    },
    sections: [
      {
        id: 'sec_company_info',
        title: 'Company & Contact Details',
        fields: [
          { id: 'company_name', type: 'text', label: 'Company / Organization Name', validation: { required: true }, width: 'half' },
          { id: 'contact_person', type: 'text', label: 'Contact Person Name & Designation', validation: { required: true }, width: 'half' },
          { id: 'work_email', type: 'email', label: 'Official Business Email', validation: { required: true }, width: 'half' },
          { id: 'phone', type: 'phone', label: 'Direct Phone / WhatsApp', validation: { required: true }, width: 'half' },
          {
            id: 'partnership_type',
            type: 'multiselect',
            label: 'Partnership Interests',
            options: [
              { label: 'Title / Powered By Sponsor', value: 'title' },
              { label: 'Keynote Speaker & Workshop', value: 'speaker' },
              { label: 'Merchandise & Swag Partner', value: 'merchandise' },
              { label: 'Talent Acquisition & Recruiting', value: 'recruiting' }
            ]
          },
          { id: 'proposal_details', type: 'textarea', label: 'Objectives & Questions', placeholder: 'Share your ideas or goals for the partnership...' }
        ]
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]
