export interface StudentProfile {
  userId: string;
  skills: string[];
  bio: string;
  gpa: number;
  projects: { title: string; description: string }[];
  experience: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  createdAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  studentId: string;
  status: 'pending' | 'shortlisted' | 'rejected';
  feedback?: string;
  appliedAt: string;
}

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class MockDB {
  private get<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private set<T>(key: string, data: T[]) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Profiles
  async getProfile(userId: string): Promise<StudentProfile | null> {
    await delay(300);
    const profiles = this.get<StudentProfile>('profiles');
    return profiles.find(p => p.userId === userId) || null;
  }

  async saveProfile(profile: StudentProfile): Promise<void> {
    await delay(300);
    const profiles = this.get<StudentProfile>('profiles');
    const index = profiles.findIndex(p => p.userId === profile.userId);
    if (index >= 0) {
      profiles[index] = profile;
    } else {
      profiles.push(profile);
    }
    this.set('profiles', profiles);
  }

  // Jobs
  async getJobs(): Promise<Job[]> {
    await delay(300);
    return this.get<Job>('jobs').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createJob(job: Omit<Job, 'id' | 'createdAt'>): Promise<Job> {
    await delay(300);
    const jobs = this.get<Job>('jobs');
    const newJob: Job = {
      ...job,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString()
    };
    jobs.push(newJob);
    this.set('jobs', jobs);
    return newJob;
  }

  // Applications
  async getApplicationsForStudent(studentId: string): Promise<Application[]> {
    await delay(300);
    return this.get<Application>('applications').filter(a => a.studentId === studentId);
  }

  async getApplicationsForJob(jobId: string): Promise<Application[]> {
    await delay(300);
    return this.get<Application>('applications').filter(a => a.jobId === jobId);
  }

  async applyForJob(jobId: string, studentId: string): Promise<Application> {
    await delay(300);
    const apps = this.get<Application>('applications');
    const existing = apps.find(a => a.jobId === jobId && a.studentId === studentId);
    if (existing) throw new Error('Already applied');

    const newApp: Application = {
      id: Math.random().toString(36).substring(2, 9),
      jobId,
      studentId,
      status: 'pending',
      appliedAt: new Date().toISOString()
    };
    apps.push(newApp);
    this.set('applications', apps);
    return newApp;
  }

  async updateApplicationStatus(id: string, status: Application['status'], feedback?: string): Promise<void> {
    await delay(300);
    const apps = this.get<Application>('applications');
    const index = apps.findIndex(a => a.id === id);
    if (index >= 0) {
      apps[index].status = status;
      if (feedback) apps[index].feedback = feedback;
      this.set('applications', apps);
    }
  }
}

export const db = new MockDB();

// Initialize some mock data if empty
if (!localStorage.getItem('jobs')) {
  db.createJob({
    title: 'Frontend Engineer',
    company: 'TechCorp',
    description: 'Looking for a skilled React developer to build modern web applications.',
    requirements: ['React', 'TypeScript', 'Tailwind CSS']
  });
  db.createJob({
    title: 'Data Scientist',
    company: 'DataWorks',
    description: 'Join our analytics team to build predictive models.',
    requirements: ['Python', 'Machine Learning', 'SQL']
  });
}
