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
}

class AttendanceService {
  private storageKey = 'attendance_records';

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

  // Simulate face recognition (in a real app, this would call an API)
  async recognizeFace(photoUri: string): Promise<{
    recognized: boolean;
    confidence: number;
    workerId?: string;
    workerName?: string;
  }> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // For demo purposes, simulate 80% success rate
    const isRecognized = Math.random() > 0.2;
    
    if (isRecognized) {
      return {
        recognized: true,
        confidence: 0.85 + Math.random() * 0.1, // 85-95% confidence
        workerId: 'worker_001',
        workerName: 'John Doe',
      };
    } else {
      return {
        recognized: false,
        confidence: 0.3 + Math.random() * 0.4, // 30-70% confidence
      };
    }
  }

  // Private methods for storage
  private async getFromStorage(): Promise<AttendanceRecord[]> {
    // In a real app, this would use AsyncStorage or a database
    // For now, we'll use a simple in-memory storage
    if (!global.attendanceStorage) {
      global.attendanceStorage = [];
    }
    return global.attendanceStorage;
  }

  private async saveToStorage(records: AttendanceRecord[]): Promise<void> {
    // In a real app, this would use AsyncStorage or a database
    global.attendanceStorage = records;
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}

export const attendanceService = new AttendanceService(); 