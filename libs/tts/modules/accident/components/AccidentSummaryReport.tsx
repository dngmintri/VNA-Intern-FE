'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/libs/core/api/axios';

interface ReportPeriod {
  id: number;
  name: string;
  year: number;
}

export interface SummaryOverviewRow {
  entityType?: string;
  code?: string;
  businessTypeName?: string;
  businessTypeCode?: string;
  totalCompanies: number;
  participatingCompanies?: number;
  totalEmployees: number;
  reportingEmployees?: number;
  femaleEmployees: number;
  totalVictims: number;
  totalFatalities?: number;
  totalSevereInjuries?: number;
  ktnld?: number;
  kChet?: number;
  fatalVictims?: number;
  seriouslyInjuredVictims?: number;
  accidentFrequencyRate?: number;
  fatalFrequencyRate?: number;
  note?: string;
}

export interface SummaryClassificationRow {
  categoryName?: string;
  categoryCode?: string;
  subCategoryName?: string;
  code?: string;
  totalIncidents?: number;
  incidentsWithFatalities?: number;
  incidentsWithMultipleVictims?: number;
  totalVictims?: number;
  totalFemaleVictims?: number;
  totalFatalities?: number;
  totalSevereInjuries?: number;
  totalDaysOff?: number;
  totalCosts?: number;
  medicalCosts?: number;
  treatmentSalaryCosts?: number;
  compensationCosts?: number;
  propertyDamage?: number;
  fatalIncidents?: number;
  multipleVictimIncidents?: number;
  femaleVictims?: number;
  fatalities?: number;
  seriouslyInjured?: number;
  totalLeaveDays?: number;
  totalExpense?: number;
  medicalExpense?: number;
  treatmentSalaryExpense?: number;
  compensationExpense?: number;
  propertyDamageExpense?: number;
}

export interface SummaryData {
  sectionOne?: {
    rows: SummaryOverviewRow[];
    total: {
      totalCompanies: number;
      totalEmployees: number;
      femaleEmployees: number;
      totalIncidents: number;
      incidentsWithFatalities: number;
      incidentsWithMultipleVictims: number;
      totalVictims: number;
      totalFemaleVictims: number;
      totalFatalities: number;
      totalSevereInjuries: number;
      ktnld: number;
      kChet: number;
    };
  };
  sectionTwo?: {
    byProfession: SummaryClassificationRow[];
    byAccidentCause: SummaryClassificationRow[];
    byInjuryFactor: SummaryClassificationRow[];
  };
}

interface SummaryTotals {
  totalIncidents: number;
  fatalIncidents: number;
  multipleVictimIncidents: number;
  totalVictims: number;
  femaleVictims: number;
  fatalities: number;
  seriouslyInjured: number;
  totalLeaveDays: number;
  totalExpense: number;
  medicalExpense: number;
  treatmentSalaryExpense: number;
  compensationExpense: number;
  propertyDamageExpense: number;
}

interface Props {
  year: number;
  periodText: string;
  onBack: () => void;
  provinceId?: number;
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('de-DE').format(value);
};

const formatDecimal = (value: number) => {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const MOCK_OVERVIEW_ROWS: SummaryOverviewRow[] = [
  {
    entityType: 'Doanh nghiệp nhà nước',
    code: '',
    totalCompanies: 15,
    participatingCompanies: 12,
    totalEmployees: 4500,
    reportingEmployees: 3800,
    femaleEmployees: 1800,
    totalVictims: 8,
    fatalVictims: 1,
    seriouslyInjuredVictims: 3,
    accidentFrequencyRate: 1.78,
    fatalFrequencyRate: 0.22,
    note: '',
  },
  {
    entityType: 'Công ty trách nhiệm hữu hạn',
    code: '',
    totalCompanies: 120,
    participatingCompanies: 95,
    totalEmployees: 25400,
    reportingEmployees: 21100,
    femaleEmployees: 11500,
    totalVictims: 35,
    fatalVictims: 3,
    seriouslyInjuredVictims: 12,
    accidentFrequencyRate: 1.38,
    fatalFrequencyRate: 0.12,
    note: '',
  },
  {
    entityType: 'Công ty cổ phần',
    code: '',
    totalCompanies: 85,
    participatingCompanies: 72,
    totalEmployees: 34200,
    reportingEmployees: 30500,
    femaleEmployees: 14800,
    totalVictims: 42,
    fatalVictims: 4,
    seriouslyInjuredVictims: 18,
    accidentFrequencyRate: 1.23,
    fatalFrequencyRate: 0.12,
    note: '',
  },
  {
    entityType: 'Công ty hợp danh',
    code: '',
    totalCompanies: 4,
    participatingCompanies: 3,
    totalEmployees: 150,
    reportingEmployees: 120,
    femaleEmployees: 50,
    totalVictims: 0,
    fatalVictims: 0,
    seriouslyInjuredVictims: 0,
    accidentFrequencyRate: 0.00,
    fatalFrequencyRate: 0.00,
    note: '',
  },
  {
    entityType: 'Doanh nghiệp tư nhân',
    code: '',
    totalCompanies: 45,
    participatingCompanies: 30,
    totalEmployees: 1200,
    reportingEmployees: 950,
    femaleEmployees: 420,
    totalVictims: 5,
    fatalVictims: 0,
    seriouslyInjuredVictims: 2,
    accidentFrequencyRate: 4.17,
    fatalFrequencyRate: 0.00,
    note: '',
  },
  {
    entityType: 'Doanh nghiệp có vốn đầu tư nước ngoài',
    code: '',
    totalCompanies: 62,
    participatingCompanies: 55,
    totalEmployees: 48900,
    reportingEmployees: 45200,
    femaleEmployees: 29500,
    totalVictims: 18,
    fatalVictims: 1,
    seriouslyInjuredVictims: 5,
    accidentFrequencyRate: 0.37,
    fatalFrequencyRate: 0.02,
    note: '',
  },
  {
    entityType: 'Đơn vị kinh tế tập thể',
    code: '',
    totalCompanies: 18,
    participatingCompanies: 10,
    totalEmployees: 650,
    reportingEmployees: 400,
    femaleEmployees: 210,
    totalVictims: 1,
    fatalVictims: 0,
    seriouslyInjuredVictims: 0,
    accidentFrequencyRate: 1.54,
    fatalFrequencyRate: 0.00,
    note: '',
  },
  {
    entityType: 'Đơn vị kinh tế cá thể',
    code: '',
    totalCompanies: 210,
    participatingCompanies: 140,
    totalEmployees: 1850,
    reportingEmployees: 1400,
    femaleEmployees: 720,
    totalVictims: 4,
    fatalVictims: 0,
    seriouslyInjuredVictims: 1,
    accidentFrequencyRate: 2.16,
    fatalFrequencyRate: 0.00,
    note: '',
  },
  {
    entityType: 'Đơn vị hành chính sự nghiệp, đảng, đoàn thể, hiệp hội',
    code: '',
    totalCompanies: 35,
    participatingCompanies: 32,
    totalEmployees: 3200,
    reportingEmployees: 3000,
    femaleEmployees: 1650,
    totalVictims: 0,
    fatalVictims: 0,
    seriouslyInjuredVictims: 0,
    accidentFrequencyRate: 0.00,
    fatalFrequencyRate: 0.00,
    note: '',
  }
];

const MOCK_CLASSIFICATION_ROWS: SummaryClassificationRow[] = [
  {
    categoryName: 'Phân theo ngành nghề',
    subCategoryName: 'Xây dựng',
    code: '1',
    totalIncidents: 25,
    fatalIncidents: 5,
    multipleVictimIncidents: 3,
    totalVictims: 32,
    femaleVictims: 4,
    fatalities: 6,
    seriouslyInjured: 15,
    totalLeaveDays: 450,
    totalExpense: 1250000,
    medicalExpense: 350000,
    treatmentSalaryExpense: 300000,
    compensationExpense: 600000,
    propertyDamageExpense: 850000,
  },
  {
    categoryName: 'Phân theo ngành nghề',
    subCategoryName: 'Khai thác khoáng sản',
    code: '2',
    totalIncidents: 8,
    fatalIncidents: 2,
    multipleVictimIncidents: 1,
    totalVictims: 11,
    femaleVictims: 0,
    fatalities: 3,
    seriouslyInjured: 5,
    totalLeaveDays: 180,
    totalExpense: 580000,
    medicalExpense: 120000,
    treatmentSalaryExpense: 160000,
    compensationExpense: 300000,
    propertyDamageExpense: 1200000,
  },
  {
    categoryName: 'Phân theo ngành nghề',
    subCategoryName: 'Sản xuất kim loại',
    code: '3',
    totalIncidents: 14,
    fatalIncidents: 1,
    multipleVictimIncidents: 2,
    totalVictims: 18,
    femaleVictims: 2,
    fatalities: 1,
    seriouslyInjured: 8,
    totalLeaveDays: 240,
    totalExpense: 420000,
    medicalExpense: 150000,
    treatmentSalaryExpense: 120000,
    compensationExpense: 150000,
    propertyDamageExpense: 450000,
  },
  {
    categoryName: 'Phân theo ngành nghề',
    subCategoryName: 'Sản xuất hoá chất',
    code: '4',
    totalIncidents: 6,
    fatalIncidents: 1,
    multipleVictimIncidents: 1,
    totalVictims: 9,
    femaleVictims: 3,
    fatalities: 1,
    seriouslyInjured: 4,
    totalLeaveDays: 150,
    totalExpense: 380000,
    medicalExpense: 110000,
    treatmentSalaryExpense: 90000,
    compensationExpense: 180000,
    propertyDamageExpense: 920000,
  },
  {
    categoryName: 'Phân theo ngành nghề',
    subCategoryName: 'Sản xuất vật liệu xây dựng',
    code: '5',
    totalIncidents: 12,
    fatalIncidents: 1,
    multipleVictimIncidents: 1,
    totalVictims: 14,
    femaleVictims: 1,
    fatalities: 1,
    seriouslyInjured: 6,
    totalLeaveDays: 210,
    totalExpense: 310000,
    medicalExpense: 90000,
    treatmentSalaryExpense: 100000,
    compensationExpense: 120000,
    propertyDamageExpense: 350000,
  },
  {
    categoryName: 'Phân theo ngành nghề',
    subCategoryName: 'Nông nghiệp, lâm nghiệp và thuỷ sản',
    code: '6',
    totalIncidents: 10,
    fatalIncidents: 0,
    multipleVictimIncidents: 0,
    totalVictims: 10,
    femaleVictims: 4,
    fatalities: 0,
    seriouslyInjured: 3,
    totalLeaveDays: 120,
    totalExpense: 150000,
    medicalExpense: 50000,
    treatmentSalaryExpense: 60000,
    compensationExpense: 40000,
    propertyDamageExpense: 80000,
  },
  {
    categoryName: 'Phân theo ngành nghề',
    subCategoryName: 'Thương mại và dịch vụ',
    code: '7',
    totalIncidents: 15,
    fatalIncidents: 0,
    multipleVictimIncidents: 1,
    totalVictims: 18,
    femaleVictims: 9,
    fatalities: 0,
    seriouslyInjured: 4,
    totalLeaveDays: 160,
    totalExpense: 220000,
    medicalExpense: 80000,
    treatmentSalaryExpense: 90000,
    compensationExpense: 50000,
    propertyDamageExpense: 150000,
  },
  {
    categoryName: 'Phân theo ngành nghề',
    subCategoryName: 'Chế biến, chế tạo khác',
    code: '8',
    totalIncidents: 18,
    fatalIncidents: 1,
    multipleVictimIncidents: 1,
    totalVictims: 21,
    femaleVictims: 10,
    fatalities: 1,
    seriouslyInjured: 7,
    totalLeaveDays: 280,
    totalExpense: 490000,
    medicalExpense: 160000,
    treatmentSalaryExpense: 150000,
    compensationExpense: 180000,
    propertyDamageExpense: 210000,
  },
  {
    categoryName: 'Phân theo ngành nghề',
    subCategoryName: 'Các ngành nghề khác',
    code: '9',
    totalIncidents: 8,
    fatalIncidents: 0,
    multipleVictimIncidents: 0,
    totalVictims: 8,
    femaleVictims: 3,
    fatalities: 0,
    seriouslyInjured: 2,
    totalLeaveDays: 90,
    totalExpense: 110000,
    medicalExpense: 40000,
    treatmentSalaryExpense: 40000,
    compensationExpense: 30000,
    propertyDamageExpense: 70000,
  },

  {
    categoryName: 'Phân theo nguyên nhân',
    subCategoryName: 'Không có thiết bị an toàn hoặc thiết bị không đảm bảo an toàn',
    code: '1',
    totalIncidents: 18,
    fatalIncidents: 2,
    multipleVictimIncidents: 1,
    totalVictims: 21,
    femaleVictims: 5,
    fatalities: 2,
    seriouslyInjured: 9,
    totalLeaveDays: 280,
    totalExpense: 510000,
    medicalExpense: 180000,
    treatmentSalaryExpense: 150000,
    compensationExpense: 180000,
    propertyDamageExpense: 320000,
  },
  {
    categoryName: 'Phân theo nguyên nhân',
    subCategoryName: 'Không có phương tiện bảo vệ cá nhân hoặc phương tiện bảo vệ cá nhân không tốt',
    code: '2',
    totalIncidents: 12,
    fatalIncidents: 1,
    multipleVictimIncidents: 1,
    totalVictims: 15,
    femaleVictims: 4,
    fatalities: 1,
    seriouslyInjured: 6,
    totalLeaveDays: 190,
    totalExpense: 320000,
    medicalExpense: 110000,
    treatmentSalaryExpense: 90000,
    compensationExpense: 120000,
    propertyDamageExpense: 110000,
  },
  {
    categoryName: 'Phân theo nguyên nhân',
    subCategoryName: 'Tổ chức lao động không hợp lý',
    code: '3',
    totalIncidents: 15,
    fatalIncidents: 1,
    multipleVictimIncidents: 2,
    totalVictims: 20,
    femaleVictims: 6,
    fatalities: 1,
    seriouslyInjured: 8,
    totalLeaveDays: 240,
    totalExpense: 430000,
    medicalExpense: 150000,
    treatmentSalaryExpense: 120000,
    compensationExpense: 160000,
    propertyDamageExpense: 240000,
  },
  {
    categoryName: 'Phân theo nguyên nhân',
    subCategoryName: 'Chưa huấn luyện hoặc huấn luyện an toàn vệ sinh lao động chưa đầy đủ',
    code: '4',
    totalIncidents: 22,
    fatalIncidents: 3,
    multipleVictimIncidents: 3,
    totalVictims: 30,
    femaleVictims: 11,
    fatalities: 4,
    seriouslyInjured: 14,
    totalLeaveDays: 410,
    totalExpense: 920000,
    medicalExpense: 290000,
    treatmentSalaryExpense: 230000,
    compensationExpense: 400000,
    propertyDamageExpense: 450000,
  },
  {
    categoryName: 'Phân theo nguyên nhân',
    subCategoryName: 'Không có quy trình an toàn hoặc biện pháp làm việc an toàn',
    code: '5',
    totalIncidents: 14,
    fatalIncidents: 2,
    multipleVictimIncidents: 1,
    totalVictims: 17,
    femaleVictims: 4,
    fatalities: 2,
    seriouslyInjured: 7,
    totalLeaveDays: 220,
    totalExpense: 480000,
    medicalExpense: 140000,
    treatmentSalaryExpense: 130000,
    compensationExpense: 210000,
    propertyDamageExpense: 180000,
  },
  {
    categoryName: 'Phân theo nguyên nhân',
    subCategoryName: 'Điều kiện làm việc không tốt',
    code: '6',
    totalIncidents: 9,
    fatalIncidents: 0,
    multipleVictimIncidents: 0,
    totalVictims: 9,
    femaleVictims: 2,
    fatalities: 0,
    seriouslyInjured: 3,
    totalLeaveDays: 110,
    totalExpense: 140000,
    medicalExpense: 50000,
    treatmentSalaryExpense: 50000,
    compensationExpense: 40000,
    propertyDamageExpense: 90000,
  },
  {
    categoryName: 'Phân theo nguyên nhân',
    subCategoryName: 'Quy phạm nội quy, quy trình, quy chuẩn, biện pháp làm việc an toàn',
    code: '7',
    totalIncidents: 16,
    fatalIncidents: 1,
    multipleVictimIncidents: 1,
    totalVictims: 18,
    femaleVictims: 5,
    fatalities: 1,
    seriouslyInjured: 7,
    totalLeaveDays: 200,
    totalExpense: 360000,
    medicalExpense: 120000,
    treatmentSalaryExpense: 100000,
    compensationExpense: 140000,
    propertyDamageExpense: 150000,
  },
  {
    categoryName: 'Phân theo nguyên nhân',
    subCategoryName: 'Không sử dụng phương tiện bảo vệ cá nhân',
    code: '8',
    totalIncidents: 8,
    fatalIncidents: 0,
    multipleVictimIncidents: 0,
    totalVictims: 8,
    femaleVictims: 1,
    fatalities: 0,
    seriouslyInjured: 2,
    totalLeaveDays: 80,
    totalExpense: 90000,
    medicalExpense: 30000,
    treatmentSalaryExpense: 30000,
    compensationExpense: 30000,
    propertyDamageExpense: 40000,
  },
  {
    categoryName: 'Phân theo nguyên nhân',
    subCategoryName: 'Khách quan khó tránh/ Nguyên nhân chưa kể đến',
    code: '9',
    totalIncidents: 4,
    fatalIncidents: 0,
    multipleVictimIncidents: 0,
    totalVictims: 4,
    femaleVictims: 2,
    fatalities: 0,
    seriouslyInjured: 1,
    totalLeaveDays: 50,
    totalExpense: 60000,
    medicalExpense: 20000,
    treatmentSalaryExpense: 20000,
    compensationExpense: 20000,
    propertyDamageExpense: 30000,
  },

  {
    categoryName: 'Phân theo yếu tố gây chấn thương',
    subCategoryName: 'Thiết bị nâng',
    code: '1',
    totalIncidents: 15,
    fatalIncidents: 2,
    multipleVictimIncidents: 1,
    totalVictims: 19,
    femaleVictims: 2,
    fatalities: 2,
    seriouslyInjured: 8,
    totalLeaveDays: 260,
    totalExpense: 520000,
    medicalExpense: 170000,
    treatmentSalaryExpense: 150000,
    compensationExpense: 200000,
    propertyDamageExpense: 950000,
  },
  {
    categoryName: 'Phân theo yếu tố gây chấn thương',
    subCategoryName: 'Dây cáp/xích',
    code: '2',
    totalIncidents: 8,
    fatalIncidents: 1,
    multipleVictimIncidents: 0,
    totalVictims: 9,
    femaleVictims: 1,
    fatalities: 1,
    seriouslyInjured: 4,
    totalLeaveDays: 110,
    totalExpense: 210000,
    medicalExpense: 70000,
    treatmentSalaryExpense: 60000,
    compensationExpense: 80000,
    propertyDamageExpense: 120000,
  },
  {
    categoryName: 'Phân theo yếu tố gây chấn thương',
    subCategoryName: 'Xe nâng/phương tiện vận chuyển',
    code: '3',
    totalIncidents: 14,
    fatalIncidents: 1,
    multipleVictimIncidents: 2,
    totalVictims: 17,
    femaleVictims: 3,
    fatalities: 1,
    seriouslyInjured: 6,
    totalLeaveDays: 200,
    totalExpense: 390000,
    medicalExpense: 130000,
    treatmentSalaryExpense: 110000,
    compensationExpense: 150000,
    propertyDamageExpense: 280000,
  },
  {
    categoryName: 'Phân theo yếu tố gây chấn thương',
    subCategoryName: 'Máy cơ khí/chế biến gỗ',
    code: '4',
    totalIncidents: 19,
    fatalIncidents: 0,
    multipleVictimIncidents: 1,
    totalVictims: 21,
    femaleVictims: 7,
    fatalities: 0,
    seriouslyInjured: 11,
    totalLeaveDays: 310,
    totalExpense: 420000,
    medicalExpense: 160000,
    treatmentSalaryExpense: 140000,
    compensationExpense: 120000,
    propertyDamageExpense: 190000,
  },
  {
    categoryName: 'Phân theo yếu tố gây chấn thương',
    subCategoryName: 'Điện/nhiệt',
    code: '5',
    totalIncidents: 11,
    fatalIncidents: 2,
    multipleVictimIncidents: 1,
    totalVictims: 14,
    femaleVictims: 4,
    fatalities: 2,
    seriouslyInjured: 5,
    totalLeaveDays: 190,
    totalExpense: 480000,
    medicalExpense: 130000,
    treatmentSalaryExpense: 110000,
    compensationExpense: 240000,
    propertyDamageExpense: 310000,
  },
  {
    categoryName: 'Phân theo yếu tố gây chấn thương',
    subCategoryName: 'Hóa chất độc hại',
    code: '6',
    totalIncidents: 5,
    fatalIncidents: 1,
    multipleVictimIncidents: 1,
    totalVictims: 8,
    femaleVictims: 3,
    fatalities: 1,
    seriouslyInjured: 3,
    totalLeaveDays: 140,
    totalExpense: 290000,
    medicalExpense: 90000,
    treatmentSalaryExpense: 80000,
    compensationExpense: 120000,
    propertyDamageExpense: 540000,
  },
  {
    categoryName: 'Phân theo yếu tố gây chấn thương',
    subCategoryName: 'Rơi ngã từ trên cao',
    code: '7',
    totalIncidents: 22,
    fatalIncidents: 4,
    multipleVictimIncidents: 2,
    totalVictims: 26,
    femaleVictims: 2,
    fatalities: 4,
    seriouslyInjured: 13,
    totalLeaveDays: 390,
    totalExpense: 980000,
    medicalExpense: 280000,
    treatmentSalaryExpense: 250000,
    compensationExpense: 450000,
    propertyDamageExpense: 220000,
  },
  {
    categoryName: 'Phân theo yếu tố gây chấn thương',
    subCategoryName: 'Sạt lở đất/đá',
    code: '8',
    totalIncidents: 3,
    fatalIncidents: 1,
    multipleVictimIncidents: 1,
    totalVictims: 5,
    femaleVictims: 0,
    fatalities: 1,
    seriouslyInjured: 2,
    totalLeaveDays: 80,
    totalExpense: 190000,
    medicalExpense: 50000,
    treatmentSalaryExpense: 40000,
    compensationExpense: 100000,
    propertyDamageExpense: 450000,
  },
  {
    categoryName: 'Phân theo yếu tố gây chấn thương',
    subCategoryName: 'Các yếu tố khác',
    code: '9',
    totalIncidents: 10,
    fatalIncidents: 0,
    multipleVictimIncidents: 0,
    totalVictims: 10,
    femaleVictims: 4,
    fatalities: 0,
    seriouslyInjured: 3,
    totalLeaveDays: 130,
    totalExpense: 140000,
    medicalExpense: 60000,
    treatmentSalaryExpense: 50000,
    compensationExpense: 30000,
    propertyDamageExpense: 80000,
  }
];

export const AccidentSummaryReport = ({ year, periodText, onBack, provinceId }: Props) => {
  const [periods, setPeriods] = useState<ReportPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loadingPeriods, setLoadingPeriods] = useState<boolean>(true);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);
  const [provinces, setProvinces] = useState<{ id: number; name: string }[]>([]);
  const [selectedProvinceIdState, setSelectedProvinceIdState] = useState<number | null>(null);

  useEffect(() => {
    setSelectedProvinceIdState(provinceId || null);
  }, [provinceId]);

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await api.get('/location/provinces');
        setProvinces(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    const fetchPeriods = async () => {
      setLoadingPeriods(true);
      try {
        const response = await api.get('/report-periods', { params: { year, limit: 100 } });
        const list = (response.data?.data?.data || []) as ReportPeriod[];
        setPeriods(list);
        
        if (list.length > 0) {
          let matched = null;
          if (periodText && periodText !== 'Cả năm & 6 tháng') {
            matched = list.find((p: ReportPeriod) => p.name.toLowerCase().includes(periodText.toLowerCase()));
          }
          if (!matched) {
            matched = list[0];
          }
          setSelectedPeriodId(matched.id);
        } else {
          toast.error(`Không tìm thấy kỳ báo cáo nào trong năm ${year}`);
        }
      } catch (err) {
        console.error('Lỗi khi tải kỳ báo cáo:', err);
        toast.error('Không thể tải danh sách kỳ báo cáo');
      } finally {
        setLoadingPeriods(false);
      }
    };
    fetchPeriods();
  }, [year, periodText]);

  useEffect(() => {
    if (!selectedPeriodId) {
      setSummaryData(null);
      return;
    }
    const fetchSummary = async () => {
      setLoadingSummary(true);
      try {
        const response = await api.get(`/so/reports/summary`, {
          params: { 
            reportPeriodId: selectedPeriodId,
            provinceId: selectedProvinceIdState || undefined
          }
        });
        if (response.data?.data) {
          setSummaryData(response.data.data);
        }
      } catch (err) {
        console.error('Lỗi khi tải báo cáo tổng hợp:', err);
        toast.error('Không thể tải dữ liệu báo cáo tổng hợp cho kỳ này');
      } finally {
        setLoadingSummary(false);
      }
    };

    const timer = setTimeout(fetchSummary, 50);
    return () => clearTimeout(timer);
  }, [selectedPeriodId, selectedProvinceIdState]);

  const sectionOneRows = summaryData?.sectionOne?.rows || [];
  const totalsOverview = summaryData?.sectionOne?.total || {
    totalCompanies: 0,
    totalEmployees: 0,
    femaleEmployees: 0,
    totalIncidents: 0,
    incidentsWithFatalities: 0,
    incidentsWithMultipleVictims: 0,
    totalVictims: 0,
    totalFemaleVictims: 0,
    totalFatalities: 0,
    totalSevereInjuries: 0,
    ktnld: 0,
    kChet: 0
  };

  const byProfession = summaryData?.sectionTwo?.byProfession || [];
  const byAccidentCause = summaryData?.sectionTwo?.byAccidentCause || [];
  const byInjuryFactor = summaryData?.sectionTwo?.byInjuryFactor || [];

  const calculateTotals = () => {
    const sourceList = byProfession.length > 0 
      ? byProfession 
      : byAccidentCause.length > 0 
        ? byAccidentCause 
        : byInjuryFactor;

    return sourceList.reduce((acc: SummaryTotals, curr: SummaryClassificationRow) => ({
      totalIncidents: acc.totalIncidents + (curr.totalIncidents || 0),
      fatalIncidents: acc.fatalIncidents + (curr.incidentsWithFatalities || curr.fatalIncidents || 0),
      multipleVictimIncidents: acc.multipleVictimIncidents + (curr.incidentsWithMultipleVictims || curr.multipleVictimIncidents || 0),
      totalVictims: acc.totalVictims + (curr.totalVictims || 0),
      femaleVictims: acc.femaleVictims + (curr.totalFemaleVictims || curr.femaleVictims || 0),
      fatalities: acc.fatalities + (curr.totalFatalities || curr.fatalities || 0),
      seriouslyInjured: acc.seriouslyInjured + (curr.totalSevereInjuries || curr.seriouslyInjured || 0),
      totalLeaveDays: acc.totalLeaveDays + (curr.totalDaysOff || curr.totalLeaveDays || 0),
      totalExpense: acc.totalExpense + (curr.totalCosts || curr.totalExpense || 0),
      medicalExpense: acc.medicalExpense + (curr.medicalCosts || curr.medicalExpense || 0),
      treatmentSalaryExpense: acc.treatmentSalaryExpense + (curr.treatmentSalaryCosts || curr.treatmentSalaryExpense || 0),
      compensationExpense: acc.compensationExpense + (curr.compensationCosts || curr.compensationExpense || 0),
      propertyDamageExpense: acc.propertyDamageExpense + (curr.propertyDamage || curr.propertyDamageExpense || 0),
    }), {
      totalIncidents: 0,
      fatalIncidents: 0,
      multipleVictimIncidents: 0,
      totalVictims: 0,
      femaleVictims: 0,
      fatalities: 0,
      seriouslyInjured: 0,
      totalLeaveDays: 0,
      totalExpense: 0,
      medicalExpense: 0,
      treatmentSalaryExpense: 0,
      compensationExpense: 0,
      propertyDamageExpense: 0,
    });
  };

  const totalsByGroup = calculateTotals();

  const renderCategoryRows = (
    groupName: 'Phân theo ngành nghề' | 'Phân theo nguyên nhân' | 'Phân theo yếu tố gây chấn thương',
    rowsList: SummaryClassificationRow[],
    rowKeyPrefix: string
  ) => {
    if (rowsList.length === 0) {
      return (
        <tr className="hover:bg-gray-50/50">
          <td 
            className="py-2 px-1 border-r border-gray-200 text-center font-bold text-gray-900 bg-gray-50/80 align-middle w-20 whitespace-normal break-words text-[9px] leading-tight" 
            rowSpan={1}
          >
            {groupName}
          </td>
          <td className="py-2 px-2 border-r border-gray-200 text-left text-gray-400 italic w-32 whitespace-normal break-words text-[9px] leading-tight pl-2">
            Không có dữ liệu
          </td>
          <td className="py-2.5 px-1.5 border-r border-gray-200 text-gray-400 font-mono">-</td>
          <td className="py-2.5 px-1.5 border-r border-gray-200">0</td>
          <td className="py-2.5 px-1.5 border-r border-gray-200">0</td>
          <td className="py-2.5 px-1.5 border-r border-gray-200">0</td>
          <td className="py-2.5 px-1.5 border-r border-gray-200">0</td>
          <td className="py-2.5 px-1.5 border-r border-gray-200">0</td>
          <td className="py-2.5 px-1.5 border-r border-gray-200 text-red-600 font-semibold">0</td>
          <td className="py-2.5 px-1.5 border-r border-gray-200">0</td>
          <td className="py-2.5 px-1.5 border-r border-gray-200">0</td>
          <td className="py-2.5 px-1.5 border-r border-gray-200">0</td>
          <td className="py-2.5 px-1.5 border-r border-gray-200">0</td>
          <td className="py-2.5 px-1.5 border-r border-gray-200">0</td>
          <td className="py-2.5 px-1.5 border-r border-gray-200">0</td>
          <td className="py-2.5 px-1.5 text-amber-600">0</td>
        </tr>
      );
    }

    return rowsList.map((row, idx) => (
      <tr key={`${rowKeyPrefix}-${idx}`} className="hover:bg-gray-50/50">
        {idx === 0 && (
          <td 
            className="py-2 px-1 border-r border-gray-200 text-center font-bold text-gray-900 bg-gray-50/80 align-middle w-20 whitespace-normal break-words text-[9px] leading-tight" 
            rowSpan={rowsList.length}
          >
            {groupName}
          </td>
        )}
        <td className="py-2 px-2 border-r border-gray-200 text-left text-gray-700 w-32 whitespace-normal break-words text-[9px] leading-tight pl-2">
          {row.categoryName || row.subCategoryName || ''}
        </td>
        <td className="py-2.5 px-1.5 border-r border-gray-200 text-gray-400 font-mono">
          {row.categoryCode || row.code || ''}
        </td>
        <td className="py-2.5 px-1.5 border-r border-gray-200">{formatNumber(row.totalIncidents || 0)}</td>
        <td className="py-2.5 px-1.5 border-r border-gray-200">{formatNumber(row.incidentsWithFatalities ?? row.fatalIncidents ?? 0)}</td>
        <td className="py-2.5 px-1.5 border-r border-gray-200">{formatNumber(row.incidentsWithMultipleVictims ?? row.multipleVictimIncidents ?? 0)}</td>
        <td className="py-2.5 px-1.5 border-r border-gray-200">{formatNumber(row.totalVictims || 0)}</td>
        <td className="py-2.5 px-1.5 border-r border-gray-200">{formatNumber(row.totalFemaleVictims ?? row.femaleVictims ?? 0)}</td>
        <td className="py-2.5 px-1.5 border-r border-gray-200 text-red-600 font-semibold">{formatNumber(row.totalFatalities ?? row.fatalities ?? 0)}</td>
        <td className="py-2.5 px-1.5 border-r border-gray-200">{formatNumber(row.totalSevereInjuries ?? row.seriouslyInjured ?? 0)}</td>
        <td className="py-2.5 px-1.5 border-r border-gray-200">{formatNumber(row.totalDaysOff ?? row.totalLeaveDays ?? 0)}</td>
        <td className="py-2.5 px-1.5 border-r border-gray-200">{formatNumber((row.totalCosts ?? row.totalExpense ?? 0) / 1000)}</td>
        <td className="py-2.5 px-1.5 border-r border-gray-200">{formatNumber((row.medicalCosts ?? row.medicalExpense ?? 0) / 1000)}</td>
        <td className="py-2.5 px-1.5 border-r border-gray-200">{formatNumber((row.treatmentSalaryCosts ?? row.treatmentSalaryExpense ?? 0) / 1000)}</td>
        <td className="py-2.5 px-1.5 border-r border-gray-200">{formatNumber((row.compensationCosts ?? row.compensationExpense ?? 0) / 1000)}</td>
        <td className="py-2.5 px-1.5 text-amber-600">{formatNumber((row.propertyDamage ?? row.propertyDamageExpense ?? 0) / 1000)}</td>
      </tr>
    ));
  };

  const selectedPeriodObj = periods.find(p => p.id === selectedPeriodId);
  const displayPeriodName = selectedPeriodObj ? selectedPeriodObj.name : (periodText || 'Chưa chọn');

  return (
    <div className="flex-grow flex flex-col bg-[#F4F6F9] min-h-screen font-sans">
      <div className="bg-white px-6 py-3 flex items-center justify-between border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400">Tai nạn lao động</span>
          <span className="text-xs text-gray-400">❯</span>
          <span className="text-xs font-semibold text-gray-400 hover:text-gray-600 cursor-pointer" onClick={onBack}>TNLĐ theo HĐLĐ</span>
          <span className="text-xs text-gray-400">❯</span>
          <h1 className="text-sm font-bold text-gray-800">Báo cáo tổng hợp</h1>
        </div>
        
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-lg text-xs font-bold transition-all cursor-pointer bg-white"
          >
            Quay lại
          </button>
        </div>
      </div>

      <div className="p-6 overflow-y-auto space-y-6 max-w-[1500px] w-full mx-auto select-text">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 space-y-8">
          
          <div className="text-center space-y-3 pb-6 border-b border-gray-100 max-w-xl mx-auto">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              BÁO CÁO TỔNG HỢP TÌNH HÌNH TAI NẠN LAO ĐỘNG HỆ THỐNG
            </h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-xs max-w-2xl mx-auto">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-600 whitespace-nowrap">Kỳ báo cáo:</span>
                {loadingPeriods ? (
                  <span className="text-gray-400 text-xs italic">Đang tải các kỳ...</span>
                ) : (
                  <select
                    value={selectedPeriodId || ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      setSelectedPeriodId(val);
                    }}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 bg-white focus:outline-none focus:border-blue-500 shadow-sm cursor-pointer min-w-[200px]"
                  >
                    <option value="">-- Chọn kỳ báo cáo --</option>
                    {periods.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-600 whitespace-nowrap">Tỉnh/Thành phố:</span>
                <select
                  value={selectedProvinceIdState || ''}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    setSelectedProvinceIdState(val);
                  }}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 bg-white focus:outline-none focus:border-blue-500 shadow-sm cursor-pointer min-w-[200px]"
                >
                  <option value="">Tất cả Tỉnh/Thành phố</option>
                  {provinces.map((prov) => (
                    <option key={prov.id} value={prov.id}>
                      {prov.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loadingSummary ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-medium text-gray-500">Đang tải dữ liệu tổng hợp từ hệ thống...</span>
            </div>
          ) : !selectedPeriodId ? (
            <div className="text-center py-20 text-gray-400 text-xs">
              Vui lòng chọn một kỳ báo cáo để xem dữ liệu tổng hợp.
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-800 border-l-4 border-blue-600 pl-2 uppercase tracking-wider">
                  I. Thông tin tổng quan
                </h3>
                
                <div className="overflow-x-auto border border-gray-300 rounded-xl shadow-xs bg-white">
                  <table className="w-full text-center border-collapse text-[10px] min-w-[950px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-300 text-gray-700 font-bold text-[10px]">
                        <th className="py-3 px-2 border-r border-gray-300 text-left w-44 whitespace-normal break-words" rowSpan={3}>Loại hình cơ sở</th>
                        <th className="py-3 px-2 border-r border-gray-300 w-8" rowSpan={3}>Mã số</th>
                        <th className="py-2 border-b border-gray-300 border-r border-gray-300 text-[10px]" colSpan={2}>Cơ sở</th>
                        <th className="py-2 border-b border-gray-300 border-r border-gray-300 text-[10px]" colSpan={3}>Lực lượng lao động</th>
                        <th className="py-2 border-b border-gray-300 border-r border-gray-300 text-[10px]" colSpan={3}>Tổng số tai nạn lao động</th>
                        <th className="py-2 border-b border-gray-300 border-r border-gray-300 text-[10px]" colSpan={2}>Tần suất tai nạn lao động</th>
                        <th className="py-3 px-2 w-20" rowSpan={3}>Ghi chú</th>
                      </tr>
                      <tr className="bg-gray-50 border-b border-gray-300 text-gray-700 font-bold text-[9px] leading-tight">
                        <th className="py-2 px-1 border-r border-gray-200 w-10" rowSpan={2}>Tổng số</th>
                        <th className="py-2 px-1 border-r border-gray-300 w-14" rowSpan={2}>Số cơ sở tham gia</th>
                        <th className="py-2 px-1 border-r border-gray-200 w-14" rowSpan={2}>Tổng số lao động</th>
                        <th className="py-2 px-1 border-r border-gray-200 w-20" rowSpan={2}>Số LĐ của cơ sở tham gia báo cáo</th>
                        <th className="py-2 px-1 border-r border-gray-300 w-14" rowSpan={2}>Số lao động nữ</th>
                        <th className="py-2 border-b border-gray-200 border-r border-gray-300 text-[9px]" colSpan={3}>Số người bị TNLĐ (Người)</th>
                        <th className="py-2 px-1 border-r border-gray-200 w-12" rowSpan={2}>KTNLĐ</th>
                        <th className="py-2 px-1 border-r border-gray-300 w-12" rowSpan={2}>KChết</th>
                      </tr>
                      <tr className="bg-[#F9FAFB] border-b border-gray-300 text-gray-600 font-semibold text-[9px] leading-tight">
                        <th className="py-2 px-1 border-r border-gray-200 w-10">Tổng số</th>
                        <th className="py-2 px-1 border-r border-gray-200 w-10">Số người chết</th>
                        <th className="py-2 px-1 border-r border-gray-300 w-14">Số người bị thương nặng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 text-[11px] font-medium text-gray-800">
                      <tr className="bg-slate-100 font-bold text-gray-900 border-b border-gray-300">
                        <td className="py-3 px-4 border-r border-gray-200 text-left font-bold">Tổng số</td>
                        <td className="py-3 px-1.5 border-r border-gray-200"></td>
                        <td className="py-3 px-1.5 border-r border-gray-200">{formatNumber(totalsOverview.totalCompanies)}</td>
                        <td className="py-3 px-1.5 border-r border-gray-200">{formatNumber(totalsOverview.totalCompanies)}</td>
                        <td className="py-3 px-1.5 border-r border-gray-200">{formatNumber(totalsOverview.totalEmployees)}</td>
                        <td className="py-3 px-1.5 border-r border-gray-200">{formatNumber(totalsOverview.totalEmployees)}</td>
                        <td className="py-3 px-1.5 border-r border-gray-200">{formatNumber(totalsOverview.femaleEmployees)}</td>
                        <td className="py-3 px-1.5 border-r border-gray-200">{formatNumber(totalsOverview.totalVictims)}</td>
                        <td className="py-3 px-1.5 border-r border-gray-200 text-red-600 font-bold">{formatNumber(totalsOverview.totalFatalities)}</td>
                        <td className="py-3 px-1.5 border-r border-gray-200">{formatNumber(totalsOverview.totalSevereInjuries)}</td>
                        <td className="py-3 px-1.5 border-r border-gray-200">{formatDecimal(totalsOverview.ktnld || 0)}</td>
                        <td className="py-3 px-1.5 border-r border-gray-200 text-red-500">{formatDecimal(totalsOverview.kChet || 0)}</td>
                        <td className="py-3 px-2"></td>
                      </tr>

                      {sectionOneRows.map((row: SummaryOverviewRow, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="py-2.5 px-4 border-r border-gray-200 text-left text-gray-700">{row.businessTypeName || row.entityType || ''}</td>
                          <td className="py-2.5 px-1.5 border-r border-gray-200 text-gray-400 font-mono">{row.businessTypeCode || row.code || ''}</td>
                          <td className="py-2.5 px-1.5 border-r border-gray-200">{formatNumber(row.totalCompanies)}</td>
                          <td className="py-2.5 px-1.5 border-r border-gray-200">{formatNumber(row.totalCompanies)}</td>
                          <td className="py-2.5 px-1.5 border-r border-gray-200">{formatNumber(row.totalEmployees)}</td>
                          <td className="py-2.5 px-1.5 border-r border-gray-200">{formatNumber(row.totalEmployees)}</td>
                          <td className="py-2.5 px-1.5 border-r border-gray-200">{formatNumber(row.femaleEmployees)}</td>
                          <td className="py-2.5 px-1.5 border-r border-gray-200">{formatNumber(row.totalVictims)}</td>
                          <td className="py-2.5 px-1.5 border-r border-gray-200 text-red-600 font-semibold">{formatNumber(row.totalFatalities ?? row.fatalVictims ?? 0)}</td>
                          <td className="py-2.5 px-1.5 border-r border-gray-200">{formatNumber(row.totalSevereInjuries ?? row.seriouslyInjuredVictims ?? 0)}</td>
                          <td className="py-2.5 px-1.5 border-r border-gray-200">{formatDecimal(row.ktnld || 0)}</td>
                          <td className="py-2.5 px-1.5 border-r border-gray-200 text-red-500">{formatDecimal(row.kChet || 0)}</td>
                          <td className="py-2.5 px-2 text-left text-gray-500">—</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-800 border-l-4 border-blue-600 pl-2 uppercase tracking-wider">
                  II. Phân loại TNLĐ
                </h3>

                <div className="overflow-x-auto border border-gray-300 rounded-xl shadow-xs bg-white">
                  <table className="w-full text-center border-collapse text-[10px] min-w-[1000px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-300 text-gray-700 font-bold text-[10px]">
                        <th className="py-3 px-2 border-r border-gray-300 text-left w-52 whitespace-normal break-words" colSpan={2} rowSpan={3}>Tên chỉ tiêu thống kê</th>
                        <th className="py-3 px-2 border-r border-gray-300 w-8" rowSpan={3}>Mã số</th>
                        <th className="py-2 border-b border-gray-300 border-r border-gray-300 text-[10px]" colSpan={7}>Phân loại TNLĐ theo mức độ thương tật</th>
                        <th className="py-2 border-b border-gray-300 text-[10px]" colSpan={6}>Theo mức độ thương tật</th>
                      </tr>
                      <tr className="bg-gray-50 border-b border-gray-300 text-gray-700 font-bold text-[9px] leading-tight">
                        <th className="py-2 border-b border-gray-200 border-r border-gray-200" colSpan={3}>Số vụ TNLĐ</th>
                        <th className="py-2 border-b border-gray-200 border-r border-gray-300" colSpan={4}>Số người bị nạn (Người)</th>
                        <th className="py-2 px-1 border-r border-gray-200 w-14 whitespace-normal break-words" rowSpan={2}>Tổng số ngày nghỉ vì TNLĐ</th>
                        <th className="py-2 px-1 border-r border-gray-200 w-16 whitespace-normal break-words" rowSpan={2}>Tổng số tiền</th>
                        <th className="py-2 border-b border-gray-200 border-r border-gray-200" colSpan={3}>Tổng số ngày nghỉ vì TNLĐ</th>
                        <th className="py-2 px-1 w-16 whitespace-normal break-words" rowSpan={2}>Thiệt hại tài sản (1.000 đ)</th>
                      </tr>
                      <tr className="bg-[#F9FAFB] border-b border-gray-300 text-gray-600 font-semibold text-[9px] leading-tight">
                        <th className="py-2 px-1 border-r border-gray-200 w-10">Tổng số</th>
                        <th className="py-2 px-1 border-r border-gray-200 w-12">Số vụ có người chết</th>
                        <th className="py-2 px-1 border-r border-gray-300 w-14">Số vụ có ≥ 2 người bị nạn</th>
                        <th className="py-2 px-1 border-r border-gray-200 w-10">Tổng số</th>
                        <th className="py-2 px-1 border-r border-gray-200 w-10">Số LĐ nữ</th>
                        <th className="py-2 px-1 border-r border-gray-200 w-12">Số người bị chết</th>
                        <th className="py-2 px-1 border-r border-gray-300 w-14">Số người bị thương nặng</th>
                        <th className="py-2 px-1 border-r border-gray-200 w-10">Y tế</th>
                        <th className="py-2 px-1 border-r border-gray-200 w-16">Trả lương trong điều trị</th>
                        <th className="py-2 px-1 border-r border-gray-200 w-16">Bồi thường / Trợ cấp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 text-[11px] font-medium text-gray-800">
                      <tr className="bg-slate-100 font-bold text-gray-900 border-b border-gray-300">
                        <td className="py-3 px-4 border-r border-gray-200 text-left font-bold" colSpan={2}>Tổng số</td>
                        <td className="py-3 px-1.5 border-r border-gray-200 text-gray-400 font-mono">-</td>
                        <td className="py-3 px-1.5 border-r border-gray-200">{formatNumber(totalsByGroup.totalIncidents)}</td>
                        <td className="py-3 px-1.5 border-r border-gray-200">{formatNumber(totalsByGroup.fatalIncidents)}</td>
                        <td className="py-3 px-1.5 border-r border-gray-200">{formatNumber(totalsByGroup.multipleVictimIncidents)}</td>
                        <td className="py-3 px-1.5 border-r border-gray-200">{formatNumber(totalsByGroup.totalVictims)}</td>
                        <td className="py-3 px-1.5 border-r border-gray-200">{formatNumber(totalsByGroup.femaleVictims)}</td>
                        <td className="py-3 px-1.5 border-r border-gray-200 text-red-600 font-bold">{formatNumber(totalsByGroup.fatalities)}</td>
                        <td className="py-3 px-1.5 border-r border-gray-200">{formatNumber(totalsByGroup.seriouslyInjured)}</td>
                        <td className="py-3 px-1.5 border-r border-gray-200">{formatNumber(totalsByGroup.totalLeaveDays)}</td>
                        <td className="py-3 px-1.5 border-r border-gray-200">{formatNumber((totalsByGroup.totalExpense || 0) / 1000)}</td>
                        <td className="py-3 px-1.5 border-r border-gray-200">{formatNumber((totalsByGroup.medicalExpense || 0) / 1000)}</td>
                        <td className="py-3 px-1.5 border-r border-gray-200">{formatNumber((totalsByGroup.treatmentSalaryExpense || 0) / 1000)}</td>
                        <td className="py-3 px-1.5 border-r border-gray-200">{formatNumber((totalsByGroup.compensationExpense || 0) / 1000)}</td>
                        <td className="py-3 px-1.5 text-amber-600 font-bold">{formatNumber((totalsByGroup.propertyDamageExpense || 0) / 1000)}</td>
                      </tr>

                      {renderCategoryRows('Phân theo ngành nghề', byProfession, 'industry')}

                      {renderCategoryRows('Phân theo nguyên nhân', byAccidentCause, 'cause')}

                      {renderCategoryRows('Phân theo yếu tố gây chấn thương', byInjuryFactor, 'factor')}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
