// types/form-engine.ts

export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'file_upload'
  | 'rating'
  | 'committee_portfolio_picker'
  | 'department_picker'
  | 'payment_tier'
  | 'section_header'

export interface FormFieldOption {
  label: string
  value: string
  priceDelta?: number // Additional price if selected (e.g. Double Delegate +₹500)
  description?: string
  icon?: string
}

export interface ConditionalLogicRule {
  targetFieldId: string
  operator: 'equals' | 'not_equals' | 'contains' | 'is_empty' | 'is_not_empty' | 'greater_than' | 'less_than'
  value: any
}

export interface FormFieldValidation {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string // Regex pattern
  acceptedFileTypes?: string[] // e.g. ['image/*', '.pdf', '.docx']
  maxFileSizeMb?: number
  customErrorMessage?: string
}

export interface FormField {
  id: string
  type: FormFieldType
  label: string
  placeholder?: string
  helperText?: string
  defaultValue?: any
  validation?: FormFieldValidation
  options?: FormFieldOption[]
  conditionalLogic?: ConditionalLogicRule
  width?: 'full' | 'half' | 'third'
  icon?: string
}

export interface FormSection {
  id: string
  title: string
  subtitle?: string
  icon?: string
  fields: FormField[]
}

export interface FormPaymentConfig {
  enabled: boolean
  currency: 'INR' | 'USD' | 'EUR' | 'GBP'
  baseAmount: number
  paymentGateway: 'razorpay' | 'cashfree' | 'stripe' | 'manual_upi'
  upiId?: string
  upiName?: string
  dynamicPricingFieldId?: string // Field ID that modifies the total price
  allowCouponCodes?: boolean
}

export interface FormThemeConfig {
  primaryColor: string // Hex or Tailwind class
  accentColor?: string
  backgroundStyle: 'dark_glass' | 'luxury_light' | 'midnight_blue' | 'gradient_sunset'
  borderRadius: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  logoUrl?: string
  coverImageUrl?: string
  fontFamily?: string
}

export interface FormNotificationConfig {
  sendApplicantReceipt: boolean
  receiptSubject?: string
  adminNotifyEmails: string[]
  enableWhatsAppAlerts?: boolean
  webhookUrl?: string
}

export interface FormSchema {
  id: string
  organizationId?: string
  organizationName?: string
  title: string
  slug: string
  description?: string
  category?: 'mun_registration' | 'oc_recruitment' | 'eb_application' | 'corporate_event' | 'hiring' | 'survey' | 'custom'
  status: 'draft' | 'published' | 'archived'
  requireAuth?: boolean
  allowMultipleSubmissions?: boolean
  submissionLimit?: number
  deadline?: string
  sections: FormSection[]
  paymentConfig?: FormPaymentConfig
  themeConfig?: FormThemeConfig
  notificationConfig?: FormNotificationConfig
  createdAt: string
  updatedAt: string
  createdBy?: string
}

export interface FormSubmission {
  id: string
  formId: string
  formSlug: string
  organizationId?: string
  userId?: string
  userEmail?: string
  userName?: string
  userPhone?: string
  responses: Record<string, any>
  paymentStatus?: 'pending' | 'captured' | 'failed' | 'waived' | 'none'
  paymentId?: string
  paymentAmount?: number
  currency?: string
  createdAt: string
  updatedAt?: string
  status?: 'pending' | 'review' | 'shortlisted' | 'accepted' | 'rejected' | 'completed'
  notes?: string
}
