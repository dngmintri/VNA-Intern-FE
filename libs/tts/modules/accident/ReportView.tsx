'use client';

import React, { useState, useEffect, JSX } from 'react';
import { api } from '@/libs/core/api/axios';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/libs/tts/store/auth.store';
import { decodeJwt } from '@/libs/shared/utils/jwt';
import { ReportData, ReportSheet, ReportStatistic } from '@/libs/tts/modules/accident/components/ReportSheet';
import { useParams } from "next/navigation";
import { reportApi, ReportPeriod } from '@/libs/tts/modules/accident/services/report.api';
interface WizardProps {
  reportId: string | number;
}

interface CompanyInfo {
  totalEmployees: number;
  totalFemaleEmployees: number;
  totalSalaryFund: string;
  name: string;
  type: string;
  industry: string;
}

interface StatisticData {
  totalIncidents: number;
  incidentsWithFatalities: number;
  incidentsWithMultipleVictims: number;
  totalVictims: number;
  totalFemaleVictims: number;
  totalFatalities: number;
  totalSevereInjuries: number;
  unmanagedVictims: number;
  unmanagedFemaleVictims: number;
  unmanagedFatalities: number;
  unmanagedSevereInjuries: number;
  medicalCosts: string;
  treatmentSalaryCosts: string;
  compensationCosts: string;
  totalCosts: string;
  totalDaysOff: number;
  propertyDamage: string;
}

interface GeneralDetails {
  causeId: string;
  factorId: string;
  professionId: string;
}

interface FormDataState {
  companyInfo: CompanyInfo;
  generalStatistic: StatisticData;
  generalDetails: DetailItem[];
  subsidizedStatistic: StatisticData;
  subsidizedDetails: DetailItem[]; 
}

interface CompanyProfileResponse {
  taxCode: string;
  companyName: string;
  businessType: string | null;
  businessIndustry: string | null;
}

interface AccidentDetailPayload {
  accidentCauseId?: number;
  injuryFactorId?: number;
  professionId?: number;

  totalVictims?: number;
  totalFemaleVictims?: number;
  totalFatalities?: number;
  totalSevereInjuries?: number;

  unmanagedVictims?: number;
  unmanagedFemaleVictims?: number;
  unmanagedFatalities?: number;
  unmanagedSevereInjuries?: number;

  medicalCosts?: string | number;
  treatmentSalaryCosts?: string | number;
  compensationCosts?: string | number;
  totalCosts?: string | number;
  totalDaysOff?: number;
  propertyDamage?: string | number;
}
interface StatisticPayload {
  reportCategory?: string;
  totalIncidents?: number;
  incidentsWithFatalities?: number;
  incidentsWithMultipleVictims?: number;
  totalVictims?: number;
  totalFemaleVictims?: number;
  totalFatalities?: number;
  totalSevereInjuries?: number;
  unmanagedVictims?: number;
  unmanagedFemaleVictims?: number;
  unmanagedFatalities?: number;
  unmanagedSevereInjuries?: number;
  medicalCosts?: string | number;
  treatmentSalaryCosts?: string | number;
  compensationCosts?: string | number;
  totalCosts?: string | number;
  totalDaysOff?: number;
  propertyDamage?: string | number;
  accidentDetails?: AccidentDetailPayload[];
}

interface JwtDecoded {
  username?: string;
}

interface FormErrorsState {
  femaleEmployees?: string;
  incidentsWithFatalities?: string;
  incidentsWithMultipleVictims?: string;
  totalFemaleVictims?: string;
  totalFatalities?: string;
  totalSevereInjuries?: string;
  unmanagedVictims?: string;
  unmanagedFemaleVictims?: string;
  unmanagedFatalities?: string;
  unmanagedSevereInjuries?: string;
  totalIncidents?: string;
}
interface CategoryItem {
  id: number;
  code: string;
  name: string;
  level?: string;
  status?: boolean;
  parentId?: number;
  causeGroup?: 'EMPLOYER' | 'EMPLOYEE' | 'OTHER';
  children?: CategoryItem[];
}

interface DetailItem {
  causeId: string;
  factorId: string;
  professionId: string;

  totalVictims: number;
  totalFemaleVictims: number;
  totalFatalities: number;
  totalSevereInjuries: number;
  totalIncidents: number;

  unmanagedVictims: number;
  unmanagedFemaleVictims: number;
  unmanagedFatalities: number;
  unmanagedSevereInjuries: number;

  medicalCosts: string;
  treatmentSalaryCosts: string;
  compensationCosts: string;
  totalCosts: string;
  totalDaysOff: number;
  propertyDamage: string;
}

const formatMoneyInput = (value: string | number): string => {
  if (value === null || value === undefined || value === '') return '';
  let str = String(value).trim();

  // Loại bỏ phần thập phân .00 từ chuỗi trả về của Database (PostgreSQL numeric dạng "10000000.00")
  if (/^\d+\.\d{1,2}$/.test(str)) {
    str = str.split('.')[0];
  }

  let digits = str.replace(/\D/g, '');
  if (!digits) return '';
  // Bỏ các số 0 vô nghĩa ở đầu (ví dụ: '010' -> '10', '00' -> '0')
  digits = digits.replace(/^0+(?=\d)/, '');
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const parseMoneyToFloat = (value: string): number => {
  if (!value) return 0;
  const cleanValue = value.replace(/\./g, '').replace(/,/g, '.');
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
};

const formatFloatToVNDString = (value: number): string => {
  if (!value && value !== 0) return '';
  const fixedValue = Number(value.toFixed(2)); 
  const parts = fixedValue.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return parts.join(',');
};

const cleanIntegerString = (value: string): number => {
  const clean = value.replace(/[^0-9]/g, '');
  return clean ? parseInt(clean, 10) : 0;
};
const renderTreeOptions = (
  items: CategoryItem[],
  depth = 0
): React.ReactNode[] => {
  return items.flatMap((item) => [
    <option
      key={item.id}
      value={item.id.toString()}
    >
      {'—'.repeat(depth)}
      {depth > 0 ? ' ' : ''}
      {item.code} - {item.name}
    </option>,

    ...(item.children
      ? renderTreeOptions(
          item.children,
          depth + 1
        )
      : []),
  ]);
};
export const ReportView: React.FC<WizardProps> = ({ reportId }) => {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [reportYear, setReportYear] = useState<string>('2022');
  const [showCancelWarning, setShowCancelWarning] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrorsState>({});
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const params = useParams();
  const [periodName, setPeriodName] = useState<string>('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
const [previewUrl, setPreviewUrl] = useState("");
const [isPreviewLoading, setIsPreviewLoading] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailErrors, setDetailErrors] = useState<
  Record<number, Partial<Record<keyof DetailItem, string>>>
>({});
const [categories, setCategories] = useState<{
  causes: CategoryItem[];
  factors: CategoryItem[];
  professions: CategoryItem[];
}>({
  causes: [],
  factors: [],
  professions: [],
});
const [formData, setFormData] = useState<FormDataState>({
  companyInfo: {
    name: '',
    type: '',
    industry: '',
    totalEmployees: 0,
    totalFemaleEmployees: 0,
    totalSalaryFund: '',
  },

  generalStatistic: {
    totalIncidents: 0,
    incidentsWithFatalities: 0,
    incidentsWithMultipleVictims: 0,
    totalVictims: 0,
    totalFemaleVictims: 0,
    totalFatalities: 0,
    totalSevereInjuries: 0,
    unmanagedVictims: 0,
    unmanagedFemaleVictims: 0,
    unmanagedFatalities: 0,
    unmanagedSevereInjuries: 0,
    medicalCosts: '',
    treatmentSalaryCosts: '',
    compensationCosts: '',
    totalCosts: '',
    totalDaysOff: 0,
    propertyDamage: '',
  },

  generalDetails: [
    {
      causeId: '1',
      factorId: '1',
      professionId: '1',

      totalIncidents: 0,
      totalVictims: 0,
      totalFemaleVictims: 0,
      totalFatalities: 0,
      totalSevereInjuries: 0,

      unmanagedVictims: 0,
      unmanagedFemaleVictims: 0,
      unmanagedFatalities: 0,
      unmanagedSevereInjuries: 0,

      medicalCosts: '',
      treatmentSalaryCosts: '',
      compensationCosts: '',
      totalCosts: '',
      totalDaysOff: 0,
      propertyDamage: '',
    },
  ],

  subsidizedStatistic: {
    totalIncidents: 0,
    incidentsWithFatalities: 0,
    incidentsWithMultipleVictims: 0,
    totalVictims: 0,
    totalFemaleVictims: 0,
    totalFatalities: 0,
    totalSevereInjuries: 0,
    unmanagedVictims: 0,
    unmanagedFemaleVictims: 0,
    unmanagedFatalities: 0,
    unmanagedSevereInjuries: 0,
    medicalCosts: '',
    treatmentSalaryCosts: '',
    compensationCosts: '',
    totalCosts: '',
    totalDaysOff: 0,
    propertyDamage: '',
  },

  subsidizedDetails: [
    {
      causeId: '1',
      factorId: '1',
      professionId: '1',

      totalIncidents: 0,
      totalVictims: 0,
      totalFemaleVictims: 0,
      totalFatalities: 0,
      totalSevereInjuries: 0,

      unmanagedVictims: 0,
      unmanagedFemaleVictims: 0,
      unmanagedFatalities: 0,
      unmanagedSevereInjuries: 0,

      medicalCosts: '',
      treatmentSalaryCosts: '',
      compensationCosts: '',
      totalCosts: '',
      totalDaysOff: 0,
      propertyDamage: '',
    },
  ],
});

const DEFAULT_CAUSES: CategoryItem[] = [
  { id: 1, code: 'thiet_bi_an_toan', name: 'Không có thiết bị an toàn hoặc thiết bị không đảm bảo an toàn' },
  { id: 2, code: 'phuong_tien_bao_ve', name: 'Không có phương tiện bảo vệ cá nhân hoặc phương tiện bảo vệ cá nhân không tốt' },
  { id: 3, code: 'to_chuc_lao_dong', name: 'Tổ chức lao động không hợp lí' },
  { id: 4, code: 'chua_huan_luyen', name: 'Chưa huấn luyện hoặc huấn luyện an toàn vệ sinh lao động chưa đầy đủ' },
  { id: 5, code: 'thieu_quy_trinh_an_toan', name: 'Không có quy trình an toàn hoặc biện pháp làm việc an toàn' },
  { id: 6, code: 'dieu_kien_lam_viec', name: 'Điều kiện làm việc không tốt' },
  { id: 7, code: 'vi_pham_noi_quy', name: 'Vi phạm nội quy, quy trình, quy chuẩn, biện pháp làm việc an toàn' },
  { id: 8, code: 'khong_su_dung_bao_ho', name: 'Không sử dụng phương tiện bảo vệ cá nhân' },
  { id: 9, code: 'nguyen_nhan_khach_quan', name: 'Khách quan khó tránh, nguyên nhân chưa kể đến' },
];

const DEFAULT_FACTORS: CategoryItem[] = [
  { id: 1, code: '1', name: 'Thiết bị nâng' },
  { id: 2, code: '2', name: 'Dây cáp/xích' },
  { id: 3, code: '3', name: 'Xe nâng/phương tiện vận chuyển' },
  { id: 4, code: '4', name: 'Máy cơ khí/chế biến gỗ' },
  { id: 5, code: '5', name: 'Điện/nhiệt' },
  { id: 6, code: '6', name: 'Hóa chất độc hại' },
  { id: 7, code: '7', name: 'Rơi ngã từ trên cao' },
  { id: 8, code: '8', name: 'Sạt lở đất/đá' },
  { id: 9, code: '9', name: 'Các yếu tố khác' },
];

const DEFAULT_PROFESSIONS: CategoryItem[] = [
  { id: 1111, code: '1111', level: 'Cấp 4', name: 'Nhà lãnh đạo cơ quan Đảng Cộng sản Việt nam cấp Trung ương' },
  { id: 1112, code: '1112', level: 'Cấp 4', name: 'Nhà lãnh đạo cơ quan Đảng Cộng sản Việt Nam cấp tỉnh, thành phố' },
  { id: 1113, code: '1113', level: 'Cấp 4', name: 'Nhà lãnh đạo cơ quan Đảng Cộng sản Việt Nam cấp quận, huyện' },
  { id: 1114, code: '1114', level: 'Cấp 4', name: 'Nhà lãnh đạo cơ quan Đảng Cộng sản Việt Nam cấp xã, phường' },
  { id: 1121, code: '1121', level: 'Cấp 4', name: 'Lãnh đạo các cơ quan Nhà nước cấp Trung ương' },
  { id: 1122, code: '1122', level: 'Cấp 4', name: 'Lãnh đạo các cơ quan Nhà nước cấp tỉnh, thành phố' },
  { id: 1211, code: '1211', level: 'Cấp 4', name: 'Giám đốc điều hành, tổng giám đốc doanh nghiệp' },
  { id: 1219, code: '1219', level: 'Cấp 4', name: 'Giám đốc chiến lược và kế hoạch doanh nghiệp' },
  { id: 1221, code: '1221', level: 'Cấp 4', name: 'Giám đốc bán hàng và tiếp thị' },
  { id: 1321, code: '1321', level: 'Cấp 4', name: 'Giám đốc sản xuất, chế tạo và khai khoáng' },
  { id: 1323, code: '1323', level: 'Cấp 4', name: 'Giám đốc thi công xây dựng' },
  { id: 2141, code: '2141', level: 'Cấp 4', name: 'Kỹ sư công nghiệp và chế tạo máy' },
  { id: 2142, code: '2142', level: 'Cấp 4', name: 'Kỹ sư xây dựng công trình' },
  { id: 2144, code: '2144', level: 'Cấp 4', name: 'Kỹ sư cơ khí' },
  { id: 2151, code: '2151', level: 'Cấp 4', name: 'Kỹ sư điện, điện tử' },
  { id: 2511, code: '2511', level: 'Cấp 4', name: 'Kỹ sư hệ thống và phần mềm máy tính' },
  { id: 3112, code: '3112', level: 'Cấp 4', name: 'Kỹ thuật viên xây dựng công trình' },
  { id: 3115, code: '3115', level: 'Cấp 4', name: 'Kỹ thuật viên cơ khí và lắp ráp máy' },
  { id: 3118, code: '3118', level: 'Cấp 4', name: 'Kỹ thuật viên an toàn lao động' },
  { id: 7112, code: '7112', level: 'Cấp 4', name: 'Thợ xây dựng gạch, đá và hoàn thiện công trình' },
  { id: 7114, code: '7114', level: 'Cấp 4', name: 'Thợ làm việc với bê tông và thợ cốp pha' },
  { id: 7212, code: '7212', level: 'Cấp 4', name: 'Thợ hàn và thợ cắt kim loại' },
  { id: 7214, code: '7214', level: 'Cấp 4', name: 'Thợ lắp dựng kết cấu kim loại' },
  { id: 7223, code: '7223', level: 'Cấp 4', name: 'Thợ chế tạo và vận hành máy công cụ' },
  { id: 7233, code: '7233', level: 'Cấp 4', name: 'Thợ sửa chữa máy móc nông nghiệp và công nghiệp' },
  { id: 7411, code: '7411', level: 'Cấp 4', name: 'Thợ điện công trình' },
  { id: 7412, code: '7412', level: 'Cấp 4', name: 'Thợ cơ điện và sửa chữa thiết bị điện' },
  { id: 8331, code: '8331', level: 'Cấp 4', name: 'Người vận hành thiết bị nặng và máy nâng' },
  { id: 8332, code: '8332', level: 'Cấp 4', name: 'Người lái xe tải nặng và phương tiện cơ giới' },
  { id: 8343, code: '8343', level: 'Cấp 4', name: 'Người vận hành cẩu, tời và các thiết bị nâng hạ' },
  { id: 9312, code: '9312', level: 'Cấp 4', name: 'Lao động giản đơn trong ngành xây dựng' },
  { id: 9329, code: '9329', level: 'Cấp 4', name: 'Lao động giản đơn trong ngành chế biến, chế tạo' },
  { id: 9999, code: '9999', level: 'Cấp 4', name: 'Nghề nghiệp khác' },
];

useEffect(() => {
  const fetchAllData = async () => {
    try {
      setIsLoading(true);

      const decoded = accessToken ? (decodeJwt(accessToken) as JwtDecoded) : null;
      const taxCode = decoded?.username || "";

      const [profileRes, reportRes] = await Promise.all([
        taxCode
          ? api.get<{ data: CompanyProfileResponse }>(
              `/company/${taxCode}/company-profile`
            ).catch(() => null)
          : null,
        reportApi.getReportOverviewDetail(String(reportId)).catch(() => null),
      ]);

      const res = reportRes?.data?.data || reportRes?.data || {};
      const report = res.report || {};
      const business = res.business || {};
      const accident = res.accident || {};
      const accidentDetails = Array.isArray(res.accidentDetails) ? res.accidentDetails : [];
      const benefitAccident = res.benefitAccident || {};

      const pName = report.period === '12 months' ? 'Cả năm' : '6 tháng';
      setPeriodName(pName);
      if (report.year) {
        setReportYear(report.year.toString());
      }

      const rawAttachUrl = report.attachmentUrl || report.attachment_url || res.attachmentUrl || res.attachment_url;
      const rawAttachName = report.attachmentName || report.attachment_name || res.attachmentName || res.attachment_name;

      if (rawAttachUrl) {
        const normalizedUrl = String(rawAttachUrl).replace(/\\/g, '/');
        const fullUrl = normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://')
          ? normalizedUrl
          : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${normalizedUrl.startsWith('/') ? '' : '/'}${normalizedUrl}`;
        setFileUrl(fullUrl);
        setSelectedFileName(rawAttachName || 'Bao_cao_dinh_kem.pdf');
      }

      const mapDetail = (detail: any): DetailItem => {
        let cId = detail.nguyenNhanTaiNan || detail.accidentCauseId?.toString() || "";
        const matchedCause = DEFAULT_CAUSES.find(c => String(c.id) === String(cId) || c.code === String(cId));
        if (matchedCause) cId = matchedCause.code;

        let fId = detail.yeuToChanThuong || detail.injuryFactorId?.toString() || "";
        const matchedFactor = DEFAULT_FACTORS.find(f => String(f.id) === String(fId) || f.code === String(fId) || f.name.toLowerCase() === String(fId).toLowerCase());
        if (matchedFactor) fId = matchedFactor.name;

        let pId = detail.ngheNghiep || detail.professionId?.toString() || "";
        const matchedProfession = DEFAULT_PROFESSIONS.find(p => String(p.id) === String(pId) || p.code === String(pId) || p.name.toLowerCase() === String(pId).toLowerCase());
        if (matchedProfession) pId = matchedProfession.name;

        return {
          causeId: cId,
          factorId: fId,
          professionId: pId,

          totalIncidents: 1,
          totalVictims: Number(detail.totalHumanInjured) || Number(detail.totalVictims) || 0,
          totalFemaleVictims: Number(detail.totalFemaleInjured) || Number(detail.totalFemaleVictims) || 0,
          totalFatalities: Number(detail.totalHumanDeath) || Number(detail.totalFatalities) || 0,
          totalSevereInjuries: Number(detail.totalHumanInjuredHeavy) || Number(detail.totalSevereInjuries) || 0,

          unmanagedVictims: Number(detail.totalHumanInjuredNoQL) || Number(detail.unmanagedVictims) || 0,
          unmanagedFemaleVictims: Number(detail.totalFemaleInjuredNoQL) || Number(detail.unmanagedFemaleVictims) || 0,
          unmanagedFatalities: Number(detail.totalHumanDeathNoQL) || Number(detail.unmanagedFatalities) || 0,
          unmanagedSevereInjuries: Number(detail.totalHumanInjuredHeavyNoQL) || Number(detail.unmanagedSevereInjuries) || 0,

          medicalCosts:
            (detail.budgetMedical || detail.medicalCosts) && Number(detail.budgetMedical || detail.medicalCosts) !== 0
              ? formatMoneyInput(String(detail.budgetMedical || detail.medicalCosts))
              : "",

          treatmentSalaryCosts:
            (detail.budgetSalary || detail.treatmentSalaryCosts) && Number(detail.budgetSalary || detail.treatmentSalaryCosts) !== 0
              ? formatMoneyInput(String(detail.budgetSalary || detail.treatmentSalaryCosts))
              : "",

          compensationCosts:
            (detail.budgetHelp || detail.compensationCosts) && Number(detail.budgetHelp || detail.compensationCosts) !== 0
              ? formatMoneyInput(String(detail.budgetHelp || detail.compensationCosts))
              : "",

          totalCosts:
            (detail.totalBudget || detail.totalCosts) && Number(detail.totalBudget || detail.totalCosts) !== 0
              ? formatMoneyInput(String(detail.totalBudget || detail.totalCosts))
              : "",

          totalDaysOff: Number(detail.totalDayOff) || Number(detail.totalDaysOff) || 0,

          propertyDamage:
            (detail.totalThietHai || detail.propertyDamage) && Number(detail.totalThietHai || detail.propertyDamage) !== 0
              ? formatMoneyInput(String(detail.totalThietHai || detail.propertyDamage))
              : "",
        };
      };

      setFormData({
        companyInfo: {
          name:
            business.name ||
            profileRes?.data?.data?.companyName ||
            "Chưa cập nhật tên doanh nghiệp",
          type:
            business.businessType?.name ||
            profileRes?.data?.data?.businessType ||
            "Chưa cập nhật loại hình",
          industry:
            business.businessIndustry?.name ||
            profileRes?.data?.data?.businessIndustry ||
            "Chưa cập nhật ngành nghề",

          totalEmployees: report.totalEmployees || 0,
          totalFemaleEmployees: report.totalFemaleEmployees || 0,

          totalSalaryFund:
            report.totalQuyLuong && Number(report.totalQuyLuong) !== 0
              ? formatMoneyInput(report.totalQuyLuong.toString())
              : "",
        },

        generalStatistic: {
          totalIncidents: Number(accident.totalAccident) || 0,
          incidentsWithFatalities: Number(accident.totalAccidentDeath) || 0,
          incidentsWithMultipleVictims: Number(accident.totalHumanInjuredMore2) || 0,
          totalVictims: Number(accident.totalHumanInjured) || 0,
          totalFemaleVictims: Number(accident.totalFemaleInjured) || 0,
          totalFatalities: Number(accident.totalHumanDeath) || 0,
          totalSevereInjuries: Number(accident.totalHumanInjuredHeavy) || 0,
          unmanagedVictims: Number(accident.totalHumanInjuredNoQL) || 0,
          unmanagedFemaleVictims: Number(accident.totalFemaleInjuredNoQL) || 0,
          unmanagedFatalities: Number(accident.totalHumanDeathNoQL) || 0,
          unmanagedSevereInjuries: Number(accident.totalHumanInjuredHeavyNoQL) || 0,

          medicalCosts:
            accident.budgetMedical && Number(accident.budgetMedical) !== 0
              ? formatMoneyInput(String(accident.budgetMedical))
              : "",

          treatmentSalaryCosts:
            accident.budgetSalary && Number(accident.budgetSalary) !== 0
              ? formatMoneyInput(String(accident.budgetSalary))
              : "",

          compensationCosts:
            accident.budgetHelp && Number(accident.budgetHelp) !== 0
              ? formatMoneyInput(String(accident.budgetHelp))
              : "",

          totalCosts:
            accident.totalBudget && Number(accident.totalBudget) !== 0
              ? formatMoneyInput(String(accident.totalBudget))
              : "",

          totalDaysOff: Number(accident.totalDayOff) || 0,

          propertyDamage:
            accident.totalThietHai && Number(accident.totalThietHai) !== 0
              ? formatMoneyInput(String(accident.totalThietHai))
              : "",
        },

        generalDetails: accidentDetails.map(mapDetail),

        subsidizedStatistic: {
          totalIncidents: Number(benefitAccident.totalAccident) || 0,
          incidentsWithFatalities: Number(benefitAccident.totalAccidentDeath) || 0,
          incidentsWithMultipleVictims: Number(benefitAccident.totalHumanInjuredMore2) || 0,
          totalVictims: Number(benefitAccident.totalHumanInjured) || 0,
          totalFemaleVictims: Number(benefitAccident.totalFemaleInjured) || 0,
          totalFatalities: Number(benefitAccident.totalHumanDeath) || 0,
          totalSevereInjuries: Number(benefitAccident.totalHumanInjuredHeavy) || 0,
          unmanagedVictims: Number(benefitAccident.totalHumanInjuredNoQL) || 0,
          unmanagedFemaleVictims: Number(benefitAccident.totalFemaleInjuredNoQL) || 0,
          unmanagedFatalities: Number(benefitAccident.totalHumanDeathNoQL) || 0,
          unmanagedSevereInjuries: Number(benefitAccident.totalHumanInjuredHeavyNoQL) || 0,

          medicalCosts:
            benefitAccident.budgetMedical && Number(benefitAccident.budgetMedical) !== 0
              ? formatMoneyInput(String(benefitAccident.budgetMedical))
              : "",

          treatmentSalaryCosts:
            benefitAccident.budgetSalary && Number(benefitAccident.budgetSalary) !== 0
              ? formatMoneyInput(String(benefitAccident.budgetSalary))
              : "",

          compensationCosts:
            benefitAccident.budgetHelp && Number(benefitAccident.budgetHelp) !== 0
              ? formatMoneyInput(String(benefitAccident.budgetHelp))
              : "",

          totalCosts:
            benefitAccident.totalBudget && Number(benefitAccident.totalBudget) !== 0
              ? formatMoneyInput(String(benefitAccident.totalBudget))
              : "",

          totalDaysOff: Number(benefitAccident.totalDayOff) || 0,

          propertyDamage:
            benefitAccident.totalThietHai && Number(benefitAccident.totalThietHai) !== 0
              ? formatMoneyInput(String(benefitAccident.totalThietHai))
              : "",
        },

        subsidizedDetails: [],
      });
    } catch (error) {
      console.error("Lỗi đồng bộ dữ liệu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  fetchAllData();
}, [reportId, accessToken]);

useEffect(() => {
  const fetchCategories = async () => {
    try {
      const [c, f, p] = await Promise.allSettled([
        api.get<CategoryItem[]>('/category/accident-cause'),
        api.get<CategoryItem[]>('/category/injury-factor'),
        api.get<CategoryItem[]>('/category/profession'),
      ]);

      const causes = c.status === 'fulfilled' && Array.isArray(c.value.data) && c.value.data.length > 0 ? c.value.data : DEFAULT_CAUSES;
      const factors = f.status === 'fulfilled' && Array.isArray(f.value.data) && f.value.data.length > 0 ? f.value.data : DEFAULT_FACTORS;
      const professions = p.status === 'fulfilled' && Array.isArray(p.value.data) && p.value.data.length > 0 ? p.value.data : DEFAULT_PROFESSIONS;

      setCategories({ causes, factors, professions });
    } catch {
      setCategories({
        causes: DEFAULT_CAUSES,
        factors: DEFAULT_FACTORS,
        professions: DEFAULT_PROFESSIONS,
      });
    }
  };
  fetchCategories();
}, []);
  useEffect(() => {
    const count = formData.generalStatistic.totalIncidents;
    if (formData.generalDetails.length !== count) {
      setFormData(prev => ({
        ...prev,
        generalDetails: Array.from({ length: Math.max(1, count) }, (_, i) => 
          prev.generalDetails[i] ?? {
            causeId: '',
            factorId: '',
            professionId: '',
            totalIncidents: 0,
            totalVictims: 0,
            medicalCosts: '',
            treatmentSalaryCosts: '',
            compensationCosts: '',
            totalCosts: '',
            totalDaysOff: 0,
            propertyDamage: '',
            }
        )
      }));
    }
  }, [formData.generalStatistic.totalIncidents]);

    const causeGroupMap: Record<string, string> = {
        EMPLOYER: 'Người sử dụng lao động',
        EMPLOYEE: 'Người lao động',
        OTHER: 'Khác',
    };

    const getTotalVictims = (
    details: DetailItem[]
    ) =>
    details.reduce(
        (sum, d) => sum + Number(d.totalVictims || 0),
        0
    );

    const validateDetail = (
    detail: DetailItem,
    ): Partial<Record<keyof DetailItem, string>> => {
    const errors: Partial<Record<keyof DetailItem, string>> = {};

    const totalVictims = Number(detail.totalVictims || 0);
    const femaleVictims = Number(detail.totalFemaleVictims || 0);
    const fatalities = Number(detail.totalFatalities || 0);
    const severeInjuries = Number(detail.totalSevereInjuries || 0);

    const unmanagedVictims = Number(detail.unmanagedVictims || 0);
    const unmanagedFemaleVictims = Number(detail.unmanagedFemaleVictims || 0);
    const unmanagedFatalities = Number(detail.unmanagedFatalities || 0);
    const unmanagedSevere = Number(detail.unmanagedSevereInjuries || 0);

    

    if (femaleVictims > totalVictims) {
        errors.totalFemaleVictims =
        'Số lao động nữ bị nạn không được lớn hơn tổng số người bị nạn';
    }

    if (fatalities > totalVictims) {
        errors.totalFatalities =
        'Số người chết không được lớn hơn tổng số người bị nạn';
    }

    if (severeInjuries > totalVictims) {
        errors.totalSevereInjuries =
        'Số người bị thương nặng không được lớn hơn tổng số người bị nạn';
    }


    if (unmanagedFemaleVictims > unmanagedVictims) {
        errors.unmanagedFemaleVictims =
        'Số lao động nữ bị nạn không quản lý không được lớn hơn tổng số người bị nạn không quản lý';
    }

    if (unmanagedFatalities > unmanagedVictims) {
        errors.unmanagedFatalities =
        'Số người chết không quản lý không được lớn hơn tổng số người bị nạn không quản lý';
    }

    if (unmanagedSevere > unmanagedVictims) {
        errors.unmanagedSevereInjuries =
        'Số người bị thương nặng không quản lý không được lớn hơn tổng số người bị nạn không quản lý';
    }
    if (unmanagedFemaleVictims > femaleVictims) {
        errors.unmanagedFemaleVictims = 'Số lao động nữ không QL không được lớn hơn tổng số lao động nữ bị nạn!';
    }
    if (unmanagedFatalities > fatalities) {
        errors.unmanagedFatalities = 'Số người chết không QL không được lớn hơn tổng số người chết!';
    }
    if (unmanagedSevere > severeInjuries) {
        errors.unmanagedSevereInjuries = 'Số người bị thương nặng không QL không được lớn hơn tổng số người bị thương nặng!';
    }
    return errors;
    };

    const renderAccidentCauseOptions = (
    items: CategoryItem[]
    ) => {
    return items.map((item) => (
        <option
        key={item.id}
        value={item.code || item.id.toString()}
        >
        {item.name}
        </option>
    ));
    };

    const level4Professions = categories.professions.filter(
        p => p.level === '4'
        );
    
const updateDetail = <K extends keyof DetailItem>(index: number, key: K, value: DetailItem[K]) => {
  setFormData((prev) => {
    const newDetails = [...prev.generalDetails];
    newDetails[index] = { ...newDetails[index], [key]: value };

    if (['medicalCosts', 'treatmentSalaryCosts', 'compensationCosts'].includes(key as string)) {
        const d = newDetails[index];
        const sum = parseMoneyToFloat(d.medicalCosts) + parseMoneyToFloat(d.treatmentSalaryCosts) + parseMoneyToFloat(d.compensationCosts);
        newDetails[index].totalCosts = formatFloatToVNDString(sum);
    }

    const allErrors = validateStep3Summary(newDetails, prev.generalStatistic);
    
    newDetails.forEach((detail, i) => {
      const internalError = validateDetail(detail);
      allErrors[i] = { ...(allErrors[i] || {}), ...internalError };
    });

    setDetailErrors(allErrors);
    return { ...prev, generalDetails: newDetails };
  });
};

        const renderCategoryOptions = (
            items: CategoryItem[],
            parentId: number | null = null,
            depth = 0
            ): React.ReactNode[] => {
            return items
                .filter((item) => item.parentId === parentId && item.status)
                .sort((a, b) => a.code.localeCompare(b.code))
                .flatMap((item) => [
                <option key={item.id} value={item.id.toString()}>
                    {'—'.repeat(depth)}
                    {depth > 0 ? ' ' : ''}
                    {item.code} - {item.name}
                </option>,

                ...renderCategoryOptions(items, item.id, depth + 1),
                ]);
            };
        const hasValidationErrors = () => {
        return (
            Object.values(errors).some(Boolean) ||
            Object.values(detailErrors).some(
            (e) => Object.keys(e || {}).length > 0
            )
        );
        };

    const validateAllDetailTotals = (
    details: DetailItem[]
    ) => {
    const errors: Record<number, Partial<Record<keyof DetailItem, string>>> = {};

    const gs = formData.generalStatistic;

    const totalVictims = details.reduce(
        (s, d) => s + Number(d.totalVictims || 0),
        0
    );

    const unmanagedVictims = details.reduce(
        (s, d) => s + Number(d.unmanagedVictims || 0),
        0
    );

    const totalCosts = details.reduce(
    (s, d) =>
        s +
        parseMoneyToFloat(d.medicalCosts) +
        parseMoneyToFloat(d.treatmentSalaryCosts) +
        parseMoneyToFloat(d.compensationCosts),
    0
    );

    const totalDaysOff = details.reduce(
        (s, d) => s + Number(d.totalDaysOff || 0),
        0
    );

    const propertyDamage = details.reduce(
        (s, d) => s + parseMoneyToFloat(d.propertyDamage),
        0
    );

    if (
        totalVictims >
        Number(gs.totalVictims || 0)
    ) {
        details.forEach((_, i) => {
        errors[i] ??= {};

        errors[i].totalVictims =
            `Tổng người bị nạn hiện tại của chi tiết các vụ không được khác tổng người bị nạn đã khai báo "${gs.totalVictims}"`;
        });
    }

    if (
        unmanagedVictims >
        Number(gs.unmanagedVictims || 0)
    ) {
        details.forEach((_, i) => {
        errors[i] ??= {};

        errors[i].unmanagedVictims =
            `Tổng người bị nạn không QL của chi tiết các vụ không được khác tổng người bị nạn không QL đã khai báo "${gs.unmanagedVictims}"`;
        });
    }

    if (
        totalCosts >
        parseMoneyToFloat(gs.totalCosts)
    ) {
        details.forEach((_, i) => {
        errors[i] ??= {};

        errors[i].totalCosts =
            `Tổng tiền chi phí của chi tiết các vụ không được khác tổng tiền chi phí đã khai báo ${gs.totalCosts}`;
        });
    }

    if (
        totalDaysOff >
        Number(gs.totalDaysOff || 0)
    ) {
        details.forEach((_, i) => {
        errors[i] ??= {};

        errors[i].totalDaysOff =
            `Tổng ngày nghỉ vì TNLĐ của chi tiết các vụ không được khác tổng số ngày nghỉ vì TNLĐ đã khai báo "${gs.totalDaysOff}"`;
        });
    }

    if (
        propertyDamage >
        parseMoneyToFloat(gs.propertyDamage)
    ) {
        details.forEach((_, i) => {
        errors[i] ??= {};

        errors[i].propertyDamage =
            'Tổng thiệt hại tài sản trong chi tiết các vụ khác tổng thiệt hại tài sản đã khai báo!';
        });
    }

    return errors;
    };


    
const validateStep4 = (s: StatisticData): FormErrorsState => {
  const errors: FormErrorsState = {};

const hasAnyValue = Object.values(s).some((value) => {
  if (typeof value === "string") {
    return (
      value !== "" &&
      value !== "0" &&
      parseMoneyToFloat(value) > 0
    );
  }

  return Number(value) > 0;
});

if (!hasAnyValue) {
  return errors;
}
const totalGeneral = formData.generalStatistic.totalIncidents;
const totalSubsidized = s.totalIncidents;

if (totalSubsidized > totalGeneral) {
    errors.totalIncidents =
        'Số vụ được hưởng trợ cấp không được lớn hơn số vụ tai nạn chung.';
}
  if (s.incidentsWithFatalities > s.totalIncidents) 
    errors.incidentsWithFatalities = 'Số vụ có người chết không được lớn hơn tổng số vụ!';
  if (s.incidentsWithMultipleVictims > s.totalIncidents) 
    errors.incidentsWithMultipleVictims = 'Số vụ có 2 người bị nạn trở lên không được lớn hơn tổng số vụ!';

  if (s.totalFemaleVictims > s.totalVictims) errors.totalFemaleVictims = 'Số lao động nữ không được lớn hơn tổng số người bị nạn!';
  if (s.totalFatalities > s.totalVictims) errors.totalFatalities = 'Số người chết không được lớn hơn tổng số người bị nạn!';
  if (s.totalSevereInjuries > s.totalVictims) errors.totalSevereInjuries = 'Số người bị thương nặng không được lớn hơn tổng số người bị nạn!';

  if (s.unmanagedFemaleVictims > s.unmanagedVictims) errors.unmanagedFemaleVictims = 'Số nữ không QL không được lớn hơn tổng số người không QL!';
  if (s.unmanagedFatalities > s.unmanagedVictims) errors.unmanagedFatalities = 'Số người chết không QL không được lớn hơn tổng số người không QL!';
  if (s.unmanagedSevereInjuries > s.unmanagedVictims) errors.unmanagedSevereInjuries = 'Số người bị thương nặng không QL không được lớn hơn tổng số người không QL!';

  if (s.unmanagedVictims > s.totalVictims) errors.unmanagedVictims = 'Số người không QL không được lớn hơn tổng số người bị nạn!';
  if (s.unmanagedFemaleVictims > s.totalFemaleVictims) errors.unmanagedFemaleVictims = 'Số nữ không QL không được lớn hơn tổng số nữ bị nạn!';
  if (s.unmanagedFatalities > s.totalFatalities) errors.unmanagedFatalities = 'Số người chết không QL không được lớn hơn tổng số người chết!';
  if (s.unmanagedSevereInjuries > s.totalSevereInjuries) errors.unmanagedSevereInjuries = 'Số người bị thương nặng không QL không được lớn hơn tổng số người bị thương nặng!';

  return errors;
};

const handleStep4Change = (key: keyof StatisticData, value: string) => {
  setFormData((prev) => {
    const isMoney = ['medicalCosts', 'treatmentSalaryCosts', 'compensationCosts', 'propertyDamage'].includes(key);
    let newValue: string | number;
    if (isMoney) {
      newValue = formatMoneyInput(value);
    } else {
      newValue = value === '' ? 0 : cleanIntegerString(value);
    }

    const updatedStats = { ...prev.subsidizedStatistic, [key]: newValue };

    if (['medicalCosts', 'treatmentSalaryCosts', 'compensationCosts'].includes(key)) {
      const sum = parseMoneyToFloat(updatedStats.medicalCosts as string) + 
                  parseMoneyToFloat(updatedStats.treatmentSalaryCosts as string) + 
                  parseMoneyToFloat(updatedStats.compensationCosts as string);
      updatedStats.totalCosts = sum > 0 ? formatFloatToVNDString(sum) : '';
    }

    const newErrors = validateStep4(updatedStats);
    setErrors(newErrors);

    return { ...prev, subsidizedStatistic: updatedStats };
  });
};

const isStep4Filled = () => {
  const stats = formData.subsidizedStatistic;
  return stats.totalIncidents !== undefined && stats.totalVictims !== undefined;
};


const handlePrint = () => {
  window.print();
};

const handleSaveSubmit = async () => {
  try {
    setIsLoading(true);
    console.log("generalDetails =", formData.generalDetails);
    console.log("length =", formData.generalDetails.length);
console.log(formData);
console.log(formData.subsidizedDetails);
    const payload = {
        company_info: {
        total_employees: formData.companyInfo.totalEmployees,
        total_female_employees: formData.companyInfo.totalFemaleEmployees,
        total_salary_fund: parseMoneyToFloat(formData.companyInfo.totalSalaryFund),
        },

        general_statistic: {
        total_accidents: formData.generalStatistic.totalIncidents,
        total_fatal_accidents: formData.generalStatistic.incidentsWithFatalities,
        total_accidents_with_two_or_more_victims:
            formData.generalStatistic.incidentsWithMultipleVictims,

        total_victims: formData.generalStatistic.totalVictims,
        total_female_victims: formData.generalStatistic.totalFemaleVictims,
        total_fatalities: formData.generalStatistic.totalFatalities,
        total_seriously_injured: formData.generalStatistic.totalSevereInjuries,

        unmanaged_victims: formData.generalStatistic.unmanagedVictims,
        unmanaged_female_victims:
            formData.generalStatistic.unmanagedFemaleVictims,
        unmanaged_fatalities:
            formData.generalStatistic.unmanagedFatalities,
        unmanaged_seriously_injured:
            formData.generalStatistic.unmanagedSevereInjuries,

        medical_expenses: parseMoneyToFloat(
            formData.generalStatistic.medicalCosts
        ),

        salary_paid_during_treatment: parseMoneyToFloat(
            formData.generalStatistic.treatmentSalaryCosts
        ),

        compensation_expenses: parseMoneyToFloat(
            formData.generalStatistic.compensationCosts
        ),

        total_leave_days:
            formData.generalStatistic.totalDaysOff,

        property_damage_expenses: parseMoneyToFloat(
            formData.generalStatistic.propertyDamage
        ),
        },

        general_details: formData.generalDetails.map(detail => ({
        accident_cause_id: Number(detail.causeId),
        injury_factor_id: Number(detail.factorId),
        profession_id: Number(detail.professionId),

        total_victims: detail.totalVictims,
        total_female_victims: detail.totalFemaleVictims,
        total_fatalities: detail.totalFatalities,
        total_seriously_injured: detail.totalSevereInjuries,

        unmanaged_victims: detail.unmanagedVictims,
        unmanaged_female_victims:
            detail.unmanagedFemaleVictims,
        unmanaged_fatalities:
            detail.unmanagedFatalities,
        unmanaged_seriously_injured:
            detail.unmanagedSevereInjuries,

        medical_expenses: parseMoneyToFloat(
            detail.medicalCosts
        ),

        salary_paid_during_treatment: parseMoneyToFloat(
            detail.treatmentSalaryCosts
        ),

        compensation_expenses: parseMoneyToFloat(
            detail.compensationCosts
        ),

        total_leave_days:
            detail.totalDaysOff,

        property_damage_expenses: parseMoneyToFloat(
            detail.propertyDamage
        ),
        })),

        subsidized_statistic: {
        total_accidents: formData.subsidizedStatistic.totalIncidents,
        total_fatal_accidents:
            formData.subsidizedStatistic.incidentsWithFatalities,
        total_accidents_with_two_or_more_victims:
            formData.subsidizedStatistic.incidentsWithMultipleVictims,

        total_victims:
            formData.subsidizedStatistic.totalVictims,

        total_female_victims:
            formData.subsidizedStatistic.totalFemaleVictims,

        total_fatalities:
            formData.subsidizedStatistic.totalFatalities,

        total_seriously_injured:
            formData.subsidizedStatistic.totalSevereInjuries,

        unmanaged_victims:
            formData.subsidizedStatistic.unmanagedVictims,

        unmanaged_female_victims:
            formData.subsidizedStatistic.unmanagedFemaleVictims,

        unmanaged_fatalities:
            formData.subsidizedStatistic.unmanagedFatalities,

        unmanaged_seriously_injured:
            formData.subsidizedStatistic.unmanagedSevereInjuries,

        medical_expenses: parseMoneyToFloat(
            formData.subsidizedStatistic.medicalCosts
        ),

        salary_paid_during_treatment: parseMoneyToFloat(
            formData.subsidizedStatistic.treatmentSalaryCosts
        ),

        compensation_expenses: parseMoneyToFloat(
            formData.subsidizedStatistic.compensationCosts
        ),

        total_leave_days:
            formData.subsidizedStatistic.totalDaysOff,

        property_damage_expenses: parseMoneyToFloat(
            formData.subsidizedStatistic.propertyDamage
        ),
        },
        subsidized_details: formData.subsidizedDetails.map(detail => ({
            accident_cause_id: Number(detail.causeId),
            injury_factor_id: Number(detail.factorId),
            profession_id: Number(detail.professionId),

            total_victims: detail.totalVictims,
            total_female_victims: detail.totalFemaleVictims,
            total_fatalities: detail.totalFatalities,
            total_seriously_injured: detail.totalSevereInjuries,

            unmanaged_victims: detail.unmanagedVictims,
            unmanaged_female_victims: detail.unmanagedFemaleVictims,
            unmanaged_fatalities: detail.unmanagedFatalities,
            unmanaged_seriously_injured: detail.unmanagedSevereInjuries,

            medical_expenses: parseMoneyToFloat(detail.medicalCosts),
            salary_paid_during_treatment: parseMoneyToFloat(detail.treatmentSalaryCosts),
            compensation_expenses: parseMoneyToFloat(detail.compensationCosts),
            total_leave_days: detail.totalDaysOff,
            property_damage_expenses: parseMoneyToFloat(detail.propertyDamage),
        }))
    };

    console.log("Payload:", payload);

    await api.patch(`/reports/${reportId}`, payload);

    await api.patch(`/reports/${reportId}/submit`);

    toast.success("Nộp báo cáo thành công");

    router.push("/dashboard/accidents-enterprise");
  } catch (error: unknown) {
    console.error("Lỗi lưu báo cáo:", error);

    if (axios.isAxiosError(error)) {
      console.error("Status:", error.response?.status);
      console.error("Data:", error.response?.data);
      console.error("URL:", error.config?.url);

      toast.error(
        typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : "Có lỗi xảy ra khi lưu báo cáo."
      );
    } else {
      toast.error("Có lỗi xảy ra khi lưu báo cáo.");
    }
  } finally {
    setIsLoading(false);
  }
};

const handleStep2FieldChange = (key: keyof StatisticData, rawStr: string) => {
  const numericValue = cleanIntegerString(rawStr);
  
  setFormData((prev) => {
    const updatedStats = { ...prev.generalStatistic, [key]: numericValue };
    
    const newErrors: FormErrorsState = {};
    const s = updatedStats; 

    if (numericValue > 0 || s.totalIncidents > 0 || s.totalVictims > 0) {
        if (s.incidentsWithFatalities > s.totalIncidents) newErrors.incidentsWithFatalities = 'Số vụ có người chết không được lớn hơn tổng số vụ!';
        if (s.incidentsWithMultipleVictims > s.totalIncidents) newErrors.incidentsWithMultipleVictims = 'Số vụ có 2 người bị nạn trở lên không được lớn hơn tổng số vụ!';
        
        if (s.totalFemaleVictims > s.totalVictims) newErrors.totalFemaleVictims = 'Số lao động nữ bị nạn không được lớn hơn tổng số người bị nạn!';
        if (s.totalFatalities > s.totalVictims) newErrors.totalFatalities = 'Số người chết không được lớn hơn tổng số người bị nạn!';
        if (s.totalSevereInjuries > s.totalVictims) newErrors.totalSevereInjuries = 'Số người bị thương nặng không được lớn hơn tổng số người bị nạn!';

        if (s.unmanagedVictims > s.totalVictims) newErrors.unmanagedVictims = 'Số người bị nạn không QL không được lớn hơn tổng số người bị nạn!';
        
        if (s.unmanagedFemaleVictims > s.unmanagedVictims) newErrors.unmanagedFemaleVictims = 'Số nữ bị nạn không QL không được lớn hơn tổng số nạn nhân không QL!';
        else if (s.unmanagedFemaleVictims > s.totalFemaleVictims) newErrors.unmanagedFemaleVictims = 'Số nữ bị nạn không QL không được lớn hơn tổng số nữ bị nạn!';

        if (s.unmanagedFatalities > s.unmanagedVictims) newErrors.unmanagedFatalities = 'Số người chết không QL không được lớn hơn tổng số nạn nhân không QL!';
        else if (s.unmanagedFatalities > s.totalFatalities) newErrors.unmanagedFatalities = 'Số người chết không QL không được lớn hơn tổng số người chết!';

        if (s.unmanagedSevereInjuries > s.unmanagedVictims) newErrors.unmanagedSevereInjuries = 'Số người bị thương nặng không QL không được lớn hơn tổng số nạn nhân không QL!';
        else if (s.unmanagedSevereInjuries > s.totalSevereInjuries) newErrors.unmanagedSevereInjuries = 'Số người bị thương nặng không QL không được lớn hơn tổng số người bị thương nặng!';
    }

    setErrors(newErrors);

    const summaryErrors = validateStep3Summary(prev.generalDetails, updatedStats);
    setDetailErrors(summaryErrors);

    return { ...prev, generalStatistic: updatedStats };
  });
};
  const handleStep2CostChange = (key: keyof StatisticData, valueString: string) => {
    const formatted = formatMoneyInput(valueString);
    setFormData((prev) => {
      const updatedStats = { ...prev.generalStatistic, [key]: formatted };
      
      if (key === 'medicalCosts' || key === 'treatmentSalaryCosts' || key === 'compensationCosts') {
        const sumFloat = parseMoneyToFloat(updatedStats.medicalCosts as string) + 
                         parseMoneyToFloat(updatedStats.treatmentSalaryCosts as string) + 
                         parseMoneyToFloat(updatedStats.compensationCosts as string);
        updatedStats.totalCosts = formatFloatToVNDString(sumFloat);
      }
    const summaryErrors = validateStep3Summary(prev.generalDetails, updatedStats);
    setDetailErrors(summaryErrors)
      return { ...prev, generalStatistic: updatedStats };
    });
  };

    const renderFactorOptions = (
    items: CategoryItem[],
    depth = 0
    ): React.ReactNode[] => {
    const sortedItems = [...items].sort((a, b) =>
        a.code.localeCompare(b.code, undefined, {
        numeric: true,
        })
    );

    return sortedItems.flatMap((item) => [
        <option
        key={item.id}
        value={item.name}
        >
        {'—'.repeat(depth)}
        {depth > 0 ? ' ' : ''}
        {item.name}
        </option>,

        ...(item.children
        ? renderFactorOptions(
            item.children,
            depth + 1
            )
        : []),
    ]);
    };

    const renderProfessionOptions = (
    items: CategoryItem[]
    ) => {
    return items.map((item) => (
        <option
            key={item.id}
            value={item.name}
        >
            {item.name}
        </option>
    ));
    };
  const handleDropdownCategoryChange = (value: string) => {
    if (value === 'info') setCurrentStep(1);
    else if (value === 'general_sum') setCurrentStep(2);
    else if (value === 'general_detail') setCurrentStep(3);
    else if (value === 'subsidized') setCurrentStep(4);
    else if (value === 'report_sheet') setCurrentStep(5);
  };    

const isDetailCompleted = (detail: DetailItem) => {
  return (
    detail.causeId !== "" &&
    detail.factorId !== "" &&
    detail.professionId !== "" &&

    detail.totalVictims !== undefined &&
    detail.totalFemaleVictims !== undefined &&
    detail.totalFatalities !== undefined &&
    detail.totalSevereInjuries !== undefined &&

    detail.unmanagedVictims !== undefined &&
    detail.unmanagedFemaleVictims !== undefined &&
    detail.unmanagedFatalities !== undefined &&
    detail.unmanagedSevereInjuries !== undefined &&

    detail.medicalCosts !== "" &&
    detail.treatmentSalaryCosts !== "" &&
    detail.compensationCosts !== "" &&
    detail.totalCosts !== "" &&
    detail.propertyDamage !== "" &&

    detail.totalDaysOff !== undefined
  );
};  

const validateStep3Summary = (
  details: DetailItem[],
  gs: StatisticData
) => {
  const newErrors: Record<
    number,
    Partial<Record<keyof DetailItem, string>>
  > = {};

  const isStep2Empty = Object.values(gs).every(
    (val) => val === 0 || val === "" || val === "0"
  );

  if (isStep2Empty) return newErrors;

  const sums = details.reduce(
    (acc, d) => ({
      totalVictims:
        acc.totalVictims + Number(d.totalVictims || 0),

      totalFemaleVictims:
        acc.totalFemaleVictims +
        Number(d.totalFemaleVictims || 0),

      totalFatalities:
        acc.totalFatalities +
        Number(d.totalFatalities || 0),

      totalSevereInjuries:
        acc.totalSevereInjuries +
        Number(d.totalSevereInjuries || 0),

      unmanagedVictims:
        acc.unmanagedVictims +
        Number(d.unmanagedVictims || 0),

      unmanagedFemaleVictims:
        acc.unmanagedFemaleVictims +
        Number(d.unmanagedFemaleVictims || 0),

      unmanagedFatalities:
        acc.unmanagedFatalities +
        Number(d.unmanagedFatalities || 0),

      unmanagedSevereInjuries:
        acc.unmanagedSevereInjuries +
        Number(d.unmanagedSevereInjuries || 0),

      totalCosts:
        acc.totalCosts +
        parseMoneyToFloat(d.totalCosts),

      totalDaysOff:
        acc.totalDaysOff +
        Number(d.totalDaysOff || 0),

      propertyDamage:
        acc.propertyDamage +
        parseMoneyToFloat(d.propertyDamage),
    }),
    {
      totalVictims: 0,
      totalFemaleVictims: 0,
      totalFatalities: 0,
      totalSevereInjuries: 0,

      unmanagedVictims: 0,
      unmanagedFemaleVictims: 0,
      unmanagedFatalities: 0,
      unmanagedSevereInjuries: 0,

      totalCosts: 0,
      totalDaysOff: 0,
      propertyDamage: 0,
    }
  );

  const rules = [
    {
      key: "totalVictims",
      sum: sums.totalVictims,
      target: Number(gs.totalVictims || 0),
      msg: "Tổng số người bị nạn",
    },
    {
      key: "totalFemaleVictims",
      sum: sums.totalFemaleVictims,
      target: Number(gs.totalFemaleVictims || 0),
      msg: "Tổng lao động nữ",
    },
    {
      key: "totalFatalities",
      sum: sums.totalFatalities,
      target: Number(gs.totalFatalities || 0),
      msg: "Tổng số người chết",
    },
    {
      key: "totalSevereInjuries",
      sum: sums.totalSevereInjuries,
      target: Number(gs.totalSevereInjuries || 0),
      msg: "Tổng số người bị thương nặng",
    },
    {
      key: "unmanagedVictims",
      sum: sums.unmanagedVictims,
      target: Number(gs.unmanagedVictims || 0),
      msg: "Tổng người bị nạn không thuộc quản lý",
    },
    {
      key: "unmanagedFemaleVictims",
      sum: sums.unmanagedFemaleVictims,
      target: Number(gs.unmanagedFemaleVictims || 0),
      msg: "Lao động nữ không thuộc quản lý",
    },
    {
      key: "unmanagedFatalities",
      sum: sums.unmanagedFatalities,
      target: Number(gs.unmanagedFatalities || 0),
      msg: "Người chết không thuộc quản lý",
    },
    {
      key: "unmanagedSevereInjuries",
      sum: sums.unmanagedSevereInjuries,
      target: Number(gs.unmanagedSevereInjuries || 0),
      msg: "Người bị thương nặng không thuộc quản lý",
    },
    {
      key: "totalCosts",
      sum: sums.totalCosts,
      target: parseMoneyToFloat(gs.totalCosts),
      msg: "Tổng chi phí",
    },
    {
      key: "totalDaysOff",
      sum: sums.totalDaysOff,
      target: Number(gs.totalDaysOff || 0),
      msg: "Tổng số ngày nghỉ",
    },
    {
      key: "propertyDamage",
      sum: sums.propertyDamage,
      target: parseMoneyToFloat(gs.propertyDamage),
      msg: "Thiệt hại tài sản",
    },
  ] as const;

  details.forEach((_, index) => {
    newErrors[index] = {};

    rules.forEach((rule) => {
      if (rule.sum > rule.target) {
        newErrors[index][rule.key as keyof DetailItem] =
          `${rule.msg} của các vụ đã vượt quá số liệu khai báo ở Bước 2.`;
      }
    });
  });

  return newErrors;
};

const mapFormDataToReportData = (): ReportData => {
  const g = formData.generalStatistic;
  const s = formData.subsidizedStatistic;
  const d = formData.generalDetails;
const buildStatistics = (
    
  items: DetailItem[],
  key: "causeId" | "factorId" | "professionId",
  categories: CategoryItem[]
): ReportStatistic[] => {
  const map = new Map<string, ReportStatistic>();

  items.forEach((item) => {
    const code = item[key];

    if (!code) return;

    const category = categories.find(
        c => String(c.id) === String(code) || c.code === String(code) || c.name === String(code)
    );

    console.log({
    code,
    category
    });

if (!map.has(code)) {
    map.set(code, {
        id: String(category?.id ?? code),

        code: category?.code ?? "",

        name: category?.name ?? (typeof code === 'string' ? code : ""),

        incidents: 0,
        fatalIncidents: 0,
        multipleVictimIncidents: 0,

        victims: 0,
        unmanagedVictims: 0,

        femaleVictims: 0,
        unmanagedFemaleVictims: 0,

        fatalities: 0,
        unmanagedFatalities: 0,

        seriouslyInjured: 0,
        unmanagedSeriouslyInjured: 0,

        totalLeaveDays: g.totalDaysOff ?? 0,
        subsidizedTotalLeaveDays: s.totalDaysOff ?? 0,
    });
}

    const statistic = map.get(code)!;

    statistic.incidents++;

    if (Number(item.totalFatalities ?? 0) > 0){
      statistic.fatalIncidents++;
    }

    if (Number(item.totalVictims ?? 0) >= 2) {
      statistic.multipleVictimIncidents++;
    }

    statistic.victims += Number(item.totalVictims ?? 0);

    statistic.unmanagedVictims += Number(item.unmanagedVictims ?? 0);

    statistic.femaleVictims += Number(item.totalFemaleVictims ?? 0);

    statistic.unmanagedFemaleVictims += Number(item.unmanagedFemaleVictims ?? 0);

    statistic.fatalities += Number(item.totalFatalities ?? 0);

    statistic.unmanagedFatalities += Number(item.unmanagedFatalities ?? 0);

    statistic.seriouslyInjured += Number(item.totalSevereInjuries ?? 0);

    statistic.unmanagedSeriouslyInjured += Number(item.unmanagedSevereInjuries ?? 0);
  });

    return Array.from(map.values()).sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true })
    );
};
  const getSumByCause = (causeId: string, key: keyof DetailItem) =>
    d.filter((item) => item.causeId === causeId).reduce((sum, item) => sum + Number(item[key] || 0), 0);

  const getCountByCause = (causeId: string) => d.filter((item) => item.causeId === causeId).length;
console.log("Map result", {
  totalLeaveDays: g.totalDaysOff,
  subsidizedTotalLeaveDays: s.totalDaysOff,
});
  return {
    id: reportId as any,
    companyName: formData.companyInfo.name,
    taxCode: '',
    period: '6 tháng',
    year: parseInt(reportYear),
    status: 'DRAFT',
    province: 'TP.HCM',
    ward: '',

    totalIncidents: g.totalIncidents ?? 0,
    totalFatalIncidents: g.incidentsWithFatalities ?? 0,
    totalMultipleVictimIncidents: g.incidentsWithMultipleVictims ?? 0,
    totalVictims: g.totalVictims ?? 0,
    totalFemaleVictims: g.totalFemaleVictims ?? 0,
    totalFatalities: g.totalFatalities ?? 0,
    totalSeriouslyInjured: g.totalSevereInjuries ?? 0,
    unmanagedVictims: g.unmanagedVictims ?? 0,
    unmanagedFemaleVictims: g.unmanagedFemaleVictims ?? 0,
    unmanagedFatalities: g.unmanagedFatalities ?? 0,
    unmanagedSeriouslyInjured: g.unmanagedSevereInjuries ?? 0,

    subsidizedIncidents: s.totalIncidents ?? 0,
    subsidizedFatalIncidents: s.incidentsWithFatalities ?? 0,
    subsidizedMultipleVictimIncidents: s.incidentsWithMultipleVictims ?? 0,
    subsidizedVictims: s.totalVictims ?? 0,
    subsidizedFemaleVictims: s.totalFemaleVictims ?? 0,
    subsidizedFatalities: s.totalFatalities ?? 0,
    subsidizedSeriouslyInjured: s.totalSevereInjuries ?? 0,
    subsidizedUnmanagedVictims: s.unmanagedVictims ?? 0,
    subsidizedUnmanagedFemaleVictims: s.unmanagedFemaleVictims ?? 0,
    subsidizedUnmanagedFatalities: s.unmanagedFatalities ?? 0,
    subsidizedUnmanagedSeriouslyInjured: s.unmanagedSevereInjuries ?? 0,
    subsidizedTotalLeaveDays: s.totalDaysOff ?? 0,
    medicalExpenses: parseMoneyToFloat(g.medicalCosts || '0'),
    treatmentSalaryExpenses: parseMoneyToFloat(g.treatmentSalaryCosts || '0'),
    compensationExpenses: parseMoneyToFloat(g.compensationCosts || '0'),
    totalLeaveDays: g.totalDaysOff ?? 0,
    propertyDamageExpenses: parseMoneyToFloat(g.propertyDamage || '0'),

    causes: buildStatistics(
    d,
    "causeId",
    categories.causes
    ),

    factors: buildStatistics(
    d,
    "factorId",
    categories.factors
    ),

    professions: buildStatistics(
    d,
    "professionId",
    categories.professions
    ),
        };
    };

const handleFileChange = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  if (!e.target.files?.length) return;

  const file = e.target.files[0];

  if (file.type !== "application/pdf") {
    toast.error("Vui lòng chọn file PDF");
    return;
  }

  try {
    const uploadForm = new FormData();
    uploadForm.append("file", file);

    const uploadRes = await api.post(
      "/upload",
      uploadForm,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const uploadData = uploadRes.data?.data || uploadRes.data || {};
    const filePath = uploadData.filePath;
    const fileName = uploadData.originalName || uploadData.fileName || uploadData.filename || file.name;

    await api.patch(
      `/reports/${reportId}/attachment`,
      {
        attachment_name: fileName,
        attachment_url: filePath,
      }
    );

    const normalizedUrl = String(filePath).replace(/\\/g, '/');
    const fullUrl = normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://')
      ? normalizedUrl
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${normalizedUrl.startsWith('/') ? '' : '/'}${normalizedUrl}`;

    setSelectedFile(file);
    setSelectedFileName(fileName);
    setFileUrl(fullUrl);

    toast.success("Đính kèm báo cáo thành công");
  } catch (error) {
    console.error("Lỗi đính kèm file:", error);
    toast.error("Đính kèm file thất bại");
  }
};

const handlePreview = async () => {
  try {
    const res = await api.get(`/reports/${reportId}/preview`);

    const pdfUrl = `http://localhost:8080${res.data.attachmentUrl}`;

    window.open(pdfUrl, "_blank");
  } catch (error) {
    console.error(error);
    toast.error("Không thể xem trước báo cáo!");
  }
};

const handleConfirmSubmit = async () => {
  try {
    setIsSubmitting(true);

    await api.patch(`/reports/${reportId}/submit`);

    toast.success("Nộp báo cáo thành công!");

    setPreviewOpen(false);

    router.push("/dashboard/...");
  } catch (error) {
    toast.error("Nộp báo cáo thất bại.");
  } finally {
    setIsSubmitting(false);
  }
};

  const handlePrevStep = () => { if (currentStep > 1) setCurrentStep((prev) => prev - 1); };

  if (isLoading) return <div className="text-center py-12 text-xs text-gray-400 animate-pulse">Đang đồng bộ hóa dữ liệu từ PostgreSQL...</div>;

  return (
    <div className="w-full h-full bg-[#F4F6F9] flex flex-col font-sans text-xs text-gray-700 overflow-hidden">

      <div className="bg-white px-5 py-3 flex items-center justify-between border-b shadow-sm flex-shrink-0">
        
        <h1 className="text-xs font-bold text-gray-800">
          Báo cáo định kỳ Tai nạn lao động
        </h1>

        <div className="flex items-center gap-3 font-semibold">

          <input type="text" disabled value={reportYear} className="w-16 px-2 py-1 text-center border border-gray-200 rounded bg-gray-50 text-gray-700 font-bold" />
          <button type="button" onClick={() => router.back()} className="border border-gray-200 text-gray-600 hover:bg-gray-50 px-3.5 py-1.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer">❮ Quay lại</button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-1.5 rounded-md bg-[#099018] hover:bg-green-600 text-white font-bold"
          >
            In báo cáo
          </button>

        </div>
      </div>

      <div className="flex-1 bg-white p-6 overflow-y-auto">
      {showCancelWarning && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[150] p-4">
          <div className="bg-white rounded-xl w-full max-w-[480px] shadow-2xl overflow-hidden font-sans border border-gray-200 animate-fadeIn">
            <div className="bg-[#2F6BFF] px-6 py-4 border-b border-blue-100 text-center w-full block">
              <span className="text-white font-bold text-sm tracking-wider uppercase">Cảnh báo</span>
            </div>
            <div className="p-8 text-center text-gray-700 font-semibold text-xs leading-relaxed">
              Dữ liệu báo cáo đã nhập sẽ không được lưu lại
            </div>
            <div className="px-6 pb-5 flex justify-end gap-3 font-bold text-xs">
              <button type="button" onClick={() => setShowCancelWarning(false)} className="border border-gray-200 text-gray-600 hover:bg-gray-50 px-3.5 py-1.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer">❮ Quay lại</button>
              <button type="button" onClick={() => { setShowCancelWarning(false); router.back(); }} className="px-5 py-2 bg-[#2F6BFF] hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer">Đồng ý</button>
            </div>
          </div>
        </div>
      )}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-800 mb-2">
            Báo cáo tổng hợp tình hình tai nạn lao động - Kỳ báo cáo: {periodName}
          </h2>

          <p className="text-xs text-gray-600 flex items-center gap-2.5 flex-wrap">
            <span className="text-red-500 font-bold">**</span>

            <span className="font-medium">File đính kèm báo cáo TNLĐ có dấu mộc công ty:</span>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="application/pdf"
              onChange={handleFileChange}
            />

            {fileUrl ? (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 border border-red-200 rounded-md font-semibold text-xs shadow-xs transition-all cursor-pointer group"
                title="Mở xem file PDF trong tab mới"
              >
                <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zm-2.5 7.5h-1v-4h1c.83 0 1.5.67 1.5 1.5v1c0 .83-.67 1.5-1.5 1.5zm-1-3v2h1c.28 0 .5-.22.5-.5v-1c0-.28-.22-.5-.5-.5h-1zm6 3h-2.5v-4H18v1h-1.5v.5H18v1h-1.5v1.5zm-8 0H6.5v-4H8c.83 0 1.5.67 1.5 1.5v1c0 .83-.67 1.5-1.5 1.5zm-1-3v2H8c.28 0 .5-.22.5-.5v-1c0-.28-.22-.5-.5-.5h-1z"/>
                </svg>
                <span>Xem file PDF</span>
                <svg className="w-3.5 h-3.5 text-red-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ) : (
              <span className="text-gray-400 italic font-normal">(Chưa có file đính kèm)</span>
            )}
          </p>
        </div>

        <ReportSheet report={mapFormDataToReportData()} />

      </div>
    </div>
    
  );
  
};