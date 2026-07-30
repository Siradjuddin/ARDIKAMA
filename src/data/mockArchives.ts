import { ArchiveDocument, ComplianceRecord } from '../types';
import { getAllEmployees } from './employees';

export const INITIAL_ARCHIVES: ArchiveDocument[] = [];

export function generateInitialComplianceRecords(dateStr: string): ComplianceRecord[] {
  // Fresh start for real office usage: All employee compliance starts as 'BELUM'
  const employees = getAllEmployees();
  return employees.map((emp) => {
    return {
      employeeNip: emp.nip,
      employeeName: emp.name,
      date: dateStr,
      lkhStatus: 'BELUM',
      lkbStatus: 'BELUM',
      sptStatus: 'BELUM',
      lkhDocId: undefined,
      lastUpdated: new Date().toISOString()
    };
  });
}


