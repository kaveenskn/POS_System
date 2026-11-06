import { apiClient } from '../lib/api';
import type {
  Employee,
  EmployeeCreateInput,
  EmployeeListResponse,
  EmployeeUpdateInput,
  SalaryRecord,
  SalaryRecordCreate,
  SalaryRecordUpdate,
} from '../types/employee.types';

export const employeeService = {
  async getEmployees(params?: { search?: string; skip?: number; limit?: number }): Promise<EmployeeListResponse> {
    const { data } = await apiClient.get<EmployeeListResponse>('/employees', { params });
    return data;
  },

  async createEmployee(input: EmployeeCreateInput): Promise<Employee> {
    const { data } = await apiClient.post<Employee>('/employees', input);
    return data;
  },

  async updateEmployee(id: number, input: EmployeeUpdateInput): Promise<Employee> {
    const { data } = await apiClient.patch<Employee>(`/employees/${id}`, input);
    return data;
  },

  async getEmployeeSalaries(employeeId: number): Promise<SalaryRecord[]> {
    const { data } = await apiClient.get<SalaryRecord[]>(`/employees/${employeeId}/salaries`);
    return data;
  },

  async createSalaryRecord(employeeId: number, input: SalaryRecordCreate): Promise<SalaryRecord> {
    const { data } = await apiClient.post<SalaryRecord>(`/employees/${employeeId}/salaries`, input);
    return data;
  },

  async updateSalaryRecord(salaryId: number, input: SalaryRecordUpdate): Promise<SalaryRecord> {
    const { data } = await apiClient.patch<SalaryRecord>(`/employees/salaries/${salaryId}`, input);
    return data;
  },
};

