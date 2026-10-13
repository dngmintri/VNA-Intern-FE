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

export const formatMoneyInput = (value: string): string => {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');

  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const parseMoney = (value: string): number => {
  if (!value) return 0;

  const digits = value.replace(/\D/g, '');

  return digits ? Number(digits) : 0;
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
export const ReportFormWizard: React.FC<WizardProps> = ({ reportId }) => {
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
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [periodName, setPeriodName] = useState<string>('');
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
      console.log(res);
      setPeriodName(res.reportPeriod?.name || `Kỳ báo cáo #${res.reportPeriodId}`);
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

  setFormData((prev) => {
    if (prev.generalDetails.length === count) return prev;

    let newDetails = [...prev.generalDetails];

    if (count === 0) {
      newDetails = [];
    } else if (newDetails.length > count) {
      newDetails = newDetails.slice(0, count);
    } else {
      const itemsToAdd = count - newDetails.length;
      for (let i = 0; i < itemsToAdd; i++) {
        newDetails.push({
          causeId: '',
          factorId: '',
          professionId: '',
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
        });
      }
    }

    return { ...prev, generalDetails: newDetails };
  });
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
    const sum =
        parseMoney(d.medicalCosts) +
        parseMoney(d.treatmentSalaryCosts) +
        parseMoney(d.compensationCosts);

    newDetails[index].totalCosts = formatMoneyInput(sum.toString());
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
        parseMoney(d.medicalCosts) +
        parseMoney(d.treatmentSalaryCosts) +
        parseMoney(d.compensationCosts),
    0
    );

    const totalDaysOff = details.reduce(
        (s, d) => s + Number(d.totalDaysOff || 0),
        0
    );

    const propertyDamage = details.reduce(
        (s, d) => s + parseMoney(d.propertyDamage),
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
        parseMoney(gs.totalCosts)
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
            `Tổng ngày nghỉ vì TNLĐ cảu chi tiết các vụ không được khác tổng số ngày nghỉ vì TNLĐ đã khai báo "${gs.totalDaysOff}"`;
        });
    }

    if (
        propertyDamage >
        parseMoney(gs.propertyDamage)
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
      parseMoney(value) > 0
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
      const sum =
          parseMoney(updatedStats.medicalCosts as string) +
          parseMoney(updatedStats.treatmentSalaryCosts as string) +
          parseMoney(updatedStats.compensationCosts as string);

      updatedStats.totalCosts = formatMoneyInput(sum.toString());
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
        total_salary_fund: parseMoney(formData.companyInfo.totalSalaryFund),
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

        medical_expenses: parseMoney(
            formData.generalStatistic.medicalCosts
        ),

        salary_paid_during_treatment: parseMoney(
            formData.generalStatistic.treatmentSalaryCosts
        ),

        compensation_expenses: parseMoney(
            formData.generalStatistic.compensationCosts
        ),

        total_leave_days:
            formData.generalStatistic.totalDaysOff,

        property_damage_expenses: parseMoney(
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

        medical_expenses: parseMoney(
            detail.medicalCosts
        ),

        salary_paid_during_treatment: parseMoney(
            detail.treatmentSalaryCosts
        ),

        compensation_expenses: parseMoney(
            detail.compensationCosts
        ),

        total_leave_days:
            detail.totalDaysOff,

        property_damage_expenses: parseMoney(
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

        medical_expenses: parseMoney(
            formData.subsidizedStatistic.medicalCosts
        ),

        salary_paid_during_treatment: parseMoney(
            formData.subsidizedStatistic.treatmentSalaryCosts
        ),

        compensation_expenses: parseMoney(
            formData.subsidizedStatistic.compensationCosts
        ),

        total_leave_days:
            formData.subsidizedStatistic.totalDaysOff,

        property_damage_expenses: parseMoney(
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

            medical_expenses: parseMoney(detail.medicalCosts),
            salary_paid_during_treatment: parseMoney(detail.treatmentSalaryCosts),
            compensation_expenses: parseMoney(detail.compensationCosts),
            total_leave_days: detail.totalDaysOff,
            property_damage_expenses: parseMoney(detail.propertyDamage),
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
      const sum =
          parseMoney(updatedStats.medicalCosts as string) +
          parseMoney(updatedStats.treatmentSalaryCosts as string) +
          parseMoney(updatedStats.compensationCosts as string);

      updatedStats.totalCosts = formatMoneyInput(sum.toString());
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
        parseMoney(d.totalCosts),

      totalDaysOff:
        acc.totalDaysOff +
        Number(d.totalDaysOff || 0),

      propertyDamage:
        acc.propertyDamage +
        parseMoney(d.propertyDamage),
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
      target: parseMoney(gs.totalCosts),
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
      target: parseMoney(gs.propertyDamage),
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
    period: '',
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
    medicalExpenses: parseMoney(g.medicalCosts || '0'),
    treatmentSalaryExpenses: parseMoney(g.treatmentSalaryCosts || '0'),
    compensationExpenses: parseMoney(g.compensationCosts || '0'),
    totalLeaveDays: g.totalDaysOff ?? 0,
    propertyDamageExpenses: parseMoney(g.propertyDamage || '0'),

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

  const handleNextStep = () => {
    if (hasValidationErrors()) {
      toast.error('Vui lòng sửa các lỗi số liệu đang hiển thị trước khi tiếp tục!');
      return;
    }
  if (currentStep === 1) {
    if (!formData.companyInfo.totalEmployees || !formData.companyInfo.totalFemaleEmployees || !formData.companyInfo.totalSalaryFund) {
      toast.error('Vui lòng điền đầy đủ thông tin doanh nghiệp (Tổng lao động, lao động nữ, quỹ lương)!');
      return;
    }
  }

  if (currentStep === 2) {
    const s = formData.generalStatistic;
    if (s.totalIncidents === 0) {
      const hasOtherValues = s.totalVictims > 0 || s.totalFatalities > 0 || parseMoney(s.totalCosts) > 0;
      if (hasOtherValues) {
        toast.error('Số vụ tai nạn bằng 0, không được điền số liệu nạn nhân hoặc chi phí!');
        return;
      }
    }
  }
    if (currentStep === 3) {
        const isStep3Valid = formData.generalDetails.every(
        (d) => d.causeId && d.factorId && d.professionId
        );
        
        if (!isStep3Valid) {
        toast.error('Vui lòng chọn đầy đủ Nguyên nhân, Yếu tố chấn thương và Nghề nghiệp cho các vụ tai nạn!');
        return;
        }
    }
  if (currentStep === 4 && !isStep4Filled()) {
    toast.error('Vui lòng điền giá trị (ít nhất là 0) vào các trường bắt buộc!');
    return;
  }
  if (currentStep < 5) setCurrentStep((prev) => prev + 1);
  };
  const handlePrevStep = () => { if (currentStep > 1) setCurrentStep((prev) => prev - 1); };

  if (isLoading) return <div className="text-center py-12 text-xs text-gray-400 animate-pulse">Đang đồng bộ hóa dữ liệu từ PostgreSQL...</div>;

  return (
    <div className="w-full h-full bg-[#F4F6F9] flex flex-col font-sans text-xs text-gray-700 select-none overflow-hidden min-h-screen">
      
      <div className="bg-white px-5 py-3 flex items-center justify-between border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400">Tai nạn lao động</span>
            <span className="text-xs text-gray-400">❯</span>
            <h1 className="text-sm font-bold text-gray-800">TNLĐ theo HĐLĐ</h1>
        </div>
        <div className="flex items-center gap-3 font-semibold">
          <input type="text" disabled value={reportYear} className="w-16 px-2 py-1 text-center border border-gray-200 rounded bg-gray-50 text-gray-700 font-bold" />
          <button type="button" onClick={() => setShowCancelWarning(true)} className="text-gray-500 hover:text-gray-700 px-2 py-1 cursor-pointer transition-colors">Huỷ bỏ</button>
          {currentStep > 1 && (
            <button type="button" onClick={handlePrevStep} className="border border-gray-200 text-gray-600 hover:bg-gray-50 px-3.5 py-1.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer">❮ Quay lại</button>
          )}

            {currentStep < 5 ? (
            <button
                type="button"
                onClick={handleNextStep}
                className="border border-blue-200 text-[#2F6BFF] hover:bg-blue-50 px-4 py-1.5 rounded-md flex items-center gap-1 font-bold transition-colors cursor-pointer"
            >
                Tiếp tục ❯
            </button>
            ) : (
            <>
            <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-1.5 border border-blue-600 hover:bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 bg-white cursor-pointer"
            >
            In báo cáo
            </button>

            <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            disabled={!fileUrl && !selectedFile} 
            className={`px-5 py-1.5 rounded-md font-bold transition-colors ${
                (!fileUrl && !selectedFile)
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-[#2F6BFF] hover:bg-blue-600 text-white cursor-pointer"
            }`}
            >
            Gửi báo cáo
            </button>
            </>
            )}
        </div>
      </div>

      <div className="p-6 space-y-4 flex-1 flex flex-col justify-start bg-white  ">
        
        <div className="w-full">
          <label className="text-[11px] font-bold text-gray-400 block mb-1">Chọn mục báo cáo</label>
          <select 
            value={currentStep === 1 ? 'info' : currentStep === 2 ? 'general_sum' : currentStep === 3 ? 'general_detail' : currentStep === 4 ? 'subsidized' : 'report_sheet'}
            onChange={(e) => handleDropdownCategoryChange(e.target.value)}
            className="w-130 p-2 border border-gray-200 rounded-lg text-gray-700 bg-white font-semibold focus:outline-none focus:border-blue-500 cursor-pointer text-xs"
          >
            <option value="info">Thông tin doanh nghiệp</option>
            <option value="general_sum">1. Tai nạn lao động — (1) Tổng số vụ tai nạn lao động</option>
            <option value="general_detail">1. Tai nạn lao động — (2) Chi tiết các vụ tai nạn lao động</option>
            <option value="subsidized">2. Tai nạn lao động được hưởng trợ cấp theo quy định tại Khoản 2 Điều 39 Luật ATVSLĐ</option>
            <option value="report_sheet">3. Xem tổng quan báo cáo tai nạn lao động</option>
          </select>
        </div>

        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn border-t border-gray-100 pt-5">
            <h3 className="font-bold text-gray-900 mb-1 text-xs">1. Thông tin công ty</h3>
            <p className="text-[10px] font-bold text-red-500 italic mb-5">*** Lưu ý: nhập tổng quỹ lương 6 tháng khi khai báo TNLĐ 6 tháng hoặc tổng quỹ lương 12 tháng khi khai báo TNLĐ cả năm</p>
            
            <div className="grid grid-cols-3 gap-x-5 gap-y-3">
              <div className="relative">
                <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Tên công ty</label>
                <input type="text" disabled value={formData.companyInfo.name} className="w-full p-2 border border-gray-200 bg-gray-50 rounded-lg font-medium text-gray-400" />
              </div>
              <div className="relative">
                <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Loại hình công ty</label>
                <input type="text" disabled value={formData.companyInfo.type} className="w-full p-2 border border-gray-200 bg-gray-50 rounded-lg font-medium text-gray-400" />
              </div>
              <div className="relative">
                <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Ngành nghề kinh doanh</label>
                <input type="text" disabled value={formData.companyInfo.industry} className="w-full p-2 border border-gray-200 bg-gray-50 rounded-lg font-medium text-gray-400" />
              </div>
              
              <div className="relative">
                <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Tổng số lao động của cơ sở <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={formData.companyInfo.totalEmployees === 0 ? '0' : formData.companyInfo.totalEmployees} 
                  onChange={(e) => {
                    const totalVal = cleanIntegerString(e.target.value);
                    setFormData(prev => {
                      const updated = { ...prev.companyInfo, totalEmployees: totalVal };
                      if (prev.companyInfo.totalFemaleEmployees > totalVal) {
                        setErrors(err => ({ ...err, femaleEmployees: 'Số lao động nữ không được vượt quá tổng số lao động!' }));
                      } else {
                        setErrors(err => ({ ...err, femaleEmployees: '' }));
                      }
                      return { ...prev, companyInfo: updated };
                    });
                  }} 
                  className="w-full p-2 border border-gray-200 rounded-lg font-semibold focus:outline-none focus:border-blue-500" 
                />
              </div>
              
              <div className="relative">
                <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Tổng số lao động nữ <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={formData.companyInfo.totalFemaleEmployees === 0 ? '0' : formData.companyInfo.totalFemaleEmployees} 
                  onChange={(e) => {
                    const inputFemale = cleanIntegerString(e.target.value);
                    setFormData(prev => {
                      if (inputFemale > prev.companyInfo.totalEmployees) {
                        setErrors(err => ({ ...err, femaleEmployees: 'Số lao động nữ không được vượt quá tổng số lao động!' }));
                      } else {
                        setErrors(err => ({ ...err, femaleEmployees: '' }));
                      }
                      return { ...prev, companyInfo: { ...prev.companyInfo, totalFemaleEmployees: inputFemale } };
                    });
                  }} 
                  className={`w-full p-2 border rounded-lg font-semibold focus:outline-none ${errors.femaleEmployees ? 'border-red-500 focus:border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-blue-500'}`} 
                />
                {errors.femaleEmployees && <span className="text-[10px] text-red-500 mt-1 block font-bold animate-fadeIn">{errors.femaleEmployees}</span>}
              </div>
              
              <div className="relative">
                <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Tổng quỹ lương <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={formData.companyInfo.totalSalaryFund === '0' ? '' : formData.companyInfo.totalSalaryFund} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({ ...prev, companyInfo: { ...prev.companyInfo, totalSalaryFund: formatMoneyInput(val) } }));
                    }} 
                    className="w-full p-2 border border-gray-200 rounded-lg font-semibold pr-14 focus:outline-none focus:border-blue-500" 
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-medium select-none">(1.000đ)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-3 animate-fadeIn border-t border-gray-100 pt-4">
            <div className="flex gap-6 border-b border-gray-100 pb-2 text-xs font-semibold">
              <button type="button" onClick={() => setCurrentStep(2)} className="text-[#2F6BFF] border-b-2 border-[#2F6BFF] pb-2 font-bold cursor-pointer">(1) Tổng số vụ tai nạn lao động</button>
              <button type="button" onClick={() => setCurrentStep(3)} className="text-gray-400 hover:text-gray-600 pb-2 cursor-pointer">(2) Chi tiết các vụ tai nạn lao động</button>
            </div>
            
            <p className="text-[10px] font-bold">**** Doanh nghiệp xảy ra tai nạn lao động vui lòng nhập theo từng bước</p>

            <div className="space-y-3">
              <h3 className="font-bold text-gray-900 text-xs">1. Tổng số vụ tai nạn lao động & số nạn nhân tai nạn lao động</h3>
              
              <div className="grid grid-cols-4 gap-x-5 gap-y-3 pt-2">
                <div className="relative">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Tổng số vụ <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.generalStatistic.totalIncidents === 0 ? '0' : formData.generalStatistic.totalIncidents} onChange={(e) => handleStep2FieldChange('totalIncidents', e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg font-semibold focus:outline-none focus:border-blue-500" />
                </div>

                <div className="relative">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Tổng số vụ có người chết <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.generalStatistic.incidentsWithFatalities === 0 ? '0' : formData.generalStatistic.incidentsWithFatalities} onChange={(e) => handleStep2FieldChange('incidentsWithFatalities', e.target.value)} className={`w-full p-2 border rounded-lg font-semibold focus:outline-none ${errors.incidentsWithFatalities ? 'border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-blue-500'}`} />
                  {errors.incidentsWithFatalities && <span className="text-[10px] text-red-500 mt-1 block font-bold">{errors.incidentsWithFatalities}</span>}
                </div>

                <div className="relative">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Tổng số vụ có 2 người bị nạn trở lên <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.generalStatistic.incidentsWithMultipleVictims === 0 ? '0' : formData.generalStatistic.incidentsWithMultipleVictims} onChange={(e) => handleStep2FieldChange('incidentsWithMultipleVictims', e.target.value)} className={`w-full p-2 border rounded-lg font-semibold focus:outline-none ${errors.incidentsWithMultipleVictims ? 'border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-blue-500'}`} />
                  {errors.incidentsWithMultipleVictims && <span className="text-[10px] text-red-500 mt-1 block font-bold">{errors.incidentsWithMultipleVictims}</span>}
                </div>

                <div className="relative invisible">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Tổng số vụ có 2 người bị nạn trở lên <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.generalStatistic.incidentsWithMultipleVictims === 0 ? '0' : formData.generalStatistic.incidentsWithMultipleVictims} onChange={(e) => handleStep2FieldChange('incidentsWithMultipleVictims', e.target.value)} className={`w-full p-2 border rounded-lg font-semibold focus:outline-none ${errors.incidentsWithMultipleVictims ? 'border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-blue-500'}`} />
                  {errors.incidentsWithMultipleVictims && <span className="text-[10px] text-red-500 mt-1 block font-bold">{errors.incidentsWithMultipleVictims}</span>}
                </div>

                <div className="relative">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Tổng số người bị nạn <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.generalStatistic.totalVictims === 0 ? '0' : formData.generalStatistic.totalVictims} onChange={(e) => handleStep2FieldChange('totalVictims', e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg font-semibold focus:outline-none focus:border-blue-500" />
                </div>

                <div className="relative">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Tổng số lao động nữ bị nạn <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.generalStatistic.totalFemaleVictims === 0 ? '0' : formData.generalStatistic.totalFemaleVictims} onChange={(e) => handleStep2FieldChange('totalFemaleVictims', e.target.value)} className={`w-full p-2 border rounded-lg font-semibold focus:outline-none ${errors.totalFemaleVictims ? 'border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-blue-500'}`} />
                  {errors.totalFemaleVictims && <span className="text-[10px] text-red-500 mt-1 block font-bold">{errors.totalFemaleVictims}</span>}
                </div>

                <div className="relative">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Tổng số người bị chết <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.generalStatistic.totalFatalities === 0 ? '0' : formData.generalStatistic.totalFatalities} onChange={(e) => handleStep2FieldChange('totalFatalities', e.target.value)} className={`w-full p-2 border rounded-lg font-semibold focus:outline-none ${errors.totalFatalities ? 'border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-blue-500'}`} />
                  {errors.totalFatalities && <span className="text-[10px] text-red-500 mt-1 block font-bold">{errors.totalFatalities}</span>}
                </div>

                <div className="relative">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Tổng số người bị thương nặng <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.generalStatistic.totalSevereInjuries === 0 ? '0' : formData.generalStatistic.totalSevereInjuries} onChange={(e) => handleStep2FieldChange('totalSevereInjuries', e.target.value)} className={`w-full p-2 border rounded-lg font-semibold focus:outline-none ${errors.totalSevereInjuries ? 'border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-blue-500'}`} />
                  {errors.totalSevereInjuries && <span className="text-[10px] text-red-500 mt-1 block font-bold">{errors.totalSevereInjuries}</span>}
                </div>

                <div className="relative">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Số người bị nạn không QL <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.generalStatistic.unmanagedVictims === 0 ? '0' : formData.generalStatistic.unmanagedVictims} onChange={(e) => handleStep2FieldChange('unmanagedVictims', e.target.value)} className={`w-full p-2 border rounded-lg font-semibold focus:outline-none ${errors.unmanagedVictims ? 'border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-blue-500'}`} />
                  {errors.unmanagedVictims && <span className="text-[10px] text-red-500 mt-1 block font-bold">{errors.unmanagedVictims}</span>}
                </div>

                <div className="relative">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Lao động nữ bị nạn không QL <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.generalStatistic.unmanagedFemaleVictims === 0 ? '0' : formData.generalStatistic.unmanagedFemaleVictims} onChange={(e) => handleStep2FieldChange('unmanagedFemaleVictims', e.target.value)} className={`w-full p-2 border rounded-lg font-semibold focus:outline-none ${errors.unmanagedFemaleVictims ? 'border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-blue-500'}`} />
                  {errors.unmanagedFemaleVictims && <span className="text-[10px] text-red-500 mt-1 block font-bold">{errors.unmanagedFemaleVictims}</span>}
                </div>

                <div className="relative">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Số người chết không QL <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.generalStatistic.unmanagedFatalities === 0 ? '0' : formData.generalStatistic.unmanagedFatalities} onChange={(e) => handleStep2FieldChange('unmanagedFatalities', e.target.value)} className={`w-full p-2 border rounded-lg font-semibold focus:outline-none ${errors.unmanagedFatalities ? 'border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-blue-500'}`} />
                  {errors.unmanagedFatalities && <span className="text-[10px] text-red-500 mt-1 block font-bold">{errors.unmanagedFatalities}</span>}
                </div>

                <div className="relative">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Người bị thương nặng không QL <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.generalStatistic.unmanagedSevereInjuries === 0 ? '0' : formData.generalStatistic.unmanagedSevereInjuries} onChange={(e) => handleStep2FieldChange('unmanagedSevereInjuries', e.target.value)} className={`w-full p-2 border rounded-lg font-semibold focus:outline-none ${errors.unmanagedSevereInjuries ? 'border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-blue-500'}`} />
                  {errors.unmanagedSevereInjuries && <span className="text-[10px] text-red-500 mt-1 block font-bold">{errors.unmanagedSevereInjuries}</span>}
                </div>

                <div className="flex flex-col opacity-0 pointer-events-none select-none" aria-hidden="true" />
              </div>

              <h3 className="font-bold text-gray-900 pt-2 text-xs">2. Thiệt hại do tai nạn lao động</h3>
              
              <div className="grid grid-cols-4 gap-x-5 gap-y-3 pt-2">
                <div className="relative">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Chi phí y tế <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="text" value={formData.generalStatistic.medicalCosts === '0' ? '' : formData.generalStatistic.medicalCosts} onChange={(e) => handleStep2CostChange('medicalCosts', e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg font-semibold pr-14 focus:outline-none focus:border-blue-500" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 select-none">(1.000đ)</span>
                  </div>
                </div>

                <div className="relative">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Chi phí trả lương trong thời gian điều trị <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="text" value={formData.generalStatistic.treatmentSalaryCosts === '0' ? '' : formData.generalStatistic.treatmentSalaryCosts} onChange={(e) => handleStep2CostChange('treatmentSalaryCosts', e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg font-semibold pr-14 focus:outline-none focus:border-blue-500" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 select-none">(1.000đ)</span>
                  </div>
                </div>

                <div className="relative">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Chi phí bồi thường trợ cấp <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="text" value={formData.generalStatistic.compensationCosts === '0' ? '' : formData.generalStatistic.compensationCosts} onChange={(e) => handleStep2CostChange('compensationCosts', e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg font-semibold pr-14 focus:outline-none focus:border-blue-500" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 select-none">(1.000đ)</span>
                  </div>
                </div>

                <div className="relative">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Tổng số tiền chi phí <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="text" disabled value={formData.generalStatistic.totalCosts || ''} className="w-full p-2 border border-gray-250 bg-gray-50 text-gray-500 font-bold rounded-lg pr-14 cursor-not-allowed" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 select-none">(1.000đ)</span>
                  </div>
                </div>

                <div className="relative">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Tổng số ngày nghỉ vì TNLĐ <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.generalStatistic.totalDaysOff === 0 ? '0' : formData.generalStatistic.totalDaysOff} onChange={(e) => setFormData(prev => ({ ...prev, generalStatistic: { ...prev.generalStatistic, totalDaysOff: cleanIntegerString(e.target.value) } }))} className="w-full p-2 border border-gray-200 rounded-lg font-semibold focus:outline-none focus:border-blue-500" />
                </div>

                <div className="relative">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Thiệt hại tài sản</label>
                  <div className="relative">
                    <input type="text" value={formData.generalStatistic.propertyDamage === '0' ? '' : formData.generalStatistic.propertyDamage} onChange={(e) => handleStep2CostChange('propertyDamage', e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg font-semibold pr-14 focus:outline-none focus:border-blue-500" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 select-none">(1.000đ)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {currentStep === 3 && (
        <div className="space-y-6 animate-fadeIn border-t border-gray-100 pt-4">
            <div className="flex gap-6 border-b border-gray-100 pb-2 text-xs font-semibold">
            <button type="button" onClick={() => setCurrentStep(2)} className="text-gray-400 hover:text-gray-600 pb-2 cursor-pointer">(1) Tổng số vụ tai nạn lao động</button>
            <button type="button" onClick={() => setCurrentStep(3)} className="text-[#2F6BFF] border-b-2 border-[#2F6BFF] pb-2 font-bold cursor-pointer">(2) Chi tiết các vụ tai nạn lao động</button>
            </div>

            {formData.generalDetails.map((detail: DetailItem, index: number) => (
            <div key={index} className="border border-gray-200 rounded-xl p-5 space-y-5 pt-6 bg-white shadow-sm">
                <span className="font-bold text-gray-800 block text-xs border-b pb-2">Chi tiết vụ tai nạn số {index + 1}</span>
                
                <div className="grid grid-cols-2 gap-6">
                <div className="relative">
                <h4 className="font-bold text-gray-800 text-xs">1. Phân theo nguyên nhân xảy ra TNLĐ</h4>
                <select
                value={detail.causeId}
                onChange={(e) =>
                    updateDetail(
                    index,
                    'causeId',
                    e.target.value
                    )
                }
                className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                >
                <option value="">
                    Chọn nguyên nhân
                </option>

                {renderAccidentCauseOptions(
                    categories.causes
                )}
                </select>
                </div>
                <div className="relative">
                <h4 className="font-bold text-gray-800 text-xs">2. Phân theo yếu tố chấn thương</h4>
                <select
                value={detail.factorId}
                onChange={(e) =>
                    updateDetail(
                    index,
                    'factorId',
                    e.target.value
                    )
                }
                className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                >
                <option value="">
                    Chọn yếu tố chấn thương
                </option>

                {renderFactorOptions(
                    categories.factors
                )}
                </select>
                </div>
                <div className="relative">
                <h4 className="font-bold text-gray-800 text-xs">3. Phân theo nghề nghiệp</h4>                    
                <select
                value={detail.professionId}
                onChange={(e) =>
                    updateDetail(
                    index,
                    'professionId',
                    e.target.value
                    )
                }
                className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                >
                <option value="">
                    Chọn nghề nghiệp
                </option>
                    {renderProfessionOptions(
                        categories.professions.filter(
                            profession => profession.level === "Cấp 4"
                        )
                    )}
                </select>
                </div>
                </div>

                <h4 className="font-bold text-gray-800 text-xs mt-4">4. Chi tiết vụ tai nạn số {index + 1}</h4>
                <div className="grid grid-cols-4 gap-x-5 gap-y-5">
         <div className="relative">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Tổng số người bị nạn <span className="text-red-500">*</span></label>
                    <input
                    type="text"
                    value={detail.totalVictims || '0'}
                    onChange={(e) =>
                        updateDetail(
                        index,
                        'totalVictims',
                        Number(
                            cleanIntegerString(e.target.value)
                        )
                        )
                    }
                    className={`w-full p-2 border border-gray-200 rounded-lg font-semibold pr-14 focus:outline-none focus:border-blue-500 ${
                        detailErrors[index]?.totalVictims
                        ? 'border-red-500'
                        : 'border-gray-200'
                    }`}
                    />

                    {detailErrors[index]?.totalVictims && (
                    <span className="text-[10px] text-red-500 mt-1 block font-bold">
                        {detailErrors[index]?.totalVictims}
                    </span>
                    )}
                </div>
                    
                <div className="relative">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Tổng số lao động nữ bị nạn <span className="text-red-500">*</span></label>
                  <input type="text" value={detail.totalFemaleVictims || '0'}
                    onChange={(e) =>
                    updateDetail(
                        index,
                        'totalFemaleVictims',
                        Number(cleanIntegerString(e.target.value))
                    )
                    } className={`w-full p-2 border rounded-lg font-semibold focus:outline-none ${errors.totalFemaleVictims ? 'border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-blue-500'}`} />
                    {detailErrors[index]?.totalFemaleVictims && (
                    <span className="text-[10px] text-red-500 mt-1 block font-bold">
                        {detailErrors[index].totalFemaleVictims}
                    </span>
                    )}                
                </div>

                <div className="relative">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Tổng số người bị chết <span className="text-red-500">*</span></label>
                  <input type="text" value={detail.totalFatalities || '0'}
                    onChange={(e) =>
                    updateDetail(
                        index,
                        'totalFatalities',
                        Number(cleanIntegerString(e.target.value))
                    )
                    } className={`w-full p-2 border rounded-lg font-semibold focus:outline-none ${errors.totalFatalities ? 'border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-blue-500'}`} />
                    {detailErrors[index]?.totalFatalities && (
                    <span className="text-[10px] text-red-500 mt-1 block font-bold">
                        {detailErrors[index].totalFatalities}
                    </span>
                    )}                  
                    </div>

                <div className="relative">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Tổng số người bị thương nặng <span className="text-red-500">*</span></label>
                  <input type="text"value={detail.totalSevereInjuries || '0'}
                    onChange={(e) =>
                    updateDetail(
                        index,
                        'totalSevereInjuries',
                        Number(cleanIntegerString(e.target.value))
                    )
                    } className={`w-full p-2 border rounded-lg font-semibold focus:outline-none ${errors.totalSevereInjuries ? 'border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-blue-500'}`} />
                    {detailErrors[index]?.totalSevereInjuries && (
                    <span className="text-[10px] text-red-500 mt-1 block font-bold">
                        {detailErrors[index].totalSevereInjuries}
                    </span>
                    )}                      
                    </div>

                <div className="relative">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Số người bị nạn không QL <span className="text-red-500">*</span></label>
                  <input type="text" 
                  value={detail.unmanagedVictims || '0'}
                    onChange={(e) =>
                    updateDetail(
                        index,
                        'unmanagedVictims',
                        Number(cleanIntegerString(e.target.value))
                    )
                    }
                  className={`w-full p-2 border rounded-lg font-semibold focus:outline-none ${errors.unmanagedVictims ? 'border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-blue-500'}`} />

                    {detailErrors[index]?.unmanagedVictims && (
                    <span className="text-[10px] text-red-500 mt-1 block font-bold">
                        {detailErrors[index]?.unmanagedVictims}
                    </span>
                    )}                
                    </div>

                <div className="relative">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Lao động nữ bị nạn không QL <span className="text-red-500">*</span></label>
                  <input type="text"
                    value={detail.unmanagedFemaleVictims || '0'}
                    onChange={(e) =>
                    updateDetail(
                        index,
                        'unmanagedFemaleVictims',
                        Number(cleanIntegerString(e.target.value))
                    )
                    }                   
                    className={`w-full p-2 border rounded-lg font-semibold focus:outline-none ${errors.unmanagedFemaleVictims ? 'border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-blue-500'}`} />
                    {detailErrors[index]?.unmanagedFemaleVictims && (
                    <span className="text-[10px] text-red-500 mt-1 block font-bold">
                        {detailErrors[index].unmanagedFemaleVictims}
                    </span>
                    )}                      
                    </div>

                <div className="relative">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Số người chết không QL <span className="text-red-500">*</span></label>
                  <input type="text"
                    value={detail.unmanagedFatalities || '0'}
                    onChange={(e) =>
                    updateDetail(
                        index,
                        'unmanagedFatalities',
                        Number(cleanIntegerString(e.target.value))
                    )
                    }                   
                    className={`w-full p-2 border rounded-lg font-semibold focus:outline-none ${errors.unmanagedFatalities ? 'border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-blue-500'}`} />
                    {detailErrors[index]?.unmanagedFatalities && (
                    <span className="text-[10px] text-red-500 mt-1 block font-bold">
                        {detailErrors[index].unmanagedFatalities}
                    </span>
                    )}                      
                    </div>

                <div className="relative">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Người bị thương nặng không QL <span className="text-red-500">*</span></label>
                  <input type="text"
                    value={detail.unmanagedSevereInjuries || '0'}
                    onChange={(e) =>
                    updateDetail(
                        index,
                        'unmanagedSevereInjuries',
                        Number(cleanIntegerString(e.target.value))
                    )
                    }                   
                    className={`w-full p-2 border rounded-lg font-semibold focus:outline-none ${errors.unmanagedSevereInjuries ? 'border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-blue-500'}`} />
                    {detailErrors[index]?.unmanagedSevereInjuries && (
                    <span className="text-[10px] text-red-500 mt-1 block font-bold">
                        {detailErrors[index].unmanagedSevereInjuries}
                    </span>
                    )}                      
                    </div>
                </div>

                <h4 className="font-bold text-gray-800 text-xs mt-4">5. Thiệt hại do tai nạn lao động số {index + 1}</h4>
                <div className="grid grid-cols-4 gap-x-5 gap-y-3 pt-2">
                <div className="relative">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Chi phí y tế <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="text"
                        value={detail.medicalCosts}
                        onChange={(e) =>
                        updateDetail(
                            index,
                            'medicalCosts',
                            formatMoneyInput(e.target.value)
                        )
                        }                   
                        className="w-full p-2 border border-gray-200 rounded-lg font-semibold pr-14 focus:outline-none focus:border-blue-500" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 select-none">(1.000đ)</span>
                  </div>
                </div>

                <div className="relative">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Chi phí trả lương trong thời gian điều trị <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="text"
                        value={detail.treatmentSalaryCosts}
                        onChange={(e) =>
                        updateDetail(
                            index,
                            'treatmentSalaryCosts',
                            formatMoneyInput(e.target.value)
                        )
                        }            
                     className="w-full p-2 border border-gray-200 rounded-lg font-semibold pr-14 focus:outline-none focus:border-blue-500" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 select-none">(1.000đ)</span>
                  </div>
                </div>

                <div className="relative">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Chi phí bồi thường trợ cấp <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="text" 
                        value={detail.compensationCosts}
                        onChange={(e) =>
                        updateDetail(
                            index,
                            'compensationCosts',
                            formatMoneyInput(e.target.value)
                        )
                        }               
                    className="w-full p-2 border border-gray-200 rounded-lg font-semibold pr-14 focus:outline-none focus:border-blue-500" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 select-none">(1.000đ)</span>
                  </div>
                </div>

                <div className="relative">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Tổng số tiền chi phí <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                        value={detail.totalCosts}
                        readOnly
                        className={`w-full p-2 border border-gray-200 rounded-lg font-semibold pr-14 focus:outline-none focus:border-blue-500${
                            detailErrors[index]?.totalCosts
                            ? 'border-red-500'
                            : 'border-gray-200 bg-gray-100'
                        }`}
                        />

                        {detailErrors[index]?.totalCosts && (
                        <span className="text-[10px] text-red-500 mt-1 block font-bold">
                            {detailErrors[index].totalCosts}
                        </span>
                        )}
                  </div>
                </div>

                <div className="relative">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Tổng số ngày nghỉ vì TNLĐ <span className="text-red-500">*</span></label>
                  <input type="text" 
                    value={detail.totalDaysOff || '0'}
                    onChange={(e) =>
                    updateDetail(
                        index,
                        'totalDaysOff',
                        Number(cleanIntegerString(e.target.value))
                    )
                    }                  
                className="w-full p-2 border border-gray-200 rounded-lg font-semibold focus:outline-none focus:border-blue-500" />
                    {detailErrors[index]?.totalDaysOff && (
                    <span className="text-[10px] text-red-500 mt-1 block font-bold">
                        {detailErrors[index]?.totalDaysOff}
                    </span>
                    )}
                </div>

                <div className="relative">
                  <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">Thiệt hại tài sản</label>
                  <div className="relative">
                    <input type="text" 
                        value={detail.propertyDamage || ''}
                        onChange={(e) =>
                        updateDetail(
                            index,
                            'propertyDamage',
                            formatMoneyInput(e.target.value)
                        )
                        }                    
                    className="w-full p-2 border border-gray-200 rounded-lg font-semibold pr-14 focus:outline-none focus:border-blue-500" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 select-none">(1.000đ)</span>
                  {detailErrors[index]?.propertyDamage && (
                    <span className="text-[10px] text-red-500 mt-1 block font-bold">
                        {detailErrors[index].propertyDamage}
                    </span>
                    )}
                                    
                    </div>
                </div>
              </div>
                </div>
            ))}
        </div>
        )}

        {currentStep === 4 && (
        <div className="space-y-6 animate-fadeIn border-t border-gray-100 pt-4">
            <h3 className="font-bold text-gray-900 text-xs">1. Tổng số vụ & số nạn nhân</h3>
            <div className="grid grid-cols-4 gap-x-5 gap-y-5">
            {[
                { key: 'totalIncidents', label: 'Tổng số vụ' },
                { key: 'incidentsWithFatalities', label: 'Tổng số vụ có người chết' },
                { key: 'incidentsWithMultipleVictims', label: 'Tổng số vụ có 2 người bị nạn trở lên' },
                { key: 'invisible', label: '', className: 'invisible' },
                { key: 'totalVictims', label: 'Tổng số người bị nạn' },
                { key: 'totalFemaleVictims', label: 'Tổng số lao động nữ bị nạn' },
                { key: 'totalFatalities', label: 'Tổng số người bị chết' },
                { key: 'totalSevereInjuries', label: 'Tổng số người bị thương nặng' },
                { key: 'unmanagedVictims', label: 'Số người bị nạn không QL' },
                { key: 'unmanagedFemaleVictims', label: 'Lao động nữ bị nạn không QL' },
                { key: 'unmanagedFatalities', label: 'Số người chết không QL' },
                { key: 'unmanagedSevereInjuries', label: 'Người bị thương nặng không QL' },
            ].map((item) => (
                <div key={item.key} className={`relative ${item.className || ''}`}>
                {item.key !== 'invisible' && (
                    <>
                    <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">
                        {item.label} <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="text" 
                        value={formData.subsidizedStatistic[item.key as keyof StatisticData] === 0 ? '0' : formData.subsidizedStatistic[item.key as keyof StatisticData]} 
                        onChange={(e) => handleStep4Change(item.key as keyof StatisticData, e.target.value)} 
                        className={`w-full p-2 border rounded-lg font-semibold pr-2 focus:outline-none focus:border-blue-500 ${errors[item.key as keyof FormErrorsState] ? 'border-red-500 bg-red-50/30' : 'border-gray-200'}`} 
                    />
                    {errors[item.key as keyof FormErrorsState] && (
                        <span className="text-[10px] text-red-500 mt-1 block font-bold">{errors[item.key as keyof FormErrorsState]}</span>
                    )}
                    </>
                )}
                </div>
            ))}
            </div>

            <h3 className="font-bold text-gray-900 text-xs pt-4">2. Thiệt hại do tai nạn lao động</h3>
            <div className="grid grid-cols-4 gap-x-5 gap-y-5">
            {[
                { key: 'medicalCosts', label: 'Chi phí y tế' },
                { key: 'treatmentSalaryCosts', label: 'Chi phí trả lương điều trị' },
                { key: 'compensationCosts', label: 'Chi phí bồi thường' },
                { key: 'totalCosts', label: 'Tổng số tiền chi phí' },
                { key: 'totalDaysOff', label: 'Tổng số ngày nghỉ' },
                { key: 'propertyDamage', label: 'Thiệt hại tài sản' },
            ].map((item) => (
                <div key={item.key} className="relative">
                <label className="absolute -top-2 left-2 bg-white px-1 text-gray-400 font-semibold scale-90 origin-left z-10">{item.label} <span className="text-red-500">*</span></label>
                <input 
                    type="text" 
                    readOnly={item.key === 'totalCosts'}
                    value={formData.subsidizedStatistic[item.key as keyof StatisticData] || '0'} 
                    onChange={(e) => handleStep4Change(item.key as keyof StatisticData, e.target.value)} 
                    className={`w-full p-2 border rounded-lg font-semibold pr-14 focus:outline-none focus:border-blue-500 ${item.key === 'totalCosts' ? 'bg-gray-50 text-gray-500' : 'border-gray-200'} ${errors[item.key as keyof FormErrorsState] ? 'border-red-500' : ''}`} 
                />
                {errors[item.key as keyof FormErrorsState] && (
                    <span className="text-[10px] text-red-500 mt-1 block font-bold">{errors[item.key as keyof FormErrorsState]}</span>
                )}
                {item.key !== 'totalDaysOff' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 select-none">(1.000đ)</span>}
                </div>
            ))}
            </div>
        </div>
        )}
      </div>
        
        {currentStep === 5 && (
        <div className="p-3 bg-white min-h-screen">
            <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-800 mb-2">
                Báo cáo tổng hợp tình hình tai nạn lao động - Kỳ báo cáo: {periodName}
            </h2>
            <p className="text-xs text-gray-600 flex items-center gap-2">
            <span className="text-red-500 font-bold">**</span>
            Vui lòng đính kèm báo cáo TNLĐ có dấu mộc công ty: 
            
            <button 
                type="button"
                onClick={() => fileInputRef.current?.click()} 
                className="text-blue-600 hover:underline font-semibold cursor-pointer"
            >
                Tại đây
            </button>
            
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
            
            <div className="mt-6 flex justify-end">
            </div>
        </div>
        )}
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
              <button type="button" onClick={() => setShowCancelWarning(false)} className="px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-50 border border-gray-200 transition-colors cursor-pointer">Huỷ bỏ</button>
              <button type="button" onClick={() => { setShowCancelWarning(false); router.push('/dashboard/accidents-enterprise'); }} className="px-5 py-2 bg-[#2F6BFF] hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer">Đồng ý</button>
            </div>
          </div>
        </div>
      )}
        {showPreviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            
            <div className="bg-white w-[95%] h-[95%] rounded-lg shadow-xl flex flex-col overflow-hidden">
            
            <div className="flex justify-between items-center px-4 py-3 border-b bg-white">
                <h2 className="font-bold text-gray-700 text-sm">
                Xem trước báo cáo
                </h2>

                <button
                onClick={() => setShowPreviewModal(false)}
                className="text-red-500 font-bold text-lg"
                >
                ✕
                </button>
            </div>

            <div className="px-4 py-3 border-b bg-gray-50">
                <h2 className="text-sm font-bold text-gray-800 mb-2">
                Báo cáo tổng hợp tình hình tai nạn lao động - Kỳ báo cáo: {periodName}
                </h2>

                <p className="text-xs text-gray-600 flex items-center gap-2 flex-wrap">
                <span className="text-red-500 font-bold">**</span>
                Vui lòng đính kèm báo cáo TNLĐ có dấu mộc công ty:

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:underline font-semibold"
                >
                    Tại đây
                </button>

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="application/pdf"
                    onChange={handleFileChange}
                />

                {selectedFileName && (
                    <span className="text-emerald-600 font-semibold ml-2">
                    {selectedFileName}
                    </span>
                )}

                {fileUrl && (
                    <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-bold ml-2"
                    >
                    Xem file
                    </a>
                )}
                </p>
            </div>

            <div className="flex-1 overflow-auto p-3 bg-gray-50">
                <ReportSheet report={mapFormDataToReportData()} />
            </div>

            <div className="flex justify-end gap-3 px-4 py-3 border-t bg-white">
                
                <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                Huỷ
                </button>

                <button
                onClick={handleSaveSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                Xác nhận gửi
                </button>

            </div>

            </div>
        </div>
        )}
    </div>
  );
};