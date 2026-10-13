'use client';

import React from 'react';

export interface ReportStatistic {
  id: string;
  code: string;
  name: string;
  incidents: number;
  fatalIncidents: number;
  multipleVictimIncidents: number;

  victims: number;
  unmanagedVictims: number;

  femaleVictims: number;
  unmanagedFemaleVictims: number;

  fatalities: number;
  unmanagedFatalities: number;

  seriouslyInjured: number;
  unmanagedSeriouslyInjured: number;
  totalLeaveDays: number;

  subsidizedTotalLeaveDays: number;

}

export interface ReportData {
  id: number;
  companyName: string;
  taxCode: string;
  period: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  year: number;
  province: string;
  ward: string;
  
  totalIncidents: number;
  totalFatalIncidents: number;
  totalMultipleVictimIncidents: number;
  totalVictims: number;
  totalFemaleVictims: number;
  totalFatalities: number;
  totalSeriouslyInjured: number;
  unmanagedVictims: number;
  unmanagedFemaleVictims: number;
  unmanagedFatalities: number;
  unmanagedSeriouslyInjured: number;
  
  medicalExpenses: number;
  treatmentSalaryExpenses: number;
  compensationExpenses: number;
  totalLeaveDays: number;
  propertyDamageExpenses: number;
  
    causes: ReportStatistic[];

    factors: ReportStatistic[];

    professions: ReportStatistic[];

  subsidizedIncidents: number;
  subsidizedFatalIncidents: number;
  subsidizedMultipleVictimIncidents: number;
  subsidizedVictims: number;
  subsidizedFemaleVictims: number;
  subsidizedFatalities: number;
  subsidizedSeriouslyInjured: number;
  subsidizedUnmanagedVictims: number;
  subsidizedUnmanagedFemaleVictims: number;
  subsidizedUnmanagedFatalities: number;
  subsidizedUnmanagedSeriouslyInjured: number;
  subsidizedTotalLeaveDays: number;
}

interface Props {
  report: ReportData;
}

const formatValueInThousands = (value: number | undefined | null) => {
  const num = Number(value ?? 0); 
  if (isNaN(num)) return "0";
  return new Intl.NumberFormat('de-DE').format(num);
};



export const ReportSheet = ({ report }: Props) => {
    const getCause = (id: string) =>
    report.causes.find(c => c.id === id);
    const getFactor = (id: string) =>
    report.factors.find(f => f.id === id);
    
  const total3_incidents = report.totalIncidents + report.subsidizedIncidents;
  const total3_fatalIncidents = report.totalFatalIncidents + report.subsidizedFatalIncidents;
  const total3_multipleVictimIncidents = report.totalMultipleVictimIncidents + report.subsidizedMultipleVictimIncidents;
  const total3_victims = report.totalVictims + report.subsidizedVictims;
  const total3_unmanagedVictims = report.unmanagedVictims + report.subsidizedUnmanagedVictims;
  const total3_femaleVictims = report.totalFemaleVictims + report.subsidizedFemaleVictims;
  const total3_unmanagedFemaleVictims = report.unmanagedFemaleVictims + report.subsidizedUnmanagedFemaleVictims;
  const total3_fatalities = report.totalFatalities + report.subsidizedFatalities;
  const total3_unmanagedFatalities = report.unmanagedFatalities + report.subsidizedUnmanagedFatalities;
  const total3_seriouslyInjured = report.totalSeriouslyInjured + report.subsidizedSeriouslyInjured;
  const total3_unmanagedSeriouslyInjured = report.unmanagedSeriouslyInjured + report.subsidizedUnmanagedSeriouslyInjured;
console.log({
  totalLeaveDays: report.totalLeaveDays,
  subsidizedTotalLeaveDays: report.subsidizedTotalLeaveDays,
});
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
                <td className="py-2.5 px-1.5 border-r border-gray-200">{report.totalIncidents}</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200">{report.totalFatalIncidents}</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200">{report.totalMultipleVictimIncidents}</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200">{report.totalVictims}</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200">{report.unmanagedVictims}</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200">{report.totalFemaleVictims}</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200">{report.unmanagedFemaleVictims}</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200 text-red-600 font-bold">{report.totalFatalities}</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200">{report.unmanagedFatalities}</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200">{report.totalSeriouslyInjured}</td>
                <td className="py-2.5 px-1.5 font-semibold">{report.unmanagedSeriouslyInjured}</td>
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
              
                <tr className="hover:bg-gray-50/50">
                <td className="py-2 px-4 border-r border-gray-200 text-left text-gray-500 pl-10">
                    Không có thiết bị an toàn hoặc thiết bị không đảm bảo an toàn
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">1</td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("1")?.incidents ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("1")?.fatalIncidents ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("1")?.multipleVictimIncidents ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("1")?.victims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("1")?.unmanagedVictims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("1")?.femaleVictims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("1")?.unmanagedFemaleVictims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200 text-red-500">
                    {getCause("1")?.fatalities ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("1")?.unmanagedFatalities ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("1")?.seriouslyInjured ?? 0}
                </td>

                <td className="py-2 px-1.5">
                    {getCause("1")?.unmanagedSeriouslyInjured ?? 0}
                </td>
                </tr>
              <tr className="hover:bg-gray-50/50">
                <td className="py-2 px-4 border-r border-gray-200 text-left text-gray-500 pl-10">Không có phương tiện bảo vệ cá nhân hoặc phương tiện bảo vệ cá nhân không tốt</td>
                <td className="py-2 px-1.5 border-r border-gray-200">2</td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("2")?.incidents ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("2")?.fatalIncidents ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("2")?.multipleVictimIncidents ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("2")?.victims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("2")?.unmanagedVictims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("2")?.femaleVictims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("2")?.unmanagedFemaleVictims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200 text-red-500">
                    {getCause("2")?.fatalities ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("2")?.unmanagedFatalities ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("2")?.seriouslyInjured ?? 0}
                </td>

                <td className="py-2 px-1.5">
                    {getCause("2")?.unmanagedSeriouslyInjured ?? 0}
                </td>
              </tr>
              <tr className="hover:bg-gray-50/50">
                <td className="py-2 px-4 border-r border-gray-200 text-left text-gray-500 pl-10">Tổ chức lao động không hợp lý</td>
                <td className="py-2 px-1.5 border-r border-gray-200">3</td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("3")?.incidents ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("3")?.fatalIncidents ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("3")?.multipleVictimIncidents ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("3")?.victims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("3")?.unmanagedVictims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("3")?.femaleVictims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("3")?.unmanagedFemaleVictims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200 text-red-500">
                    {getCause("3")?.fatalities ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("3")?.unmanagedFatalities ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("3")?.seriouslyInjured ?? 0}
                </td>

                <td className="py-2 px-1.5">
                    {getCause("3")?.unmanagedSeriouslyInjured ?? 0}
                </td>
              </tr>
              <tr className="hover:bg-gray-50/50">
                <td className="py-2 px-4 border-r border-gray-200 text-left text-gray-500 pl-10">Chưa huấn luyện hoặc huấn luyện an toàn vệ sinh lao động chưa đầy đủ</td>
                <td className="py-2 px-1.5 border-r border-gray-200">4</td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("4")?.incidents ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("4")?.fatalIncidents ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("4")?.multipleVictimIncidents ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("4")?.victims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("4")?.unmanagedVictims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("4")?.femaleVictims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("4")?.unmanagedFemaleVictims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200 text-red-500">
                    {getCause("4")?.fatalities ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("4")?.unmanagedFatalities ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("4")?.seriouslyInjured ?? 0}
                </td>

                <td className="py-2 px-1.5">
                    {getCause("4")?.unmanagedSeriouslyInjured ?? 0}
                </td>
              </tr>
              <tr className="hover:bg-gray-50/50">
                <td className="py-2 px-4 border-r border-gray-200 text-left text-gray-500 pl-10">Không có quy trình an toàn hoặc biện pháp làm việc an toàn</td>
                <td className="py-2 px-1.5 border-r border-gray-200">5</td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("5")?.incidents ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("5")?.fatalIncidents ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("5")?.multipleVictimIncidents ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("5")?.victims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("5")?.unmanagedVictims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("5")?.femaleVictims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("5")?.unmanagedFemaleVictims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200 text-red-500">
                    {getCause("5")?.fatalities ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("5")?.unmanagedFatalities ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("5")?.seriouslyInjured ?? 0}
                </td>

                <td className="py-2 px-1.5">
                    {getCause("5")?.unmanagedSeriouslyInjured ?? 0}
                </td>
              </tr>
              <tr className="hover:bg-gray-50/50">
                <td className="py-2 px-4 border-r border-gray-200 text-left text-gray-500 pl-10">Điều kiện làm việc không tốt</td>
                <td className="py-2 px-1.5 border-r border-gray-200">6</td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("6")?.incidents ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("6")?.fatalIncidents ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("6")?.multipleVictimIncidents ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("6")?.victims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("6")?.unmanagedVictims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("6")?.femaleVictims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("6")?.unmanagedFemaleVictims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200 text-red-500">
                    {getCause("6")?.fatalities ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("6")?.unmanagedFatalities ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("6")?.seriouslyInjured ?? 0}
                </td>

                <td className="py-2 px-1.5">
                    {getCause("6")?.unmanagedSeriouslyInjured ?? 0}
                </td>
              </tr>

              <tr className="bg-gray-50/30 font-semibold text-[11px] text-gray-600">
                <td className="py-2.5 px-4 border-r border-gray-200 text-left pl-7" colSpan={13}>
                  b. Do người lao động
                </td>
              </tr>
              
              <tr className="hover:bg-gray-50/50">
                <td className="py-2 px-4 border-r border-gray-200 text-left text-gray-500 pl-10">Quy phạm nội quy, quy trình, quy chuẩn, biện pháp làm việc an toàn</td>
                <td className="py-2 px-1.5 border-r border-gray-200">7</td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("7")?.incidents ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("7")?.fatalIncidents ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("7")?.multipleVictimIncidents ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("7")?.victims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("7")?.unmanagedVictims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("7")?.femaleVictims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("7")?.unmanagedFemaleVictims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200 text-red-500">
                    {getCause("7")?.fatalities ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("7")?.unmanagedFatalities ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("7")?.seriouslyInjured ?? 0}
                </td>

                <td className="py-2 px-1.5">
                    {getCause("7")?.unmanagedSeriouslyInjured ?? 0}
                </td>
              </tr>
              <tr className="hover:bg-gray-50/50">
                <td className="py-2 px-4 border-r border-gray-200 text-left text-gray-500 pl-10">Không sử dụng phương tiện bảo vệ cá nhân</td>
                <td className="py-2 px-1.5 border-r border-gray-200">8</td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("8")?.incidents ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("8")?.fatalIncidents ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("8")?.multipleVictimIncidents ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("8")?.victims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("8")?.unmanagedVictims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("8")?.femaleVictims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("8")?.unmanagedFemaleVictims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200 text-red-500">
                    {getCause("8")?.fatalities ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("8")?.unmanagedFatalities ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("8")?.seriouslyInjured ?? 0}
                </td>

                <td className="py-2 px-1.5">
                    {getCause("8")?.unmanagedSeriouslyInjured ?? 0}
                </td>
              </tr>
              <tr className="hover:bg-gray-50/50">
                <td className="py-2 px-4 border-r border-gray-200 text-left text-gray-500 pl-10">Khách quan khó tránh/ Nguyên nhân chưa kể đến</td>
                <td className="py-2 px-1.5 border-r border-gray-200">9</td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("9")?.incidents ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("9")?.fatalIncidents ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("9")?.multipleVictimIncidents ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("9")?.victims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("9")?.unmanagedVictims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("9")?.femaleVictims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("9")?.unmanagedFemaleVictims ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200 text-red-500">
                    {getCause("9")?.fatalities ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("9")?.unmanagedFatalities ?? 0}
                </td>

                <td className="py-2 px-1.5 border-r border-gray-200">
                    {getCause("9")?.seriouslyInjured ?? 0}
                </td>

                <td className="py-2 px-1.5">
                    {getCause("9")?.unmanagedSeriouslyInjured ?? 0}
                </td>
              </tr>

              <tr className="bg-gray-50/70 font-bold text-[11px] text-gray-700">
                <td className="py-2.5 px-4 border-r border-gray-200 text-left pl-4" colSpan={13}>
                  1.2. Phân theo yếu tố gây chấn thương
                </td>
              </tr>
                {report.factors.map((factor) => (

                <tr key={factor.id} className="hover:bg-gray-50/50">

                    <td className="py-2 px-4 border-r border-gray-200 text-left pl-10">
                        {factor.name}
                    </td>

                    <td className="py-2 px-1.5 border-r border-gray-200">
                        {factor.id}
                    </td>

                    <td className="py-2 px-1.5 border-r border-gray-200">{factor.incidents}</td>

                    <td className="py-2 px-1.5 border-r border-gray-200">{factor.fatalIncidents}</td>

                    <td className="py-2 px-1.5 border-r border-gray-200">{factor.multipleVictimIncidents}</td>

                    <td className="py-2 px-1.5 border-r border-gray-200">{factor.victims}</td>

                    <td className="py-2 px-1.5 border-r border-gray-200">{factor.unmanagedVictims}</td>

                    <td className="py-2 px-1.5 border-r border-gray-200">{factor.femaleVictims}</td>

                    <td className="py-2 px-1.5 border-r border-gray-200">{factor.unmanagedFemaleVictims}</td>

                    <td className="py-2 px-1.5 border-r border-gray-200 text-red-500">{factor.fatalities}</td>

                    <td className="py-2 px-1.5 border-r border-gray-200">{factor.unmanagedFatalities}</td>

                    <td className="py-2 px-1.5 border-r border-gray-200">{factor.seriouslyInjured}</td>

                    <td className="py-2 px-1.5 border-r border-gray-200">{factor.unmanagedSeriouslyInjured}</td>

                </tr>

                ))}

              <tr className="bg-gray-50/70 font-bold text-[11px] text-gray-700">
                <td className="py-2.5 px-4 border-r border-gray-200 text-left pl-4" colSpan={13}>
                  1.3. Phân theo nghề nghiệp
                </td>
              </tr>
                {report.professions.map((profession) => (

                <tr key={profession.id} className="hover:bg-gray-50/50">

                    <td className="py-2 px-4 border-r border-gray-200 text-left pl-10">
                        {profession.name}
                    </td>

                    <td className="py-2 px-1.5 border-r border-gray-200">
                        {profession.code}
                    </td>

                    <td>{profession.incidents}</td>

                    <td>{profession.fatalIncidents}</td>

                    <td>{profession.multipleVictimIncidents}</td>

                    <td>{profession.victims}</td>

                    <td>{profession.unmanagedVictims}</td>

                    <td>{profession.femaleVictims}</td>

                    <td>{profession.unmanagedFemaleVictims}</td>

                    <td>{profession.fatalities}</td>

                    <td>{profession.unmanagedFatalities}</td>

                    <td>{profession.seriouslyInjured}</td>

                    <td>{profession.unmanagedSeriouslyInjured}</td>

                </tr>

                ))}

              <tr className="bg-slate-50 border-y border-gray-300 font-bold">
                <td className="py-2.5 px-4 border-r border-gray-200 text-left font-bold text-gray-900" colSpan={13}>
                  2. Tai nạn được hưởng trợ cấp theo quy định tại Khoản 2 Điều 39 Luật ATVSLĐ
                </td>
              </tr>
              <tr className="bg-slate-50/50 border-b border-gray-200 font-semibold text-gray-800">
                <td className="py-2.5 px-4 border-r border-gray-200 text-left text-gray-500 pl-6"></td>
                <td className="py-2.5 px-1.5 border-r border-gray-200 font-bold">2</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200 font-bold">{report.subsidizedIncidents}</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200 font-bold">0</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200 font-bold">0</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200 font-bold">{report.subsidizedVictims}</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200 font-bold">0</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200 font-bold">{report.subsidizedFemaleVictims}</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200 font-bold">0</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200 font-bold text-red-600">{report.subsidizedFatalities}</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200 font-bold">0</td>
                <td className="py-2.5 px-1.5 border-r border-gray-200 font-bold">{report.subsidizedSeriouslyInjured}</td>
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
                <td className="py-3 px-1.5 border-r border-gray-200 font-black">{total3_fatalIncidents}</td>
                <td className="py-3 px-1.5 border-r border-gray-200 font-black">{total3_multipleVictimIncidents}</td>
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
                  Tổng số ngày nghỉ vì TNLĐ (1.000 đ)
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
                    {(report.totalLeaveDays ?? 0) + (report.subsidizedTotalLeaveDays ?? 0)}
                    </td>
                <td className="py-3 px-2 border-r border-gray-200 font-bold text-gray-800">
                {formatValueInThousands(((report.medicalExpenses ?? 0) + (report.treatmentSalaryExpenses ?? 0) + (report.compensationExpenses ?? 0)))}
                </td>
                <td className="py-3 px-2 border-r border-gray-200 text-gray-700">
                  {formatValueInThousands(Number(report.medicalExpenses ?? 0))}
                </td>
                <td className="py-3 px-2 border-r border-gray-200 text-gray-700">
                  {formatValueInThousands(report.treatmentSalaryExpenses)}
                </td>
                <td className="py-3 px-2 border-r border-gray-200 text-gray-700">
                  {formatValueInThousands(report.compensationExpenses)}
                </td>
                <td className="py-3 px-2 font-bold text-amber-600">
                  {formatValueInThousands(report.propertyDamageExpenses)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
