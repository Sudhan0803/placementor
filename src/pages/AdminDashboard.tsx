import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { db, Job, Application, StudentProfile } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LogOut, Briefcase, Users, PlusCircle, CheckCircle, XCircle } from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [profiles, setProfiles] = useState<Record<string, StudentProfile>>({});
  const [loading, setLoading] = useState(true);

  // New Job Form
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');

  // Feedback Form
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const fetchedJobs = await db.getJobs();
      setJobs(fetchedJobs);
      
      // In a real app, we'd fetch applications per job or paginated.
      // For mock, we'll fetch all apps for all jobs.
      const allApps: Application[] = [];
      const profileMap: Record<string, StudentProfile> = {};
      
      for (const job of fetchedJobs) {
        const apps = await db.getApplicationsForJob(job.id);
        allApps.push(...apps);
        
        for (const app of apps) {
          if (!profileMap[app.studentId]) {
            const prof = await db.getProfile(app.studentId);
            if (prof) profileMap[app.studentId] = prof;
          }
        }
      }
      
      setApplications(allApps);
      setProfiles(profileMap);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.createJob({
        title,
        company,
        description,
        requirements: requirements.split(',').map(s => s.trim()).filter(Boolean)
      });
      setTitle('');
      setCompany('');
      setDescription('');
      setRequirements('');
      await loadData();
      alert('Job posted successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to post job');
    }
  };

  const handleUpdateStatus = async (appId: string, status: Application['status'], feedbackMsg?: string) => {
    try {
      await db.updateApplicationStatus(appId, status, feedbackMsg);
      await loadData();
    } catch (error) {
      console.error(error);
      alert('Failed to update status');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-zinc-900 text-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            <h1 className="font-semibold">Recruiter Portal</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">{user?.name}</span>
            <Button variant="ghost" size="sm" onClick={logout} className="text-zinc-300 hover:text-white hover:bg-zinc-800">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList className="bg-white border w-full justify-start h-12 px-2">
            <TabsTrigger value="applications" className="data-[state=active]:bg-zinc-100">
              <Users className="w-4 h-4 mr-2" />
              Review Applications
            </TabsTrigger>
            <TabsTrigger value="post-job" className="data-[state=active]:bg-zinc-100">
              <PlusCircle className="w-4 h-4 mr-2" />
              Post a Job
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applications">
            <div className="space-y-8">
              {jobs.map(job => {
                const jobApps = applications.filter(a => a.jobId === job.id);
                if (jobApps.length === 0) return null;
                
                return (
                  <div key={job.id} className="space-y-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      {job.title} <span className="text-zinc-400 text-sm font-normal">at {job.company}</span>
                      <Badge variant="secondary" className="ml-2">{jobApps.length} Applicants</Badge>
                    </h2>
                    <div className="grid gap-4">
                      {jobApps.map(app => {
                        const profile = profiles[app.studentId];
                        return (
                          <Card key={app.id} className="overflow-hidden">
                            <div className="flex flex-col md:flex-row border-b">
                              <div className="p-6 flex-1 bg-white">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <h3 className="font-semibold text-lg">{app.studentId.split('_')[0]}</h3>
                                    <p className="text-sm text-zinc-500">Applied {new Date(app.appliedAt).toLocaleDateString()}</p>
                                  </div>
                                  <Badge variant={
                                    app.status === 'shortlisted' ? 'default' : 
                                    app.status === 'rejected' ? 'destructive' : 'secondary'
                                  } className="capitalize">
                                    {app.status}
                                  </Badge>
                                </div>
                                
                                {profile ? (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="text-zinc-500 block">GPA</span>
                                        <span className="font-medium">{profile.gpa}</span>
                                      </div>
                                      <div>
                                        <span className="text-zinc-500 block">Skills</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {profile.skills.map(s => (
                                            <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-zinc-500 block text-sm mb-1">Bio</span>
                                      <p className="text-sm">{profile.bio}</p>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-zinc-500 italic">Profile not completed.</p>
                                )}
                              </div>
                              
                              <div className="p-6 bg-zinc-50 md:w-72 flex flex-col justify-center border-l gap-3">
                                {app.status === 'pending' ? (
                                  <>
                                    <Button 
                                      className="w-full bg-green-600 hover:bg-green-700"
                                      onClick={() => handleUpdateStatus(app.id, 'shortlisted', 'Congratulations! You have been shortlisted for the next round.')}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" /> Shortlist
                                    </Button>
                                    
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="destructive" className="w-full">
                                          <XCircle className="w-4 h-4 mr-2" /> Reject with Feedback
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Provide Feedback</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 pt-4">
                                          <div className="space-y-2">
                                            <Label>Why was this candidate rejected?</Label>
                                            <Textarea 
                                              placeholder="e.g., We are looking for more experience in React..."
                                              value={feedback}
                                              onChange={(e) => setFeedback(e.target.value)}
                                            />
                                            <p className="text-xs text-zinc-500">Constructive feedback helps students improve.</p>
                                          </div>
                                          <Button 
                                            variant="destructive" 
                                            className="w-full"
                                            onClick={() => {
                                              handleUpdateStatus(app.id, 'rejected', feedback);
                                              setFeedback('');
                                            }}
                                          >
                                            Confirm Rejection
                                          </Button>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  </>
                                ) : (
                                  <div className="text-center space-y-2">
                                    <p className="text-sm font-medium text-zinc-600">Decision Made</p>
                                    {app.feedback && (
                                      <p className="text-xs text-zinc-500 italic">"{app.feedback}"</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              
              {applications.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center text-zinc-500">
                    No applications received yet.
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="post-job">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Post a New Opportunity</CardTitle>
                <CardDescription>
                  Create a detailed job listing to attract the right candidates.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateJob} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Job Title</Label>
                      <Input 
                        id="title" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input 
                        id="company" 
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Job Description</Label>
                    <Textarea 
                      id="description" 
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requirements">Requirements (comma separated)</Label>
                    <Input 
                      id="requirements" 
                      placeholder="e.g. JavaScript, React, 3.0+ GPA"
                      value={requirements}
                      onChange={(e) => setRequirements(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">Post Job</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
