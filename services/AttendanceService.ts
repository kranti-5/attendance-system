// Global type declarations
declare global {
  var attendanceStorage: AttendanceRecord[];
  var employeesStorage: Employee[];
}

import { reactFaceRecognitionService } from './ReactFaceRecognitionService';

export interface Employee {
  id: string;
  name: string;
  position: string;
  photoUri: string;
  faceEncoding?: number[]; // Face embedding for comparison
  isActive: boolean;
  azurePersonId?: string; // Azure Face API person ID
}

export interface AttendanceRecord {
  id: string;
  workerId: string;
  workerName: string;
  timestamp: Date;
  type: 'check-in' | 'check-out';
  photoUri?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  status: 'pending' | 'verified' | 'rejected';
  confidence?: number; // Face recognition confidence score
}

class AttendanceService {
  private storageKey = 'attendance_records';
  private employeesKey = 'employees';

  // Initialize with demo employees
  constructor() {
    this.initializeDemoEmployees();
    this.initializeFaceRecognition();
  }

  private async initializeFaceRecognition() {
    try {
      const initialized = await reactFaceRecognitionService.initializeFaceset();
      if (initialized) {
        console.log('React Face recognition service initialized successfully');
      } else {
        console.log('React Face recognition service running in simulation mode');
      }
    } catch (error) {
      console.error('Failed to initialize face recognition:', error);
    }
  }

  private async initializeDemoEmployees() {
    const existingEmployees = await this.getEmployees();
    if (existingEmployees.length === 0) {
      const demoEmployees: Employee[] = [
        {
          id: 'emp_001',
          name: 'John Doe',
          position: 'Software Developer',
          photoUri: "./assets/images/kp1.jpg",
          isActive: true,
        },
        {
          id: 'emp_002',
          name: 'Jane Smith',
          position: 'UI/UX Designer',
          photoUri: "./assets/images/kp2.jpg",
          isActive: true,
        },
        {
          id: 'emp_003',
          name: 'Mike Johnson',
          position: 'Project Manager',
          photoUri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          isActive: true,
        },
      ];
      await this.saveEmployees(demoEmployees);
    }
  }

  // Employee Management
  async getEmployees(): Promise<Employee[]> {
    try {
      const employees = await this.getEmployeesFromStorage();
      return employees.filter(emp => emp.isActive);
    } catch (error) {
      console.error('Error getting employees:', error);
      return [];
    }
  }

  async getEmployeeById(employeeId: string): Promise<Employee | null> {
    const employees = await this.getEmployees();
    return employees.find(emp => emp.id === employeeId) || null;
  }

  async addEmployee(employee: Omit<Employee, 'id'>): Promise<Employee> {
    try {
      const newEmployee: Employee = {
        ...employee,
        id: this.generateId(),
      };

      // Register employee with face recognition service
      try {
        const azurePersonId = await reactFaceRecognitionService.addPersonToGroup(
          newEmployee.id,
          newEmployee.name,
          newEmployee.photoUri
        );
        newEmployee.azurePersonId = azurePersonId;
      } catch (error) {
        console.warn('Failed to register employee with face recognition service:', error);
      }

      const employees = await this.getEmployeesFromStorage();
      employees.push(newEmployee);
      await this.saveEmployees(employees);

      return newEmployee;
    } catch (error) {
      console.error('Error adding employee:', error);
      throw error;
    }
  }

  async updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<void> {
    try {
      const employees = await this.getEmployeesFromStorage();
      const employeeIndex = employees.findIndex(emp => emp.id === employeeId);
      
      if (employeeIndex !== -1) {
        const updatedEmployee = { ...employees[employeeIndex], ...updates };
        
        // If photo is updated, re-register with face recognition service
        if (updates.photoUri && updates.photoUri !== employees[employeeIndex].photoUri) {
          try {
            const azurePersonId = await reactFaceRecognitionService.addPersonToGroup(
              employeeId,
              updatedEmployee.name,
              updatedEmployee.photoUri
            );
            updatedEmployee.azurePersonId = azurePersonId;
          } catch (error) {
            console.warn('Failed to update employee in face recognition service:', error);
          }
        }
        
        employees[employeeIndex] = updatedEmployee;
        await this.saveEmployees(employees);
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  // Enhanced Face Recognition with Real API
  async recognizeFace(photoUri: string): Promise<{
    recognized: boolean;
    confidence: number;
    workerId?: string;
    workerName?: string;
    matchedEmployee?: Employee;
  }> {
    try {
      // Use real face recognition service
      const searchResult = await reactFaceRecognitionService.searchPerson(photoUri);
      
      if (!searchResult.found || !searchResult.personId) {
        return {
          recognized: false,
          confidence: searchResult.confidence,
        };
      }

      // Find employee by Face++ face token
      const employees = await this.getEmployees();
      const matchedEmployee = employees.find(emp => emp.azurePersonId === searchResult.personId);
      
      if (!matchedEmployee) {
        return {
          recognized: false,
          confidence: searchResult.confidence,
        };
      }

      return {
        recognized: true,
        confidence: searchResult.confidence,
        workerId: matchedEmployee.id,
        workerName: matchedEmployee.name,
        matchedEmployee,
      };
    } catch (error) {
      console.error('Face recognition error:', error);
      return {
        recognized: false,
        confidence: 0,
      };
    }
  }

  // Enhanced attendance marking with real face verification
  async markAttendanceWithFaceVerification(
    photoUri: string,
    employeeId?: string
  ): Promise<{
    success: boolean;
    record?: AttendanceRecord;
    message: string;
    confidence?: number;
  }> {
    try {
      // Perform face recognition
      const recognition = await this.recognizeFace(photoUri);
      
      if (!recognition.recognized) {
        return {
          success: false,
          message: 'Face not recognized. Please ensure your face is clearly visible and try again.',
          confidence: recognition.confidence,
        };
      }

      // If employeeId is provided, verify it matches the recognized employee
      if (employeeId && recognition.workerId !== employeeId) {
        return {
          success: false,
          message: 'Face recognition mismatch. The recognized person does not match the expected employee.',
          confidence: recognition.confidence,
        };
      }

      const workerId = employeeId || recognition.workerId!;
      const workerName = recognition.workerName!;

      // Check if already checked in/out today
      const hasCheckedIn = await this.hasCheckedInToday(workerId);
      const hasCheckedOut = await this.hasCheckedOutToday(workerId);

      let attendanceType: 'check-in' | 'check-out';
      let message: string;

      if (!hasCheckedIn) {
        attendanceType = 'check-in';
        message = `Check-in successful for ${workerName}!`;
      } else if (!hasCheckedOut) {
        attendanceType = 'check-out';
        message = `Check-out successful for ${workerName}!`;
      } else {
        return {
          success: false,
          message: 'You have already completed both check-in and check-out for today.',
        };
      }

      // Create attendance record
      const record = await this.addAttendanceRecord({
        workerId,
        workerName,
        type: attendanceType,
        photoUri,
        status: 'pending',
        confidence: recognition.confidence,
      });

      return {
        success: true,
        record,
        message,
        confidence: recognition.confidence,
      };
    } catch (error) {
      console.error('Error marking attendance:', error);
      return {
        success: false,
        message: 'Failed to process attendance. Please try again.',
      };
    }
  }

  // Get all attendance records
  async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    try {
      const records = await this.getFromStorage();
      return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Error getting attendance records:', error);
      return [];
    }
  }

  // Get attendance records for a specific worker
  async getWorkerAttendance(workerId: string): Promise<AttendanceRecord[]> {
    const records = await this.getAttendanceRecords();
    return records.filter(record => record.workerId === workerId);
  }

  // Add new attendance record
  async addAttendanceRecord(record: Omit<AttendanceRecord, 'id' | 'timestamp'>): Promise<AttendanceRecord> {
    try {
      const newRecord: AttendanceRecord = {
        ...record,
        id: this.generateId(),
        timestamp: new Date(),
      };

      const records = await this.getFromStorage();
      records.push(newRecord);
      await this.saveToStorage(records);

      return newRecord;
    } catch (error) {
      console.error('Error adding attendance record:', error);
      throw error;
    }
  }

  // Update attendance record status
  async updateAttendanceStatus(recordId: string, status: 'pending' | 'verified' | 'rejected'): Promise<void> {
    try {
      const records = await this.getFromStorage();
      const recordIndex = records.findIndex(record => record.id === recordId);
      
      if (recordIndex !== -1) {
        records[recordIndex].status = status;
        await this.saveToStorage(records);
      }
    } catch (error) {
      console.error('Error updating attendance status:', error);
      throw error;
    }
  }

  // Get today's attendance for a worker
  async getTodayAttendance(workerId: string): Promise<AttendanceRecord[]> {
    const records = await this.getWorkerAttendance(workerId);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    return records.filter(record => {
      const recordDate = new Date(record.timestamp);
      return recordDate >= todayStart && recordDate < todayEnd;
    });
  }

  // Check if worker has already checked in today
  async hasCheckedInToday(workerId: string): Promise<boolean> {
    const todayRecords = await this.getTodayAttendance(workerId);
    return todayRecords.some(record => record.type === 'check-in');
  }

  // Check if worker has already checked out today
  async hasCheckedOutToday(workerId: string): Promise<boolean> {
    const todayRecords = await this.getTodayAttendance(workerId);
    return todayRecords.some(record => record.type === 'check-out');
  }

  // Get attendance statistics
  async getAttendanceStats(workerId?: string): Promise<{
    totalRecords: number;
    checkIns: number;
    checkOuts: number;
    verifiedRecords: number;
    pendingRecords: number;
  }> {
    const records = workerId 
      ? await this.getWorkerAttendance(workerId)
      : await this.getAttendanceRecords();

    return {
      totalRecords: records.length,
      checkIns: records.filter(r => r.type === 'check-in').length,
      checkOuts: records.filter(r => r.type === 'check-out').length,
      verifiedRecords: records.filter(r => r.status === 'verified').length,
      pendingRecords: records.filter(r => r.status === 'pending').length,
    };
  }

  // Private methods for storage
  private async getFromStorage(): Promise<AttendanceRecord[]> {
    if (!global.attendanceStorage) {
      global.attendanceStorage = [];
    }
    return global.attendanceStorage;
  }

  private async saveToStorage(records: AttendanceRecord[]): Promise<void> {
    global.attendanceStorage = records;
  }

  private async getEmployeesFromStorage(): Promise<Employee[]> {
    if (!global.employeesStorage) {
      global.employeesStorage = [];
    }
    return global.employeesStorage;
  }

  private async saveEmployees(employees: Employee[]): Promise<void> {
    global.employeesStorage = employees;
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}

export const attendanceService = new AttendanceService(); 