import { api } from '@/libs/core/api/axios';

export type ReportPeriod = '6 months' | '12 months';
export type ReportStatus = 'reporting' | 'received' | 'approved' | 'rejected' | 'pending';

export interface BusinessInfoForReport {
  id: string;
  name: string;
  taxCode: string;
  address: string;
  representativeName?: string;
  representativePhone?: string;
  email?: string;
  officePhone?: string;
  businessType?: { id: string; name: string };
  businessIndustry?: { id: string; name: string };
}

export interface ReportItem {
  id: string | null;
  configId?: string | null;
  configName?: string | null;
  year: number;
  period: ReportPeriod;
  status: ReportStatus;
  totalEmployees?: number;
  totalFemaleEmployees?: number;
  totalQuyLuong?: number;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  business?: {
    id?: string;
    name?: string;
    taxCode?: string;
    address?: string;
  };
  reportAccident?: any;
  reportDetailAccidents?: any[];
}

export interface MyReportsResponse {
  items: ReportItem[];
  total: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface SaveStep1Payload {
  reportId?: string;
  configId?: string;
  year: number;
  period: ReportPeriod;
  totalEmployees: number;
  totalFemaleEmployees: number;
  totalQuyLuong: number;
  businessId?: string;
}

export interface SaveStep2AccidentPayload {
  totalAccident?: number;
  totalAccidentDeath?: number;
  totalHumanInjuredMore2?: number;
  totalHumanInjured?: number;
  totalFemaleInjured?: number;
  totalHumanDeath?: number;
  totalHumanInjuredHeavy?: number;
  totalHumanInjuredNoQL?: number;
  totalFemaleInjuredNoQL?: number;
  totalHumanDeathNoQL?: number;
  totalHumanInjuredHeavyNoQL?: number;
  budgetMedical?: number;
  budgetSalary?: number;
  budgetHelp?: number;
  totalBudget?: number;
  totalDayOff?: number;
  totalThietHai?: number;
}

export interface ReportDetailItemPayload {
  nguyenNhanTaiNan: string;
  yeuToChanThuong: string;
  ngheNghiep: string;
  totalHumanInjured?: number;
  totalFemaleInjured?: number;
  totalHumanDeath?: number;
  totalHumanInjuredHeavy?: number;
  totalHumanInjuredNoQL?: number;
  totalFemaleInjuredNoQL?: number;
  totalHumanDeathNoQL?: number;
  totalHumanInjuredHeavyNoQL?: number;
  budgetMedical?: number;
  budgetSalary?: number;
  budgetHelp?: number;
  totalBudget?: number;
  totalDayOff?: number;
  totalThietHai?: number;
}

export interface SaveStep2DetailPayload {
  details: ReportDetailItemPayload[];
}

export interface ReportOverviewDetail {
  report: {
    id: string;
    year: number;
    period: ReportPeriod;
    status: ReportStatus;
    totalEmployees: number;
    totalFemaleEmployees: number;
    totalQuyLuong: number;
    createdAt?: string;
    updatedAt?: string;
  };
  business: {
    id: string;
    name: string;
    taxCode: string;
    email?: string;
    address?: string;
    registeredDistrict?: string;
    registeredProvince?: string;
    representativeName?: string;
    representativePhone?: string;
    businessType?: { id: string; code: string; name: string } | null;
    businessIndustry?: { id: string; code: string; name: string } | null;
  };
  accident?: SaveStep2AccidentPayload | null;
  accidentDetails?: ReportDetailItemPayload[];
  benefitAccident?: SaveStep2AccidentPayload | null;
}

export const reportApi = {
  // === DOANH NGHIỆP ===
  getBusinessInfo: (businessId?: string) =>
    api.get<any>('/reports/business-info', {
      params: businessId ? { businessId } : undefined,
    }),

  getMyReports: (params: { year?: number; period?: ReportPeriod; status?: ReportStatus; pageNumber?: number; pageSize?: number }) =>
    api.get<any>('/reports/my-reports', { params }),

  saveStep1: (payload: SaveStep1Payload) =>
    api.post<any>('/reports/step-1', payload),

  saveStep2Accident: (reportId: string, payload: SaveStep2AccidentPayload) =>
    api.post<any>(`/reports/${reportId}/step-2-accident`, payload),

  saveStep2Detail: (reportId: string, payload: SaveStep2DetailPayload) =>
    api.post<any>(`/reports/${reportId}/step-2-detail`, payload),

  saveStep3BenefitAccident: (reportId: string, payload: SaveStep2AccidentPayload) =>
    api.post<any>(`/reports/${reportId}/step-3-benefit-accident`, payload),

  getReportOverviewDetail: (reportId: string) =>
    api.get<any>(`/reports/${reportId}/overview-detail`),

  submitReport: (reportId: string) =>
    api.post<any>(`/reports/${reportId}/submit`),

  deleteReport: (reportId: string) =>
    api.delete<any>(`/reports/${reportId}`),

  // === ROLE SỞ (ADMIN) ===
  getReportsByYear: (params: {
    year: number;
    status?: ReportStatus;
    period?: ReportPeriod;
    search?: string;
    pageNumber?: number;
    pageSize?: number;
  }) =>
    api.get<any>('/reports/by-year', { params }),

  getOverview: (year: number, period?: ReportPeriod) =>
    api.get<any>('/reports/overview', { params: { year, period } }),

  getAccidentStatistics: (year: number, period?: ReportPeriod) =>
    api.get<any>('/reports/accident-statistics', { params: { year, period } }),

  // Cấu hình kỳ báo cáo
  getReportConfigs: (params?: {
    year?: number;
    period?: ReportPeriod;
    status?: boolean;
    search?: string;
    pageNumber?: number;
    pageSize?: number;
  }) => api.get<any>('/report-configs', { params }),

  getReportConfigById: (id: string) =>
    api.get<any>(`/report-configs/${id}`),

  createReportConfig: (payload: {
    year: number;
    period: ReportPeriod;
    name: string;
    dateStart: string;
    dateEnd: string;
    status?: boolean;
  }) => api.post<any>('/report-configs', payload),

  updateReportConfig: (
    id: string,
    payload: {
      name?: string;
      year?: number;
      period?: ReportPeriod;
      dateStart?: string;
      dateEnd?: string;
      status?: boolean;
    },
  ) => api.patch<any>(`/report-configs/${id}`, payload),

  updateReportConfigStatus: (id: string, status: boolean) =>
    api.patch<any>(`/report-configs/configs/${id}/status`, { status }),
};
