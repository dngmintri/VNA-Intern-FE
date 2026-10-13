export interface BusinessType {
  id: number;
  code: string;
  name: string;
  status: string;
}

export interface BusinessIndustry {
  id: number;
  code: string;
  name: string;
  level: string;
  parentId: number | null;
  status: string;
}

export interface Company {
  id: number;
  accountId: number;
  companyName: string;
  foreignCompanyName: string | null;
  taxCode: string;
  businessTypeId: number;
  businessIndustryId: number;
  licenseIssueDate: string | null;
  provinceDkkdId: number;
  wardDkkdId: number;
  addressDkkd: string | null;
  businessPhone: string | null;
  representativeName: string | null;
  representativePhone: string | null;
  provinceHdkdId: number | null;
  wardHdkdId: number | null;
  addressHdkd: string | null;
  gpkdFilePath: string | null;
  gtkFilePath: string | null;
  createdAt: string;
  updatedAt: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  businessType?: BusinessType;
  businessIndustry?: BusinessIndustry;
}

export interface CompanyProfile {
  taxCode: string;
  companyName: string;
  foreignCompanyName: string | null;
  licenseIssueDate: string | null;
  businessType: string | null;
  businessIndustry: string | null;
  email: string | null;
  status: string;
  provinceDKKD: string | null;
  wardDKKD: string | null;
  addressDKKD: string | null;
  provinceHDKD: string | null;
  wardHDKD: string | null;
  addressHDKD: string | null;
  representativeName: string | null;
  representativePhone: string | null;
  businessPhone: string | null;
  gpkdFile: string | null;
  gtkFile: string | null;
}

export interface CreateCompanyInput {
  business_name: string;
  tax_code: string;
  business_type: string;
  business_industry: string;
  license_issue_date: string | null;
  license_registration_province: string;
  license_registration_ward: string;
  license_registration_adress: string;
  foreign_business_name?: string;
  email: string;
  business_phone?: string;
  business_operating_province?: string;
  business_operating_ward?: string;
  business_operating_adress?: string;
  representative_name?: string;
  representative_phone?: string;
  business_license_file_url?: string | null;
  other_document_file_url?: string | null;
}
