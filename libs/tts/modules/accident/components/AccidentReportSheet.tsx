'use client';

import React from 'react';

export interface ReportAccidentDetail {
  id: number;
  reportStatisticId: number;
  accidentCauseId: number | null;
  injuryFactorId: number | null;
  professionId: number | null;
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
  medicalCosts: number | string;
  treatmentSalaryCosts: number | string;
  compensationCosts: number | string;
  totalCosts: number | string;
  totalDaysOff: number;
  propertyDamage: number | string;
  accidentCause?: { code: string; name: string } | null;
  injuryFactor?: { code: string; name: string } | null;
  profession?: { code: string; name: string } | null;
}

export interface ReportStatistic {
  id: number;
  reportId: number;
  reportCategory: 'GENERAL' | 'SUBSIDIZED';
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
  medicalCosts: number | string;
  treatmentSalaryCosts: number | string;
  compensationCosts: number | string;
  totalCosts: number | string;
  totalDaysOff: number;
  propertyDamage: number | string;
  accidentDetails?: ReportAccidentDetail[];
}

export interface RelationalReport {
  id: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  company?: {
    companyName: string;
    taxCode: string;
    provinceDkkd?: { name: string } | null;
    wardDkkd?: { name: string } | null;
  } | null;
  reportPeriod?: {
    name: string;
    year: number;
  } | null;
  statistics?: ReportStatistic[];
}

interface Props {
  report: RelationalReport;
}

interface ProcessedRow {
  totalIncidents: number;
  incidentsWithFatalities: number;
  incidentsWithMultipleVictims: number;
  totalVictims: number;
  unmanagedVictims: number;
  totalFemaleVictims: number;
  unmanagedFemaleVictims: number;
  totalFatalities: number;
  unmanagedFatalities: number;
  totalSevereInjuries: number;
  unmanagedSevereInjuries: number;
}

const formatValueInThousands = (value: number) => {
  return new Intl.NumberFormat('de-DE').format(value);
};

export const AccidentReportSheet = ({ report }: Props) => {
  if (!report) return null;

  const generalStats = report.statistics?.find((s) => s.reportCategory === 'GENERAL') || null;
  const subsidizedStats = report.statistics?.find((s) => s.reportCategory === 'SUBSIDIZED') || null;
  const generalDetails = generalStats?.accidentDetails || [];

  const getDetailRow = (type: 'cause' | 'factor' | 'profession', code: string): ProcessedRow => {
    const detail = generalDetails.find((d) => {
      if (type === 'cause') return d.accidentCause?.code === code;
      if (type === 'factor') return d.injuryFactor?.code === code;
      if (type === 'profession') return d.profession?.code === code;
      return false;
    });

    if (detail) {
      return {
        totalIncidents: Number(detail.totalIncidents) || 0,
        incidentsWithFatalities: Number(detail.incidentsWithFatalities) || 0,
        incidentsWithMultipleVictims: Number(detail.incidentsWithMultipleVictims) || 0,
        totalVictims: Number(detail.totalVictims) || 0,
        unmanagedVictims: Number(detail.unmanagedVictims) || 0,
        totalFemaleVictims: Number(detail.totalFemaleVictims) || 0,
        unmanagedFemaleVictims: Number(detail.unmanagedFemaleVictims) || 0,
        totalFatalities: Number(detail.totalFatalities) || 0,
        unmanagedFatalities: Number(detail.unmanagedFatalities) || 0,
        totalSevereInjuries: Number(detail.totalSevereInjuries) || 0,
        unmanagedSevereInjuries: Number(detail.unmanagedSevereInjuries) || 0,
      };
    }

    return {
      totalIncidents: 0,
      incidentsWithFatalities: 0,
      incidentsWithMultipleVictims: 0,
      totalVictims: 0,
      unmanagedVictims: 0,
      totalFemaleVictims: 0,
      unmanagedFemaleVictims: 0,
      totalFatalities: 0,
      unmanagedFatalities: 0,
      totalSevereInjuries: 0,
      unmanagedSevereInjuries: 0,
    };
  };

  const factorDetails = generalDetails.filter((d) => d.injuryFactor !== null && d.injuryFactor !== undefined);
  const professionDetails = generalDetails.filter((d) => d.profession !== null && d.profession !== undefined);

  const totalIncidents = Number(generalStats?.totalIncidents) || 0;
  const totalFatalIncidents = Number(generalStats?.incidentsWithFatalities) || 0;
  const totalMultipleVictimIncidents = Number(generalStats?.incidentsWithMultipleVictims) || 0;
  const totalVictims = Number(generalStats?.totalVictims) || 0;
  const unmanagedVictims = Number(generalStats?.unmanagedVictims) || 0;
  const totalFemaleVictims = Number(generalStats?.totalFemaleVictims) || 0;
  const unmanagedFemaleVictims = Number(generalStats?.unmanagedFemaleVictims) || 0;
  const totalFatalities = Number(generalStats?.totalFatalities) || 0;
  const unmanagedFatalities = Number(generalStats?.unmanagedFatalities) || 0;
  const totalSeriouslyInjured = Number(generalStats?.totalSevereInjuries) || 0;
  const unmanagedSeriouslyInjured = Number(generalStats?.unmanagedSevereInjuries) || 0;

  const subsidizedIncidents = Number(subsidizedStats?.totalIncidents) || 0;
  const subsidizedFatalIncidents = Number(subsidizedStats?.incidentsWithFatalities) || 0;
  const subsidizedMultipleVictimIncidents = Number(subsidizedStats?.incidentsWithMultipleVictims) || 0;
  const subsidizedVictims = Number(subsidizedStats?.totalVictims) || 0;
  const subsidizedUnmanagedVictims = Number(subsidizedStats?.unmanagedVictims) || 0;
  const subsidizedFemaleVictims = Number(subsidizedStats?.totalFemaleVictims) || 0;
  const subsidizedUnmanagedFemaleVictims = Number(subsidizedStats?.unmanagedFemaleVictims) || 0;
  const subsidizedFatalities = Number(subsidizedStats?.totalFatalities) || 0;
  const subsidizedUnmanagedFatalities = Number(subsidizedStats?.unmanagedFatalities) || 0;
  const subsidizedSeriouslyInjured = Number(subsidizedStats?.totalSevereInjuries) || 0;
  const subsidizedUnmanagedSeriouslyInjured = Number(subsidizedStats?.unmanagedSevereInjuries) || 0;

  const total3_incidents = totalIncidents + subsidizedIncidents;
  const total3_fatalIncidents = totalFatalIncidents + subsidizedFatalIncidents;
  const total3_multipleVictimIncidents = totalMultipleVictimIncidents + subsidizedMultipleVictimIncidents;
  const total3_victims = totalVictims + subsidizedVictims;
  const total3_unmanagedVictims = unmanagedVictims + subsidizedUnmanagedVictims;
  const total3_femaleVictims = totalFemaleVictims + subsidizedFemaleVictims;
  const total3_unmanagedFemaleVictims = unmanagedFemaleVictims + subsidizedUnmanagedFemaleVictims;
  const total3_fatalities = totalFatalities + subsidizedFatalities;
  const total3_unmanagedFatalities = unmanagedFatalities + subsidizedUnmanagedFatalities;
  const total3_seriouslyInjured = totalSeriouslyInjured + subsidizedSeriouslyInjured;
  const total3_unmanagedSeriouslyInjured = unmanagedSeriouslyInjured + subsidizedUnmanagedSeriouslyInjured;

  const totalLeaveDays = (Number(generalStats?.totalDaysOff) || 0) + (Number(subsidizedStats?.totalDaysOff) || 0);
  const medicalExpenses = (Number(generalStats?.medicalCosts) || 0) + (Number(subsidizedStats?.medicalCosts) || 0);
  const treatmentSalaryExpenses = (Number(generalStats?.treatmentSalaryCosts) || 0) + (Number(subsidizedStats?.treatmentSalaryCosts) || 0);
  const compensationExpenses = (Number(generalStats?.compensationCosts) || 0) + (Number(subsidizedStats?.compensationCosts) || 0);
  const propertyDamageExpenses = (Number(generalStats?.propertyDamage) || 0) + (Number(subsidizedStats?.propertyDamage) || 0);

  const cause1 = getDetailRow('cause', '1');
  const cause2 = getDetailRow('cause', '2');
  const cause3 = getDetailRow('cause', '3');
  const cause4 = getDetailRow('cause', '4');
  const cause5 = getDetailRow('cause', '5');
  const cause6 = getDetailRow('cause', '6');
  const cause7 = getDetailRow('cause', '7');
  const cause8 = getDetailRow('cause', '8');
  const cause9 = getDetailRow('cause', '9');

  const renderRow = (title: string, indexStr: string, plLevelClass: string, rowObj: ProcessedRow) => {
    return (
      <tr className="hover:bg-gray-50/50" key={`${title}-${indexStr}`}>
        <td className={`py-2 px-4 border-r border-gray-200 text-left text-gray-500 ${plLevelClass}`}>{title}</td>
        <td className="py-2 px-1.5 border-r border-gray-200">{indexStr}</td>
        <td className="py-2 px-1.5 border-r border-gray-200">{rowObj.totalIncidents}</td>
        <td className="py-2 px-1.5 border-r border-gray-200">{rowObj.incidentsWithFatalities}</td>
        <td className="py-2 px-1.5 border-r border-gray-200">{rowObj.incidentsWithMultipleVictims}</td>
        <td className="py-2 px-1.5 border-r border-gray-200">{rowObj.totalVictims}</td>
        <td className="py-2 px-1.5 border-r border-gray-200">{rowObj.unmanagedVictims}</td>
        <td className="py-2 px-1.5 border-r border-gray-200">{rowObj.totalFemaleVictims}</td>
        <td className="py-2 px-1.5 border-r border-gray-200">{rowObj.unmanagedFemaleVictims}</td>
        <td className="py-2 px-1.5 border-r border-gray-200 text-red-500 font-semibold">{rowObj.totalFatalities}</td>
        <td className="py-2 px-1.5 border-r border-gray-200">{rowObj.unmanagedFatalities}</td>
        <td className="py-2 px-1.5 border-r border-gray-200">{rowObj.totalSevereInjuries}</td>
        <td className="py-2 px-1.5">{rowObj.unmanagedSevereInjuries}</td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      
      <div>
        <h3 className="text-xs font-bold text-gray-800 mb-3 border-l-4 border-blue-600 pl-2 uppercase tracking-wider">I. Tình hình chung tai nạn lao động</h3>
        <div className="overflow-x-auto border border-gray-300 rounded-xl shadow-xs bg-white">
          <table className="w-full text-center border-collapse text-xs min-w-[1100px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-300 text-gray-700 font-bold text-xs">
                <th className="py-2.5 px-3 border-r border-gray-300 text-left w-72 text-xs" rowSpan={4}>Tên chỉ tiêu thống kê</th>
                <th className="py-2.5 px-2 border-r border-gray-300 w-12 text-xs" rowSpan={4}>Mã số</th>
                <th className="py-2 border-b border-gray-300 text-xs" colSpan={11}>Phân loại TNLĐ theo mức độ thương tật</th>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-300 text-gray-700 font-bold text-xs">
                <th className="py-2 border-r border-gray-200 text-xs" colSpan={3}>Số vụ (Vụ)</th>
                <th className="py-2 text-xs" colSpan={8}>Số người bị nạn (Người)</th>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold text-[11px]">
                <th className="py-2 px-1 border-r border-gray-200 w-14 text-[11px]" rowSpan={2}>Tổng số</th>
                <th className="py-2 px-1 border-r border-gray-200 w-20 text-[11px]" rowSpan={2}>Vụ có người chết</th>
                <th className="py-2 px-1 border-r border-gray-300 w-24 text-[11px]" rowSpan={2}>Vụ có từ 2 người bị nạn trở lên</th>

                <th className="py-2 px-1 border-r border-gray-200 text-[11px]" colSpan={2}>Tổng số</th>
                <th className="py-2 px-1 border-r border-gray-200 text-[11px]" colSpan={2}>Số LĐ nữ</th>
                <th className="py-2 px-1 border-r border-gray-200 text-[11px]" colSpan={2}>Số người bị chết</th>
                <th className="py-2 px-1 border-r border-gray-200 text-[11px]" colSpan={2}>Số người bị thương nặng</th>
              </tr>
              <tr className="bg-[#F9FAFB] border-b border-gray-300 text-gray-600 font-semibold text-[10px]">
                <th className="py-2 px-1 border-r border-gray-200 text-[10px]">Tổng số</th>
                <th className="py-2 px-1 border-r border-gray-200 text-[10px]">NN không thuộc quyền quản lý</th>
                <th className="py-2 px-1 border-r border-gray-200 text-[10px]">Tổng số</th>
                <th className="py-2 px-1 border-r border-gray-200 text-[10px]">NN không thuộc quyền quản lý</th>
                <th className="py-2 px-1 border-r border-gray-200 text-[10px]">Tổng số</th>
                <th className="py-2 px-1 border-r border-gray-200 text-[10px]">NN không thuộc quyền quản lý</th>
                <th className="py-2 px-1 border-r border-gray-200 text-[10px]">Tổng số</th>
                <th className="py-2 px-1 text-[10px]">NN không thuộc quyền quản lý</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-150 text-[11px] font-medium text-gray-800">
              
              <tr className="bg-slate-50 border-y border-gray-300 font-bold">
                <td className="py-2.5 px-4 border-r border-gray-200 text-left font-bold text-gray-900" colSpan={13}>
                  1. Tai nạn lao động
                </td>
              </tr>
              <tr className="bg-slate-50/50 border-b border-gray-200 font-semibold text-gray-800">
                <td className="py-2.5 px-4 border-r border-gray-200 text-left text-gray-500 pl-6">Tai nạn lao động</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200">1</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200">{totalIncidents}</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200">{totalFatalIncidents}</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200">{totalMultipleVictimIncidents}</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200">{totalVictims}</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200">{unmanagedVictims}</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200">{totalFemaleVictims}</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200">{unmanagedFemaleVictims}</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200 text-red-600 font-bold">{totalFatalities}</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200">{unmanagedFatalities}</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200">{totalSeriouslyInjured}</td>
                <td className="py-2.5 px-1.5 font-semibold">{unmanagedSeriouslyInjured}</td>
              </tr>

              <tr className="bg-gray-50/70 font-bold text-[11px] text-gray-700">
                <td className="py-2.5 px-4 border-r border-gray-200 text-left pl-4" colSpan={13}>
                  1.1. Phân theo nguyên nhân xảy ra TNLĐ
                </td>
              </tr>
              
              <tr className="bg-gray-50/30 font-semibold text-[11px] text-gray-600">
                <td className="py-2.5 px-4 border-r border-gray-200 text-left pl-7" colSpan={13}>
                  a. Do người sử dụng lao động
                </td>
              </tr>
              
              {renderRow('Không có thiết bị an toàn hoặc thiết bị không đảm bảo an toàn', '1', 'pl-10', cause1)}
              {renderRow('Không có phương tiện bảo vệ cá nhân hoặc phương tiện bảo vệ cá nhân không tốt', '2', 'pl-10', cause2)}
              {renderRow('Tổ chức lao động không hợp lý', '3', 'pl-10', cause3)}
              {renderRow('Chưa huấn luyện hoặc huấn luyện an toàn vệ sinh lao động chưa đầy đủ', '4', 'pl-10', cause4)}
              {renderRow('Không có quy trình an toàn hoặc biện pháp làm việc an toàn', '5', 'pl-10', cause5)}
              {renderRow('Điều kiện làm việc không tốt', '6', 'pl-10', cause6)}

              <tr className="bg-gray-50/30 font-semibold text-[11px] text-gray-600">
                <td className="py-2.5 px-4 border-r border-gray-200 text-left pl-7" colSpan={13}>
                  b. Do người lao động
                </td>
              </tr>
              
              {renderRow('Quy phạm nội quy, quy trình, quy chuẩn, biện pháp làm việc an toàn', '7', 'pl-10', cause7)}
              {renderRow('Không sử dụng phương tiện bảo vệ cá nhân', '8', 'pl-10', cause8)}
              {renderRow('Khách quan khó tránh/ Nguyên nhân chưa kể đến', '9', 'pl-10', cause9)}

              <tr className="bg-gray-50/70 font-bold text-[11px] text-gray-700">
                <td className="py-2.5 px-4 border-r border-gray-200 text-left pl-4" colSpan={13}>
                  1.2. Phân theo yếu tố gây chấn thương
                </td>
              </tr>
              {factorDetails.length === 0 ? (
                <tr className="hover:bg-gray-50/50">
                  <td className="py-2 px-4 border-r border-gray-200 text-left text-gray-400 italic pl-10" colSpan={2}>Không có dữ liệu yếu tố gây chấn thương</td>
                  <td colSpan={11} className="py-2 px-1.5"></td>
                </tr>
              ) : (
                factorDetails.map((detail, idx) => {
                  const rowObj: ProcessedRow = {
                    totalIncidents: Number(detail.totalIncidents) || 0,
                    incidentsWithFatalities: Number(detail.incidentsWithFatalities) || 0,
                    incidentsWithMultipleVictims: Number(detail.incidentsWithMultipleVictims) || 0,
                    totalVictims: Number(detail.totalVictims) || 0,
                    unmanagedVictims: Number(detail.unmanagedVictims) || 0,
                    totalFemaleVictims: Number(detail.totalFemaleVictims) || 0,
                    unmanagedFemaleVictims: Number(detail.unmanagedFemaleVictims) || 0,
                    totalFatalities: Number(detail.totalFatalities) || 0,
                    unmanagedFatalities: Number(detail.unmanagedFatalities) || 0,
                    totalSevereInjuries: Number(detail.totalSevereInjuries) || 0,
                    unmanagedSevereInjuries: Number(detail.unmanagedSevereInjuries) || 0,
                  };
                  return renderRow(detail.injuryFactor?.name || '—', detail.injuryFactor?.code || (idx + 1).toString(), 'pl-10', rowObj);
                })
              )}

              <tr className="bg-gray-50/70 font-bold text-[11px] text-gray-700">
                <td className="py-2.5 px-4 border-r border-gray-200 text-left pl-4" colSpan={13}>
                  1.3. Phân theo nghề nghiệp
                </td>
              </tr>
              {professionDetails.length === 0 ? (
                <tr className="hover:bg-gray-50/50">
                  <td className="py-2 px-4 border-r border-gray-200 text-left text-gray-400 italic pl-10" colSpan={2}>Không có dữ liệu nghề nghiệp</td>
                  <td colSpan={11} className="py-2 px-1.5"></td>
                </tr>
              ) : (
                professionDetails.map((detail, idx) => {
                  const rowObj: ProcessedRow = {
                    totalIncidents: Number(detail.totalIncidents) || 0,
                    incidentsWithFatalities: Number(detail.incidentsWithFatalities) || 0,
                    incidentsWithMultipleVictims: Number(detail.incidentsWithMultipleVictims) || 0,
                    totalVictims: Number(detail.totalVictims) || 0,
                    unmanagedVictims: Number(detail.unmanagedVictims) || 0,
                    totalFemaleVictims: Number(detail.totalFemaleVictims) || 0,
                    unmanagedFemaleVictims: Number(detail.unmanagedFemaleVictims) || 0,
                    totalFatalities: Number(detail.totalFatalities) || 0,
                    unmanagedFatalities: Number(detail.unmanagedFatalities) || 0,
                    totalSevereInjuries: Number(detail.totalSevereInjuries) || 0,
                    unmanagedSevereInjuries: Number(detail.unmanagedSevereInjuries) || 0,
                  };
                  return renderRow(detail.profession?.name || '—', detail.profession?.code || (idx + 1).toString(), 'pl-10', rowObj);
                })
              )}

              <tr className="bg-slate-50 border-y border-gray-300 font-bold">
                <td className="py-2.5 px-4 border-r border-gray-200 text-left font-bold text-gray-900" colSpan={13}>
                  2. Tai nạn được hưởng trợ cấp theo quy định tại Khoản 2 Điều 39 Luật ATVSLĐ
                </td>
              </tr>
              <tr className="bg-slate-50/50 border-b border-gray-200 font-semibold text-gray-800">
                <td className="py-2.5 px-4 border-r border-gray-200 text-left text-gray-500 pl-6"></td>
                <td className="py-2.5 px-1.5 border-r border-gray-200 font-bold">2</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200 font-bold">{subsidizedIncidents}</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200 font-bold">0</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200 font-bold">0</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200 font-bold">{subsidizedVictims}</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200 font-bold">0</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200 font-bold">{subsidizedFemaleVictims}</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200 font-bold">0</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200 font-bold text-red-600">{subsidizedFatalities}</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200 font-bold">0</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200 font-bold">{subsidizedSeriouslyInjured}</td>
                <td className="py-2.5 px-1.5 font-bold">0</td>
              </tr>

              <tr className="bg-slate-100 border-y border-gray-300 font-bold">
                <td className="py-3 px-4 border-r border-gray-200 text-left font-bold text-gray-900" colSpan={13}>
                  3. Tổng số (3 = 1 + 2)
                </td>
              </tr>
              <tr className="bg-slate-100/50 border-b border-gray-300 font-black text-gray-900">
                <td className="py-3 px-4 border-r border-gray-200 text-left pl-6 font-bold text-gray-800">Tổng số (3 = 1 + 2)</td>
                <td className="py-3 px-1.5 border-r border-gray-200 font-black"></td>
                <td className="py-3 px-1.5 border-r border-gray-200 font-black">{total3_incidents}</td>
                <td className="py-3 px-1.5 border-r border-gray-300 font-black">{total3_fatalIncidents}</td>
                <td className="py-3 px-1.5 border-r border-gray-300 font-black">{total3_multipleVictimIncidents}</td>
                <td className="py-3 px-1.5 border-r border-gray-200 font-black">{total3_victims}</td>
                <td className="py-3 px-1.5 border-r border-gray-200 font-black">{total3_unmanagedVictims}</td>
                <td className="py-3 px-1.5 border-r border-gray-200 font-black">{total3_femaleVictims}</td>
                <td className="py-3 px-1.5 border-r border-gray-200 font-black">{total3_unmanagedFemaleVictims}</td>
                <td className="py-3 px-1.5 border-r border-gray-200 font-black text-red-600">{total3_fatalities}</td>
                <td className="py-3 px-1.5 border-r border-gray-200 font-black">{total3_unmanagedFatalities}</td>
                <td className="py-3 px-1.5 border-r border-gray-200 font-black">{total3_seriouslyInjured}</td>
                <td className="py-3 px-1.5 font-black">{total3_unmanagedSeriouslyInjured}</td>
              </tr>
              
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-gray-800 mb-3 border-l-4 border-blue-600 pl-2 uppercase tracking-wider">II. Thiệt hại do tai nạn lao động</h3>
        <div className="overflow-x-auto border border-gray-300 rounded-xl shadow-xs bg-white">
          <table className="w-full text-center border-collapse text-xs min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-300 text-gray-700 font-bold text-xs">
                <th className="py-2.5 px-3 border-r border-gray-200 w-1/4 text-xs" rowSpan={3}>
                  Tổng số ngày nghỉ vì tai nạn lao động (kể cả ngày nghỉ chế độ)
                </th>
                <th className="py-2 border-b border-gray-300 text-xs" colSpan={4}>
                  Tổng số tiền thiệt hại vì TNLĐ (1.000 đ)
                </th>
                <th className="py-2.5 px-3 w-1/4 font-bold text-xs" rowSpan={3}>
                  Thiệt hại tài sản (1.000 đ)
                </th>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold text-xs">
                <th className="py-2 border-r border-gray-200 w-24 text-xs" rowSpan={2}>Tổng số</th>
                <th className="py-2 text-xs" colSpan={3}>Khoản chi cụ thể của cơ sở</th>
              </tr>
              <tr className="bg-[#F9FAFB] border-b border-gray-200 text-gray-600 font-bold text-[11px]">
                <th className="py-2 px-1 border-r border-gray-200 text-[11px]">Y tế</th>
                <th className="py-2 px-1 border-r border-gray-200 text-[11px]">Trả lương trong thời gian điều trị</th>
                <th className="py-2 px-1 border-r border-gray-200 text-[11px]">Bồi thường / Trợ cấp</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-200 font-medium text-gray-800 text-[11px]">
              <tr>
                <td className="py-3 px-3 border-r border-gray-200 font-bold text-gray-900">
                  {totalLeaveDays}
                </td>
                <td className="py-3 px-2 border-r border-gray-200 font-bold text-gray-800">
                  {formatValueInThousands(medicalExpenses + treatmentSalaryExpenses + compensationExpenses)}
                </td>
                <td className="py-3 px-2 border-r border-gray-200 text-gray-700">
                  {formatValueInThousands(medicalExpenses)}
                </td>
                <td className="py-3 px-2 border-r border-gray-200 text-gray-700">
                  {formatValueInThousands(treatmentSalaryExpenses)}
                </td>
                <td className="py-3 px-2 border-r border-gray-200 text-gray-700">
                  {formatValueInThousands(compensationExpenses)}
                </td>
                <td className="py-3 px-2 font-bold text-amber-600">
                  {formatValueInThousands(propertyDamageExpenses)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
