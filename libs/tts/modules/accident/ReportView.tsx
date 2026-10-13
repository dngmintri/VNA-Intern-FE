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
interface WizardProps {
  reportId: number;
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

const formatMoneyInput = (value: string): string => {
  if (!value) return '';
  let cleanValue = value.trim();
  if (/^\d+\.\d+$/.test(cleanValue)) {
    cleanValue = cleanValue.replace('.', ',');
  }
  let clean = cleanValue.replace(/[^0-9,.]/g, '');
  if (clean.endsWith('.')) {
    clean = clean.slice(0, -1) + ',';
  }
  const parts = clean.split(',');
  const integerPart = parts[0].replace(/\./g, '');
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (parts.length > 1) {
    const decimalPart = parts[1].replace(/[^0-9]/g, '');
    return `${formattedInteger},${decimalPart}`;
  }
  return formattedInteger;
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
    treatmentSalaryCosts: '0',
    compensationCosts: '0',
    totalCosts: '0',
    totalDaysOff: 0,
    propertyDamage: '0',
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
            )
          : null,
        api.get<{
          data: {
            totalEmployees?: number;
            totalFemaleEmployees?: number;
            totalSalaryFund?: string | number;
            attachmentName?: string;
            attachmentUrl?: string;
            reportPeriodId?: number;
            reportPeriod?: { year?: number
                name?: string;
             };
            statistics?: StatisticPayload[];
          };
        }>(`/reports/${reportId}`),
      ]);

      const res = reportRes.data.data;
      setPeriodName(res.reportPeriod?.name || `Kỳ báo cáo #${res.reportPeriodId}`);
      console.log(res);
        setSelectedFileName(res.attachmentName ?? "");
        setFileUrl(
        res.attachmentUrl
            ? `http://localhost:8080${res.attachmentUrl}`
            : ""
        );
      if (res.reportPeriod?.year) {
        setReportYear(res.reportPeriod.year.toString());
      }

      const statsArray: StatisticPayload[] = Array.isArray(res.statistics)
        ? res.statistics
        : [];

      const generalObj = statsArray.find(
        (s) => s.reportCategory?.toUpperCase() === "GENERAL"
      );

      const subsidizedObj = statsArray.find(
        (s) => s.reportCategory?.toUpperCase() === "SUBSIDIZED"
      );

      const mapDetail = (detail: AccidentDetailPayload): DetailItem => ({
        causeId: detail.accidentCauseId?.toString() ?? "",
        factorId: detail.injuryFactorId?.toString() ?? "",
        professionId: detail.professionId?.toString() ?? "",

        totalIncidents: 0,
        totalVictims: detail.totalVictims ?? 0,
        totalFemaleVictims: detail.totalFemaleVictims ?? 0,
        totalFatalities: detail.totalFatalities ?? 0,
        totalSevereInjuries: detail.totalSevereInjuries ?? 0,

        unmanagedVictims: detail.unmanagedVictims ?? 0,
        unmanagedFemaleVictims: detail.unmanagedFemaleVictims ?? 0,
        unmanagedFatalities: detail.unmanagedFatalities ?? 0,
        unmanagedSevereInjuries: detail.unmanagedSevereInjuries ?? 0,

        medicalCosts:
          detail.medicalCosts && Number(detail.medicalCosts) !== 0
            ? formatMoneyInput(detail.medicalCosts.toString())
            : "",

        treatmentSalaryCosts:
          detail.treatmentSalaryCosts &&
          Number(detail.treatmentSalaryCosts) !== 0
            ? formatMoneyInput(detail.treatmentSalaryCosts.toString())
            : "",

        compensationCosts:
          detail.compensationCosts &&
          Number(detail.compensationCosts) !== 0
            ? formatMoneyInput(detail.compensationCosts.toString())
            : "",

        totalCosts:
          detail.totalCosts && Number(detail.totalCosts) !== 0
            ? formatMoneyInput(detail.totalCosts.toString())
            : "",

        totalDaysOff: detail.totalDaysOff ?? 0,

        propertyDamage:
          detail.propertyDamage && Number(detail.propertyDamage) !== 0
            ? formatMoneyInput(detail.propertyDamage.toString())
            : "",
      });

      setFormData({
        companyInfo: {
          name:
            profileRes?.data?.data?.companyName ||
            "Chưa cập nhật tên doanh nghiệp",
          type:
            profileRes?.data?.data?.businessType ||
            "Chưa cập nhật loại hình",
          industry:
            profileRes?.data?.data?.businessIndustry ||
            "Chưa cập nhật ngành nghề",

          totalEmployees: res.totalEmployees || 0,
          totalFemaleEmployees: res.totalFemaleEmployees || 0,

          totalSalaryFund:
            res.totalSalaryFund &&
            Number(res.totalSalaryFund) !== 0
              ? formatMoneyInput(res.totalSalaryFund.toString())
              : "",
        },

        generalStatistic: {
          totalIncidents: generalObj?.totalIncidents || 0,
          incidentsWithFatalities:
            generalObj?.incidentsWithFatalities || 0,
          incidentsWithMultipleVictims:
            generalObj?.incidentsWithMultipleVictims || 0,
          totalVictims: generalObj?.totalVictims || 0,
          totalFemaleVictims:
            generalObj?.totalFemaleVictims || 0,
          totalFatalities: generalObj?.totalFatalities || 0,
          totalSevereInjuries:
            generalObj?.totalSevereInjuries || 0,
          unmanagedVictims:
            generalObj?.unmanagedVictims || 0,
          unmanagedFemaleVictims:
            generalObj?.unmanagedFemaleVictims || 0,
          unmanagedFatalities:
            generalObj?.unmanagedFatalities || 0,
          unmanagedSevereInjuries:
            generalObj?.unmanagedSevereInjuries || 0,

          medicalCosts:
            generalObj?.medicalCosts &&
            Number(generalObj.medicalCosts) !== 0
              ? formatMoneyInput(generalObj.medicalCosts.toString())
              : "",

          treatmentSalaryCosts:
            generalObj?.treatmentSalaryCosts &&
            Number(generalObj.treatmentSalaryCosts) !== 0
              ? formatMoneyInput(
                  generalObj.treatmentSalaryCosts.toString()
                )
              : "",

          compensationCosts:
            generalObj?.compensationCosts &&
            Number(generalObj.compensationCosts) !== 0
              ? formatMoneyInput(
                  generalObj.compensationCosts.toString()
                )
              : "",

          totalCosts:
            generalObj?.totalCosts &&
            Number(generalObj.totalCosts) !== 0
              ? formatMoneyInput(generalObj.totalCosts.toString())
              : "",

          totalDaysOff: generalObj?.totalDaysOff || 0,

          propertyDamage:
            generalObj?.propertyDamage &&
            Number(generalObj.propertyDamage) !== 0
              ? formatMoneyInput(generalObj.propertyDamage.toString())
              : "",
        },

        generalDetails:
          generalObj?.accidentDetails?.map(mapDetail) ?? [],

        subsidizedStatistic: {
          totalIncidents:
            subsidizedObj?.totalIncidents || 0,
          incidentsWithFatalities:
            subsidizedObj?.incidentsWithFatalities || 0,
          incidentsWithMultipleVictims:
            subsidizedObj?.incidentsWithMultipleVictims || 0,
          totalVictims:
            subsidizedObj?.totalVictims || 0,
          totalFemaleVictims:
            subsidizedObj?.totalFemaleVictims || 0,
          totalFatalities:
            subsidizedObj?.totalFatalities || 0,
          totalSevereInjuries:
            subsidizedObj?.totalSevereInjuries || 0,
          unmanagedVictims:
            subsidizedObj?.unmanagedVictims || 0,
          unmanagedFemaleVictims:
            subsidizedObj?.unmanagedFemaleVictims || 0,
          unmanagedFatalities:
            subsidizedObj?.unmanagedFatalities || 0,
          unmanagedSevereInjuries:
            subsidizedObj?.unmanagedSevereInjuries || 0,

          medicalCosts:
            subsidizedObj?.medicalCosts &&
            Number(subsidizedObj.medicalCosts) !== 0
              ? formatMoneyInput(
                  subsidizedObj.medicalCosts.toString()
                )
              : "",

          treatmentSalaryCosts:
            subsidizedObj?.treatmentSalaryCosts &&
            Number(subsidizedObj.treatmentSalaryCosts) !== 0
              ? formatMoneyInput(
                  subsidizedObj.treatmentSalaryCosts.toString()
                )
              : "",

          compensationCosts:
            subsidizedObj?.compensationCosts &&
            Number(subsidizedObj.compensationCosts) !== 0
              ? formatMoneyInput(
                  subsidizedObj.compensationCosts.toString()
                )
              : "",

          totalCosts:
            subsidizedObj?.totalCosts &&
            Number(subsidizedObj.totalCosts) !== 0
              ? formatMoneyInput(
                  subsidizedObj.totalCosts.toString()
                )
              : "",

          totalDaysOff:
            subsidizedObj?.totalDaysOff || 0,

          propertyDamage:
            subsidizedObj?.propertyDamage &&
            Number(subsidizedObj.propertyDamage) !== 0
              ? formatMoneyInput(
                  subsidizedObj.propertyDamage.toString()
                )
              : "",
        },

        subsidizedDetails:
          subsidizedObj?.accidentDetails?.map(mapDetail) ?? [],
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
    setIsLoading(true);

    const [c, f, p] = await Promise.all([
    api.get<CategoryItem[]>('/category/accident-cause'),
    api.get<CategoryItem[]>('/category/injury-factor'),
    api.get<CategoryItem[]>('/category/profession'),
    ]);

    setCategories({
    causes: c.data,
    factors: f.data,
    professions: p.data,
    });
  } catch (error) {
    console.error('Lỗi đồng bộ dữ liệu:', error);
  } finally {
    setIsLoading(false);
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
        value={item.id.toString()}
        >
        [{causeGroupMap[item.causeGroup ?? 'OTHER']}]
        {' '}
        {item.code} - {item.name}
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
    const cleanValue = value === '' ? '0' : value;
    const isMoney = ['medicalCosts', 'treatmentSalaryCosts', 'compensationCosts', 'propertyDamage'].includes(key);
    const newValue = isMoney ? formatMoneyInput(cleanValue) : cleanIntegerString(cleanValue);

    const updatedStats = { ...prev.subsidizedStatistic, [key]: newValue };

    if (['medicalCosts', 'treatmentSalaryCosts', 'compensationCosts'].includes(key)) {
      const sum = parseMoneyToFloat(updatedStats.medicalCosts as string) + 
                  parseMoneyToFloat(updatedStats.treatmentSalaryCosts as string) + 
                  parseMoneyToFloat(updatedStats.compensationCosts as string);
      updatedStats.totalCosts = formatFloatToVNDString(sum);
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


const handlePrint = async () => {
  const id = params?.id;
  if (!id) return;

  const res = await api.get(`/reports/${id}/print`, {
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
  window.open(url);
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
        value={item.id.toString()}
        >
        {'—'.repeat(depth)}
        {depth > 0 ? ' ' : ''}
        {item.code} - {item.name}
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
    return items.map((item) => {
        const depth =
        Number(
            item.level?.replace(
            'Cấp ',
            ''
            )
        ) - 1;

        return (
            <option
                key={item.id}
                value={item.id}
            >
            {'—'.repeat(
            Math.max(depth, 0)
            )}
            {depth > 0 ? ' ' : ''}
            {item.code} - {item.name}
        </option>
        );
    });
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
        c => String(c.id) === String(code)
    );

    console.log({
    code,
    category
    });

if (!map.has(code)) {
    map.set(code, {
        id: String(category?.id ?? code),

        code: category?.code ?? "",

        name: category?.name ?? "",

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
    id: reportId,
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

    const {
      fileName,
      filePath,
    } = uploadRes.data.data;

    await api.patch(
      `/reports/${reportId}/attachment`,
      {
        attachment_name: fileName,
        attachment_url: filePath,
      }
    );

    if (fileUrl) URL.revokeObjectURL(fileUrl);

    const objectUrl = URL.createObjectURL(file);

    setSelectedFile(file);
    setSelectedFileName(fileName);
    setFileUrl(objectUrl);

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
          <button type="button" onClick={() => router.push('/dashboard/accidents-enterprise')} className="border border-gray-200 text-gray-600 hover:bg-gray-50 px-3.5 py-1.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer">❮ Quay lại</button>
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
              <button type="button" onClick={() => { setShowCancelWarning(false); router.push('/dashboard/accidents-enterprise'); }} className="px-5 py-2 bg-[#2F6BFF] hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer">Đồng ý</button>
            </div>
          </div>
        </div>
      )}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-800 mb-2">
            Báo cáo tổng hợp tình hình tai nạn lao động - Kỳ báo cáo: {periodName}
          </h2>

          <p className="text-xs text-gray-600 flex items-center gap-2">
            <span className="text-red-500 font-bold">**</span>

            File đính kèm báo cáo TNLĐ có dấu mộc công ty đã chọn:

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="application/pdf"
              onChange={handleFileChange}
            />

            {selectedFileName && (
              <>
                <span className="text-emerald-600 font-semibold truncate max-w-[200px]">
                  {selectedFileName}
                </span>

                {fileUrl && (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-bold"
                  >
                    Xem file
                  </a>
                )}
              </>
            )}
          </p>
        </div>

        <ReportSheet report={mapFormDataToReportData()} />

      </div>
    </div>
    
  );
  
};