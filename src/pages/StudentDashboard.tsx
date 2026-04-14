import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { db, Job, Application, StudentProfile } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LogOut, User as UserIcon, Briefcase, FileText } from 'lucide-react';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form state
  const [skills, setSkills] = useState('');
  const [bio, setBio] = useState('');
  const [gpa, setGpa] = useState('');
  const [experience, setExperience] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [fetchedJobs, fetchedApps, fetchedProfile] = await Promise.all([
        db.getJobs(),
        db.getApplicationsForStudent(user.id),
        db.getProfile(user.id)
      ]);
      setJobs(fetchedJobs);
      setApplications(fetchedApps);
      setProfile(fetchedProfile);
      
      if (fetchedProfile) {
        setSkills(fetchedProfile.skills.join(', '));
        setBio(fetchedProfile.bio);
        setGpa(fetchedProfile.gpa.toString());
        setExperience(fetchedProfile.experience);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const newProfile: StudentProfile = {
      userId: user.id,
      skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      bio,
      gpa: parseFloat(gpa) || 0,
      experience,
      projects: profile?.projects || []
    };
    await db.saveProfile(newProfile);
    setProfile(newProfile);
    alert('Profile saved successfully!');
  };

  const handleApply = async (jobId: string) => {
    if (!user) return;
    if (!profile) {
      alert('Please complete your profile first!');
      return;
    }
    try {
      await db.applyForJob(jobId, user.id);
      await loadData(); // Reload to update applications list
      alert('Applied successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to apply');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <UserIcon className="text-white w-4 h-4" />
            </div>
            <h1 className="font-semibold text-zinc-900">Student Portal</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">{user?.name}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Tabs defaultValue="jobs" className="space-y-6">
          <TabsList className="bg-white border w-full justify-start h-12 px-2">
            <TabsTrigger value="jobs" className="data-[state=active]:bg-zinc-100">
              <Briefcase className="w-4 h-4 mr-2" />
              Available Jobs
            </TabsTrigger>
            <TabsTrigger value="applications" className="data-[state=active]:bg-zinc-100">
              <FileText className="w-4 h-4 mr-2" />
              My Applications
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-zinc-100">
              <UserIcon className="w-4 h-4 mr-2" />
              My Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map(job => {
                const hasApplied = applications.some(a => a.jobId === job.id);
                return (
                  <Card key={job.id} className="flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-lg">{job.title}</CardTitle>
                      <CardDescription className="text-zinc-600 font-medium">{job.company}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-sm text-zinc-500 mb-4 line-clamp-3">{job.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {job.requirements.map((req, i) => (
                          <Badge key={i} variant="secondary" className="bg-zinc-100 text-zinc-700">{req}</Badge>
                        ))}
                      </div>
                    </CardContent>
                    <div className="p-6 pt-0 mt-auto">
                      <Button 
                        className="w-full" 
                        variant={hasApplied ? "outline" : "default"}
                        disabled={hasApplied}
                        onClick={() => handleApply(job.id)}
                      >
                        {hasApplied ? 'Applied' : 'Apply Now'}
                      </Button>
                    </div>
                  </Card>
                );
              })}
              {jobs.length === 0 && (
                <div className="col-span-full text-center py-12 text-zinc-500">
                  No jobs available right now.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="applications">
            <div className="space-y-4">
              {applications.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-zinc-500">
                    You haven't applied to any jobs yet.
                  </CardContent>
                </Card>
              ) : (
                applications.map(app => {
                  const job = jobs.find(j => j.id === app.jobId);
                  return (
                    <Card key={app.id}>
                      <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-lg">{job?.title || 'Unknown Job'}</h3>
                          <p className="text-zinc-500">{job?.company || 'Unknown Company'}</p>
                          <p className="text-xs text-zinc-400 mt-1">Applied on {new Date(app.appliedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={
                            app.status === 'shortlisted' ? 'default' : 
                            app.status === 'rejected' ? 'destructive' : 'secondary'
                          } className="capitalize">
                            {app.status}
                          </Badge>
                          {app.feedback && (
                            <p className="text-sm text-zinc-600 max-w-md text-right italic">
                              "{app.feedback}"
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>
                  Complete your profile to help recruiters understand your potential beyond just your GPA.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio / Objective</Label>
                    <Textarea 
                      id="bio" 
                      placeholder="Tell us about your passions and what you're looking for..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gpa">GPA</Label>
                      <Input 
                        id="gpa" 
                        type="number" 
                        step="0.01" 
                        max="4.0"
                        placeholder="e.g. 3.8"
                        value={gpa}
                        onChange={(e) => setGpa(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="skills">Skills (comma separated)</Label>
                      <Input 
                        id="skills" 
                        placeholder="React, Python, Design..."
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience & Activities</Label>
                    <Textarea 
                      id="experience" 
                      placeholder="Internships, clubs, hackathons..."
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <Button type="submit">Save Profile</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
