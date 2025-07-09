import axios from 'axios';
import * as FileSystem from 'expo-file-system';

export interface FaceDetectionResult {
  faceId?: string;
  faceRectangle?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  faceAttributes?: {
    age: number;
    gender: string;
    smile: number;
    glasses: string;
  };
}

export interface FaceComparisonResult {
  isIdentical: boolean;
  confidence: number;
  faceId1?: string;
  faceId2?: string;
}

export interface FaceRecognitionResult {
  detected: boolean;
  faceCount: number;
  confidence: number;
  faceId?: string;
  error?: string;
}

class FaceRecognitionService {
  private apiKey: string = ''; // Add your Face++ API key here
  private apiSecret: string = ''; // Add your Face++ API secret here
  private endpoint: string = 'https://api-us.faceplusplus.com/facepp/v3';
  private facesetToken: string = ''; // Face++ faceset token for storing employee faces

  constructor() {
    // In production, load these from environment variables
    this.apiKey = process.env.FACEPP_API_KEY || '';
    this.apiSecret = process.env.FACEPP_API_SECRET || '';
  }

  // Initialize the faceset for storing employee faces
  async initializeFaceset(): Promise<boolean> {
    try {
      if (!this.apiKey || !this.apiSecret) {
        console.warn('Face++ API credentials not configured. Using simulation mode.');
        return false;
      }

      // Create faceset if it doesn't exist
      await this.createFaceset();
      return true;
    } catch (error) {
      console.error('Failed to initialize faceset:', error);
      return false;
    }
  }

  // Create a faceset to store employee faces
  private async createFaceset(): Promise<void> {
    try {
      const response = await axios.post(
        `${this.endpoint}/faceset/create`,
        {
          api_key: this.apiKey,
          api_secret: this.apiSecret,
          outer_id: 'attendance-system-employees',
          display_name: 'Attendance System Employees',
        }
      );

      if (response.data.faceset_token) {
        this.facesetToken = response.data.faceset_token;
      }
    } catch (error: any) {
      if (error.response?.data?.error_message?.includes('already exists')) {
        // Faceset already exists, get its token
        await this.getFacesetToken();
      } else {
        throw error;
      }
    }
  }

  // Get faceset token if it already exists
  private async getFacesetToken(): Promise<void> {
    try {
      const response = await axios.post(
        `${this.endpoint}/faceset/getfacesets`,
        {
          api_key: this.apiKey,
          api_secret: this.apiSecret,
        }
      );

      const faceset = response.data.facesets?.find(
        (fs: any) => fs.outer_id === 'attendance-system-employees'
      );

      if (faceset) {
        this.facesetToken = faceset.faceset_token;
      }
    } catch (error) {
      console.error('Failed to get faceset token:', error);
    }
  }

  // Detect faces in an image
  async detectFaces(imageUri: string): Promise<FaceRecognitionResult> {
    try {
      if (!this.apiKey || !this.apiSecret) {
        return this.simulateFaceDetection();
      }

      // Convert image to base64
      const base64Image = await this.imageToBase64(imageUri);
      
      const formData = new FormData();
      formData.append('api_key', this.apiKey);
      formData.append('api_secret', this.apiSecret);
      formData.append('image_base64', base64Image);
      formData.append('return_attributes', 'age,gender,smile,glasses');

      const response = await axios.post(
        `${this.endpoint}/detect`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const faces = response.data.faces;
      
      if (!faces || faces.length === 0) {
        return {
          detected: false,
          faceCount: 0,
          confidence: 0,
          error: 'No face detected in the image',
        };
      }

      if (faces.length > 1) {
        return {
          detected: true,
          faceCount: faces.length,
          confidence: 0,
          error: 'Multiple faces detected. Please ensure only one face is visible.',
        };
      }

      return {
        detected: true,
        faceCount: 1,
        confidence: 0.9, // High confidence for single face detection
        faceId: faces[0].face_token,
      };
    } catch (error: any) {
      console.error('Face detection error:', error);
      return {
        detected: false,
        faceCount: 0,
        confidence: 0,
        error: error.response?.data?.error_message || 'Face detection failed',
      };
    }
  }

  // Add a person to the faceset
  async addPersonToGroup(personId: string, personName: string, imageUri: string): Promise<string> {
    try {
      if (!this.apiKey || !this.apiSecret) {
        return this.simulatePersonCreation(personId);
      }

      // Detect face first
      const detectionResult = await this.detectFaces(imageUri);
      if (!detectionResult.detected || !detectionResult.faceId) {
        throw new Error('No face detected in the image');
      }

      // Add face to faceset
      const formData = new FormData();
      formData.append('api_key', this.apiKey);
      formData.append('api_secret', this.apiSecret);
      formData.append('faceset_token', this.facesetToken);
      formData.append('face_tokens', detectionResult.faceId);

      await axios.post(
        `${this.endpoint}/faceset/addface`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Store person metadata (you could use a separate database for this)
      // For now, we'll return the face token as the person ID
      return detectionResult.faceId;
    } catch (error: any) {
      console.error('Add person error:', error);
      throw new Error(error.response?.data?.error_message || 'Failed to add person');
    }
  }

  // Search for a person in the faceset
  async searchPerson(imageUri: string): Promise<{
    found: boolean;
    personId?: string;
    confidence: number;
    error?: string;
  }> {
    try {
      if (!this.apiKey || !this.apiSecret) {
        return this.simulatePersonSearch();
      }

      // Detect face first
      const detectionResult = await this.detectFaces(imageUri);
      if (!detectionResult.detected || !detectionResult.faceId) {
        return {
          found: false,
          confidence: 0,
          error: 'No face detected in the image',
        };
      }

      // Search for the face in the faceset
      const formData = new FormData();
      formData.append('api_key', this.apiKey);
      formData.append('api_secret', this.apiSecret);
      formData.append('faceset_token', this.facesetToken);
      formData.append('face_token', detectionResult.faceId);

      const response = await axios.post(
        `${this.endpoint}/search`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const results = response.data.results;
      
      if (!results || results.length === 0) {
        return {
          found: false,
          confidence: 0,
          error: 'Person not found in database',
        };
      }

      const bestMatch = results[0];
      const confidence = bestMatch.confidence / 100; // Convert to 0-1 scale
      
      if (confidence < 0.6) { // 60% confidence threshold
        return {
          found: false,
          confidence,
          error: 'Confidence too low',
        };
      }

      return {
        found: true,
        personId: bestMatch.face_token,
        confidence,
      };
    } catch (error: any) {
      console.error('Person search error:', error);
      return {
        found: false,
        confidence: 0,
        error: error.response?.data?.error_message || 'Person search failed',
      };
    }
  }

  // Compare two faces
  async compareFaces(faceId1: string, faceId2: string): Promise<FaceComparisonResult> {
    try {
      if (!this.apiKey || !this.apiSecret) {
        return this.simulateFaceComparison();
      }

      const formData = new FormData();
      formData.append('api_key', this.apiKey);
      formData.append('api_secret', this.apiSecret);
      formData.append('face_token1', faceId1);
      formData.append('face_token2', faceId2);

      const response = await axios.post(
        `${this.endpoint}/compare`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const confidence = response.data.confidence / 100; // Convert to 0-1 scale
      
      return {
        isIdentical: confidence > 0.6, // 60% threshold
        confidence,
        faceId1: faceId1,
        faceId2: faceId2,
      };
    } catch (error: any) {
      console.error('Face comparison error:', error);
      return {
        isIdentical: false,
        confidence: 0,
        faceId1: faceId1,
        faceId2: faceId2,
      };
    }
  }

  // Convert image URI to base64
  private async imageToBase64(imageUri: string): Promise<string> {
    if (imageUri.startsWith('data:')) {
      return imageUri.split(',')[1]; // Remove data URL prefix
    }

    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error('Image to base64 conversion error:', error);
      throw new Error('Failed to convert image to base64');
    }
  }

  // Simulation methods for when API credentials are not available
  private simulateFaceDetection(): FaceRecognitionResult {
    const hasFace = Math.random() > 0.1;
    return {
      detected: hasFace,
      faceCount: hasFace ? 1 : 0,
      confidence: hasFace ? 0.85 + Math.random() * 0.1 : 0,
      faceId: hasFace ? `simulated_face_${Date.now()}` : undefined,
    };
  }

  private simulatePersonCreation(personId: string): string {
    return `simulated_person_${personId}`;
  }

  private simulatePersonSearch(): {
    found: boolean;
    personId?: string;
    confidence: number;
    error?: string;
  } {
    const isFound = Math.random() > 0.2;
    return {
      found: isFound,
      personId: isFound ? `simulated_person_${Math.floor(Math.random() * 3) + 1}` : undefined,
      confidence: isFound ? 0.7 + Math.random() * 0.25 : 0,
    };
  }

  private simulateFaceComparison(): FaceComparisonResult {
    const isIdentical = Math.random() > 0.3;
    return {
      isIdentical,
      confidence: isIdentical ? 0.8 + Math.random() * 0.15 : 0.3 + Math.random() * 0.4,
    };
  }

  // Legacy method for compatibility
  async identifyPerson(imageUri: string): Promise<{
    identified: boolean;
    personId?: string;
    confidence: number;
    error?: string;
  }> {
    const result = await this.searchPerson(imageUri);
    return {
      identified: result.found,
      personId: result.personId,
      confidence: result.confidence,
      error: result.error,
    };
  }

  // Legacy method for compatibility
  async initializePersonGroup(): Promise<boolean> {
    return this.initializeFaceset();
  }
}

export const faceRecognitionService = new FaceRecognitionService(); 