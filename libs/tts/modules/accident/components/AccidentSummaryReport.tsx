'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { reportApi } from '../services/report.api';

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
      participatingCompanies?: number;
      totalEmployees: number;
      reportingEmployees?: number;
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
    total?: SummaryTotals;
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
  year?: number;
  periodText?: string;
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

const DEFAULT_BUSINESS_TYPES = [
  'Doanh nghiệp nhà nước',
  'Công ty trách nhiệm hữu hạn',
  'Công ty cổ phần',
  'Công ty hợp danh',
  'Doanh nghiệp tư nhân',
  'Doanh nghiệp có vốn đầu tư nước ngoài',
  'Đơn vị kinh tế tập thể',
  'Đơn vị kinh tế cá thể',
  'Đơn vị hành chính sự nghiệp, đảng, đoàn thể, hiệp hội',
];

const DEFAULT_INDUSTRIES = [
  'Xây dựng',
  'Khai thác mỏ và khai khoáng',
  'Sản xuất kim loại và sản phẩm từ kim loại',
  'Sản xuất hóa chất và sản phẩm hóa chất',
  'Dệt may, da giày',
  'Chế biến thực phẩm và đồ uống',
  'Sản xuất thiết bị điện, điện tử',
  'Vận tải và kho bãi',
  'Nông nghiệp, lâm nghiệp và thủy sản',
  'Bán buôn và bán lẻ; sửa chữa ô tô, mô tô, xe máy',
  'Thông tin và truyền thông',
  'Ngành nghề khác',
];

const NGUYEN_NHAN_LABELS: Record<string, string> = {
  thiet_bi_an_toan: 'Không có thiết bị an toàn hoặc thiết bị không đảm bảo an toàn',
  phuong_tien_bao_ve: 'Không có phương tiện bảo vệ cá nhân hoặc phương tiện bảo vệ cá nhân không tốt',
  to_chuc_lao_dong: 'Tổ chức lao động không hợp lí',
  chua_huan_luyen: 'Chưa huấn luyện hoặc huấn luyện an toàn vệ sinh lao động chưa đầy đủ',
  thieu_quy_trinh_an_toan: 'Không có quy trình an toàn hoặc biện pháp làm việc an toàn',
  dieu_kien_lam_viec: 'Điều kiện làm việc không tốt',
  vi_pham_noi_quy: 'Vi phạm nội quy, quy trình, quy chuẩn, biện pháp làm việc an toàn',
  khong_su_dung_bao_ho: 'Không sử dụng phương tiện bảo vệ cá nhân',
  nguyen_nhan_khach_quan: 'Khách quan khó tránh, nguyên nhân chưa kể đến',
};

const DEFAULT_CAUSES = Object.values(NGUYEN_NHAN_LABELS);

const DEFAULT_INJURY_FACTORS = [
  'Thiết bị nâng',
  'Dây cáp/xích',
  'Xe nâng/phương tiện vận chuyển',
  'Máy cơ khí/chế biến gỗ',
  'Điện/nhiệt',
  'Hóa chất độc hại',
  'Rơi ngã từ trên cao',
  'Sạt lở đất/đá',
  'Các yếu tố khác',
];

const buildClassificationGroupRows = (
  catName: string,
  defaultItems: string[],
  serverChildren: any[] = [],
  nameResolver?: (rawName: string) => string
): SummaryClassificationRow[] => {
  const rowsMap = new Map<string, SummaryClassificationRow>();

  // 1. Khởi tạo danh mục mẫu với giá trị 0
  defaultItems.forEach((name, idx) => {
    rowsMap.set(name.toLowerCase().trim(), {
      categoryName: catName,
      subCategoryName: name,
      code: String(idx + 1),
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
  });

  // 2. Ghép dữ liệu thực tế từ backend
  serverChildren.forEach((item) => {
    const rawName = item.ngheNghiep || item.nguyenNhanTaiNan || item.yeuToChanThuong || item.name || '';
    const resolvedName = (nameResolver ? nameResolver(rawName) : rawName) || 'Khác';
    const key = resolvedName.toLowerCase().trim();

    let target = rowsMap.get(key);
    if (!target) {
      for (const [defKey, defRow] of rowsMap.entries()) {
        if (defKey.includes(key) || key.includes(defKey)) {
          target = defRow;
          break;
        }
      }
    }

    if (target) {
      target.totalIncidents = (target.totalIncidents || 0) + (Number(item.totalAccident) || Number(item.totalIncidents) || 0);
      target.fatalIncidents = (target.fatalIncidents || 0) + (Number(item.totalAccidentDeath) || Number(item.fatalIncidents) || 0);
      target.multipleVictimIncidents = (target.multipleVictimIncidents || 0) + (Number(item.totalHumanInjuredMore2) || 0);
      target.totalVictims = (target.totalVictims || 0) + (Number(item.totalHumanInjured) || Number(item.totalVictims) || 0);
      target.femaleVictims = (target.femaleVictims || 0) + (Number(item.totalFemaleInjured) || 0);
      target.fatalities = (target.fatalities || 0) + (Number(item.totalHumanDeath) || 0);
      target.seriouslyInjured = (target.seriouslyInjured || 0) + (Number(item.totalHumanInjuredHeavy) || 0);
      target.totalLeaveDays = (target.totalLeaveDays || 0) + (Number(item.totalDayOff) || 0);
      target.totalExpense = (target.totalExpense || 0) + (Number(item.totalBudget) || 0);
      target.medicalExpense = (target.medicalExpense || 0) + (Number(item.budgetMedical) || 0);
      target.treatmentSalaryExpense = (target.treatmentSalaryExpense || 0) + (Number(item.budgetSalary) || 0);
      target.compensationExpense = (target.compensationExpense || 0) + (Number(item.budgetHelp) || 0);
      target.propertyDamageExpense = (target.propertyDamageExpense || 0) + (Number(item.totalThietHai) || 0);
    } else {
      rowsMap.set(key, {
        categoryName: catName,
        subCategoryName: resolvedName,
        code: String(rowsMap.size + 1),
        totalIncidents: Number(item.totalAccident) || Number(item.totalIncidents) || 0,
        fatalIncidents: Number(item.totalAccidentDeath) || Number(item.fatalIncidents) || 0,
        multipleVictimIncidents: Number(item.totalHumanInjuredMore2) || 0,
        totalVictims: Number(item.totalHumanInjured) || Number(item.totalVictims) || 0,
        femaleVictims: Number(item.totalFemaleInjured) || 0,
        fatalities: Number(item.totalHumanDeath) || 0,
        seriouslyInjured: Number(item.totalHumanInjuredHeavy) || 0,
        totalLeaveDays: Number(item.totalDayOff) || 0,
        totalExpense: Number(item.totalBudget) || 0,
        medicalExpense: Number(item.budgetMedical) || 0,
        treatmentSalaryExpense: Number(item.budgetSalary) || 0,
        compensationExpense: Number(item.budgetHelp) || 0,
        propertyDamageExpense: Number(item.totalThietHai) || 0,
      });
    }
  });

  return Array.from(rowsMap.values()).map((row, idx) => ({
    ...row,
    code: String(idx + 1),
  }));
};

export const AccidentSummaryReport = ({ onBack }: Props) => {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoadingSummary(true);
      try {
        const [overviewRes, statsRes] = await Promise.allSettled([
          reportApi.getOverview(),
          reportApi.getAccidentStatistics(),
        ]);

        let rows: SummaryOverviewRow[] = [];
        if (overviewRes.status === 'fulfilled' && overviewRes.value.data?.data) {
          const list = overviewRes.value.data.data;
          rows = list.map((grp: any) => {
            const item = grp.data?.[0] || {};
            return {
              entityType: grp.businessTypeName || item.name || 'Loại hình DN',
              code: item.code || '',
              totalCompanies: item.tscoso || 0,
              participatingCompanies: item.tscosothamgia || 0,
              totalEmployees: item.tslaodong || item.tslaodongbaocao || 0,
              reportingEmployees: item.tslaodongbaocao || 0,
              femaleEmployees: item.ldnu || 0,
              totalVictims: item.tsnguoitainan || 0,
              fatalVictims: item.tsnguoichet || 0,
              seriouslyInjuredVictims: item.tsnguoibithuongnang || 0,
              accidentFrequencyRate: item.ktnld || 0,
              fatalFrequencyRate: item.kchet || 0,
              note: '',
            };
          });
        }

        if (rows.length === 0) {
          rows = DEFAULT_BUSINESS_TYPES.map(type => ({
            entityType: type,
            businessTypeName: type,
            code: '',
            totalCompanies: 0,
            participatingCompanies: 0,
            totalEmployees: 0,
            reportingEmployees: 0,
            femaleEmployees: 0,
            totalVictims: 0,
            fatalVictims: 0,
            seriouslyInjuredVictims: 0,
            accidentFrequencyRate: 0,
            fatalFrequencyRate: 0,
            note: '',
          }));
        }

        let profRows: SummaryClassificationRow[] = [];
        let causeRows: SummaryClassificationRow[] = [];
        let factorRows: SummaryClassificationRow[] = [];
        let backendTotalSectionTwo: SummaryTotals | null = null;

        if (statsRes.status === 'fulfilled' && statsRes.value.data?.data) {
          const statsCategories = statsRes.value.data.data;
          const totalGroup = statsCategories.find((c: any) => c.code === 'TOTAL');
          const ngheNghiepGroup = statsCategories.find((c: any) => c.code === 'NGHE_NGHIEP');
          const causeGroup = statsCategories.find((c: any) => c.code === 'CAUSE');
          const factorGroup = statsCategories.find((c: any) => c.code === 'INJURY_FACTOR');

          if (totalGroup?.statistics) {
            const s = totalGroup.statistics;
            backendTotalSectionTwo = {
              totalIncidents: Number(s.totalAccident) || 0,
              fatalIncidents: Number(s.totalAccidentDeath) || 0,
              multipleVictimIncidents: Number(s.totalHumanInjuredMore2) || 0,
              totalVictims: Number(s.totalHumanInjured) || 0,
              femaleVictims: Number(s.totalFemaleInjured) || 0,
              fatalities: Number(s.totalHumanDeath) || 0,
              seriouslyInjured: Number(s.totalHumanInjuredHeavy) || 0,
              totalLeaveDays: Number(s.totalDayOff) || 0,
              totalExpense: Number(s.totalBudget) || 0,
              medicalExpense: Number(s.budgetMedical) || 0,
              treatmentSalaryExpense: Number(s.budgetSalary) || 0,
              compensationExpense: Number(s.budgetHelp) || 0,
              propertyDamageExpense: Number(s.totalThietHai) || 0,
            };
          }

          profRows = buildClassificationGroupRows(
            'Phân theo ngành nghề',
            DEFAULT_INDUSTRIES,
            ngheNghiepGroup?.children || []
          );

          causeRows = buildClassificationGroupRows(
            'Phân theo nguyên nhân',
            DEFAULT_CAUSES,
            causeGroup?.children || [],
            (raw) => NGUYEN_NHAN_LABELS[raw] || raw
          );

          factorRows = buildClassificationGroupRows(
            'Phân theo yếu tố gây chấn thương',
            DEFAULT_INJURY_FACTORS,
            factorGroup?.children || []
          );
        } else {
          profRows = buildClassificationGroupRows('Phân theo ngành nghề', DEFAULT_INDUSTRIES, []);
          causeRows = buildClassificationGroupRows('Phân theo nguyên nhân', DEFAULT_CAUSES, []);
          factorRows = buildClassificationGroupRows('Phân theo yếu tố gây chấn thương', DEFAULT_INJURY_FACTORS, []);
        }

        const totalOverview = rows.reduce((acc, curr) => ({
          totalCompanies: acc.totalCompanies + (curr.totalCompanies || 0),
          participatingCompanies: (acc.participatingCompanies || 0) + (curr.participatingCompanies || 0),
          totalEmployees: acc.totalEmployees + (curr.totalEmployees || 0),
          reportingEmployees: (acc.reportingEmployees || 0) + (curr.reportingEmployees || 0),
          femaleEmployees: acc.femaleEmployees + (curr.femaleEmployees || 0),
          totalVictims: acc.totalVictims + (curr.totalVictims || 0),
          totalFatalities: (acc.totalFatalities || 0) + (curr.fatalVictims || 0),
          totalSevereInjuries: (acc.totalSevereInjuries || 0) + (curr.seriouslyInjuredVictims || 0),
          ktnld: 0,
          kChet: 0,
        }), {
          totalCompanies: 0,
          participatingCompanies: 0,
          totalEmployees: 0,
          reportingEmployees: 0,
          femaleEmployees: 0,
          totalVictims: 0,
          totalFatalities: 0,
          totalSevereInjuries: 0,
          ktnld: 0,
          kChet: 0,
        });

        setSummaryData({
          sectionOne: {
            rows,
            total: totalOverview as any,
          },
          sectionTwo: {
            total: backendTotalSectionTwo || undefined,
            byProfession: profRows,
            byAccidentCause: causeRows,
            byInjuryFactor: factorRows,
          },
        });
      } catch (err) {
        console.error('Lỗi khi tải báo cáo tổng hợp:', err);
        toast.error('Không thể tải dữ liệu báo cáo tổng hợp');
      } finally {
        setLoadingSummary(false);
      }
    };

    fetchSummary();
  }, []);

  const sectionOneRows = summaryData?.sectionOne?.rows || [];
  const totalsOverview = summaryData?.sectionOne?.total || {
    totalCompanies: 0,
    participatingCompanies: 0,
    totalEmployees: 0,
    reportingEmployees: 0,
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

  const totalsByGroup = summaryData?.sectionTwo?.total || calculateTotals();

  const renderCategoryRows = (
    groupName: 'Phân theo ngành nghề' | 'Phân theo nguyên nhân' | 'Phân theo yếu tố gây chấn thương',
    rowsList: SummaryClassificationRow[],
    rowKeyPrefix: string
  ) => {
    if (rowsList.length === 0) {
      return (
        <tr className="hover:bg-gray-50/50">
          <td 
            className="py-2 px-1 border-r border-gray-200 text-center font-bold text-gray-900 bg-gray-50/80 align-middle w-24 whitespace-normal break-words text-[9px] leading-tight" 
            rowSpan={1}
          >
            {groupName}
          </td>
          <td className="py-2 px-2 border-r border-gray-200 text-left text-gray-400 italic w-44 whitespace-normal break-words text-[9px] leading-tight pl-2">
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
            className="py-2 px-1 border-r border-gray-200 text-center font-bold text-gray-900 bg-gray-50/80 align-middle w-24 whitespace-normal break-words text-[9px] leading-tight" 
            rowSpan={rowsList.length}
          >
            {groupName}
          </td>
        )}
        <td className="py-2 px-2 border-r border-gray-200 text-left text-gray-700 w-44 whitespace-normal break-words text-[9px] leading-tight pl-2">
          {row.subCategoryName || ''}
        </td>
        <td className="py-2.5 px-1.5 border-r border-gray-200 text-gray-700 text-center font-medium">
          {idx + 1}
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

  return (
    <div className="flex-grow flex flex-col bg-[#F4F6F9] min-h-screen font-sans">
      <div className="bg-white px-6 py-3 flex items-center justify-between border-b border-gray-200 shadow-sm flex-shrink-0">
        <h1 className="text-sm font-bold text-gray-800">Báo cáo tổng hợp</h1>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-lg text-xs font-medium transition-all cursor-pointer bg-white"
        >
          Huỷ bỏ
        </button>
      </div>

      <div className="p-6 overflow-y-auto space-y-6 max-w-[1500px] w-full mx-auto select-text">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-8">
          {loadingSummary ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-medium text-gray-500">Đang tải dữ liệu tổng hợp từ hệ thống...</span>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-800 border-l-4 border-blue-600 pl-2 uppercase tracking-wider">
                  I. Thông tin tổng quan:
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
                        <td className="py-3 px-1.5 border-r border-gray-200">{formatNumber(totalsOverview.participatingCompanies || 0)}</td>
                        <td className="py-3 px-1.5 border-r border-gray-200">{formatNumber(totalsOverview.totalEmployees)}</td>
                        <td className="py-3 px-1.5 border-r border-gray-200">{formatNumber(totalsOverview.reportingEmployees || 0)}</td>
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
                          <td className="py-2.5 px-1.5 border-r border-gray-200">{formatNumber(row.participatingCompanies || 0)}</td>
                          <td className="py-2.5 px-1.5 border-r border-gray-200">{formatNumber(row.totalEmployees)}</td>
                          <td className="py-2.5 px-1.5 border-r border-gray-200">{formatNumber(row.reportingEmployees || 0)}</td>
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
                  II. Phân loại TNLĐ:
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
                        <th className="py-2 border-b border-gray-200 border-r border-gray-200" colSpan={3}>Chi phí do NSDLĐ chi trả (1.000 đ)</th>
                        <th className="py-2 px-1 w-16 whitespace-normal break-words" rowSpan={2}>Thiệt hại tài sản (1.000 đ)</th>
                      </tr>
                      <tr className="bg-[#F9FAFB] border-b border-gray-300 text-gray-600 font-semibold text-[9px] leading-tight">
                        <th className="py-2 px-1 border-r border-gray-200 w-10">Tổng số</th>
                        <th className="py-2 px-1 border-r border-gray-200 w-12">Số vụ có người chết</th>
                        <th className="py-2 px-1 border-r border-gray-300 w-14">Số vụ có từ 2 người bị nạn trở lên</th>
                        <th className="py-2 px-1 border-r border-gray-200 w-10">Tổng số</th>
                        <th className="py-2 px-1 border-r border-gray-200 w-10">Số LĐ nữ</th>
                        <th className="py-2 px-1 border-r border-gray-200 w-12">Số người bị chết</th>
                        <th className="py-2 px-1 border-r border-gray-300 w-14">Số người bị thương nặng</th>
                        <th className="py-2 px-1 border-r border-gray-200 w-10">Y Tế</th>
                        <th className="py-2 px-1 border-r border-gray-200 w-16">Trả lương theo thời gian điều trị</th>
                        <th className="py-2 px-1 border-r border-gray-200 w-16">Bồi thường/ Trợ cấp</th>
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
