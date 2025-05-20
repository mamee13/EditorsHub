"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert" // Assuming you have this or similar

import { loadStripe } from '@stripe/stripe-js';

// Icons from lucide-react
import {
  Loader2, CheckCircle, XCircle, FileText, Image as ImageIcon, Video as VideoIcon, UploadCloud,
  CreditCard, PackageCheck, UserCheck, Users, DollarSign, CalendarDays, Zap, CircleAlert,
  FileDown, Ban, ArrowLeft, Briefcase, MessageSquare, Send, Paperclip, Eye, ListChecks, ThumbsUp
} from "lucide-react" // Added ThumbsUp

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const getFileNameFromUrl = (url: string): string => {
  try {
    const path = new URL(url).pathname;
    const parts = path.split('/');
    return decodeURIComponent(parts[parts.length - 1] || "untitled_file");
  } catch (e) {
    const parts = url.split('/');
    return parts[parts.length - 1] || "untitled_file";
  }
};

// Enhanced File Display Component
const FileDisplayItem = ({ fileUrl, fileName, isDownloadable = false }: { fileUrl: string, fileName?: string, isDownloadable?: boolean }) => {
  const name = fileName || getFileNameFromUrl(fileUrl);
  const extension = name.split('.').pop()?.toLowerCase() || "";

  let icon = <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-300" />;
  let fileTypePreview;

  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
    icon = <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 text-green-400" />;
    fileTypePreview = <img src={fileUrl} alt={name} className="w-full h-32 sm:h-40 object-cover rounded-t-lg" />;
  } else if (['mp4', 'webm', 'ogv', 'mov'].includes(extension)) {
    icon = <VideoIcon className="w-10 h-10 sm:w-12 sm:h-12 text-purple-400" />;
    fileTypePreview = (
      <video controls muted loop playsInline className="w-full h-32 sm:h-40 rounded-t-lg bg-black">
        <source src={fileUrl} type={`video/${extension}`} />
        Your browser does not support the video tag.
      </video>
    );
  }

  const content = (
    <>
      {fileTypePreview ? fileTypePreview : (
        <div className="w-full h-32 sm:h-40 bg-slate-700 rounded-t-lg flex items-center justify-center">
          {icon}
        </div>
      )}
      <div className="p-3">
        <p className="text-sm text-slate-200 truncate font-medium" title={name}>{name}</p>
        {isDownloadable && (
          <span className="text-xs text-indigo-400 mt-1 group-hover:text-indigo-200 transition-colors">
            Click to download
          </span>
        )}
      </div>
    </>
  );

  if (isDownloadable) {
    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        download={name}
        className="block bg-slate-800 rounded-lg shadow-lg hover:shadow-indigo-500/50 transition-all duration-300 transform hover:-translate-y-1 group"
      >
        {content}
      </a>
    );
  }

  return (
     <div className="bg-slate-800 rounded-lg shadow-lg group">
       {content}
        <div className="p-3 pt-0">
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:text-indigo-200 transition-colors">View Original</a>
        </div>
    </div>
  );
};

const JobStatusBadge = ({ status }: { status: string }) => {
  const statusText = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  let colorClasses = "bg-slate-600 text-slate-100";
  let IconComponent = CircleAlert;

  switch (status.toLowerCase()) {
    case 'open': colorClasses = 'bg-blue-500 text-white'; IconComponent = Eye; break;
    case 'assigned': colorClasses = 'bg-yellow-500 text-black'; IconComponent = UserCheck; break;
    case 'in_progress': colorClasses = 'bg-indigo-500 text-white'; IconComponent = ListChecks; break;
    case 'delivered': colorClasses = 'bg-purple-500 text-white'; IconComponent = PackageCheck; break;
    case 'paid': colorClasses = 'bg-green-500 text-white'; IconComponent = CheckCircle; break;
    case 'cancelled': colorClasses = 'bg-red-500 text-white'; IconComponent = Ban; break;
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs sm:text-sm font-semibold rounded-full shadow-sm ${colorClasses}`}>
      <IconComponent className="w-4 h-4" />
      {statusText}
    </span>
  );
};

export default function JobDetailsPage() {
  const router = useRouter()
  const { jobId } = useParams()
  const [job, setJob] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageError, setPageError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null)
  const [applicationMessage, setApplicationMessage] = useState("")
  const [isApplying, setIsApplying] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false); // Added for payment button

  const clearMessages = () => {
    setError(null);
    setMessage(null);
  }

  const fetchJobAndUser = async () => {
    clearMessages();
    setLoading(true); // Keep this for overall page load, individual actions have their own loaders
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const userResponse = await fetch('http://localhost:5000/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!userResponse.ok) {
        if(userResponse.status === 401) router.push("/login");
        throw new Error("Failed to fetch user data");
      }
      const userData = await userResponse.json();
      setUser(userData);

      const jobResponse = await fetch(`http://localhost:5000/api/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!jobResponse.ok) throw new Error("Failed to fetch job details");
      const jobData = await jobResponse.json();
      setJob(jobData);

      if (userData.role === 'client' && jobData.status === 'open') {
        await fetchApplicationsInternal(token);
      }

    } catch (err: any) {
      console.error("Error fetching initial data:", err);
      setPageError(err.message || "An error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationsInternal = async (token: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/jobs/${jobId}/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch applications");
      const applicationsData = await response.json();
      setApplications(applicationsData);
    } catch (error) {
      console.error("Error fetching applications:", error);
      setError("Could not load applications.");
    }
  }

  useEffect(() => {
    if (jobId) {
      fetchJobAndUser();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]); // Removed router from deps, typically not needed for this kind of fetch


  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    clearMessages();
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFiles(event.target.files);
    } else {
      setSelectedFiles(null);
    }
  };

  const handleSubmitWork = async () => {
    if (!selectedFiles) {
      setError("Please select files to submit.");
      return;
    }
    setIsSubmittingWork(true);
    clearMessages();

    try {
      const token = localStorage.getItem("token");
      if (!token) { router.push("/login"); return; }

      const formData = new FormData();
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('files', selectedFiles[i]);
      }

      const response = await fetch(`http://localhost:5000/api/jobs/${jobId}/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to submit files' }));
        throw new Error(errorData.message || 'Failed to submit files');
      }
      setMessage('Work submitted successfully! The client will be notified.');
      setSelectedFiles(null); // Clear selected files after successful submission
      await fetchJobAndUser(); 
    } catch (error: any) {
      setError(error.message || 'Error submitting files');
    } finally {
      setIsSubmittingWork(false);
    }
  };

  const handlePayment = async () => {
    setIsProcessingPayment(true); // Set loading state for payment button
    clearMessages();
    try {
      const token = localStorage.getItem("token");
      if (!token) { router.push("/login"); return; }

      const response = await fetch(`http://localhost:5000/api/jobs/${jobId}/payment`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to create payment session');
      const { sessionId } = await response.json();

      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe not loaded');

      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
      if (stripeError) throw stripeError;
      // Stripe redirects, so no need to refresh here, page will reload on return
    } catch (error: any) {
      setError(error.message || 'Error processing payment. Please try again.');
    } finally {
      setIsProcessingPayment(false); // Clear loading state
    }
  };

  const handleCancelJob = async () => {
    clearMessages();
    if (!window.confirm("Are you sure you want to cancel this job? This action might be irreversible.")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) { router.push("/login"); return; }

      const response = await fetch(`http://localhost:5000/api/jobs/${jobId}/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to cancel job');
      setMessage('Job cancelled successfully');
      await fetchJobAndUser(); 
    } catch (error: any) {
      setError(error.message || 'Error cancelling job');
    }
  };

  const handleAssignEditor = async (editorId: string) => {
    clearMessages();
    try {
      const token = localStorage.getItem("token");
      if (!token) { router.push("/login"); return; }

      const response = await fetch(`http://localhost:5000/api/jobs/${jobId}/assign`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ editorId }),
      });

      if (!response.ok) throw new Error("Failed to assign editor");
      setMessage("Editor assigned successfully!");
      await fetchJobAndUser(); 
    } catch (error: any) {
      console.error("Error assigning editor:", error);
      setError(error.message || "An error occurred while assigning the editor.");
    }
  };

  const handleApplyForJob = async () => {
    if (!applicationMessage.trim()) {
        setError("Please write an application message.");
        return;
    }
    setIsApplying(true);
    clearMessages();
    try {
      const token = localStorage.getItem("token");
      if (!token) { router.push("/login"); return; }

      const response = await fetch(`http://localhost:5000/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ message: applicationMessage }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({message: "Failed to submit application"}));
        throw new Error(errorData.message || "Failed to submit application");
      }
      setMessage("Application submitted successfully!");
      setApplicationMessage("");
      await fetchJobAndUser(); // Refresh job details to show updated application status or hide apply form
    } catch (error: any) {
      console.error("Error applying for job:", error);
      setError(error.message || "An error occurred while submitting your application.");
    } finally {
      setIsApplying(false);
    }
  };

  if (loading && !job) return (
    <div className="flex flex-col h-screen items-center justify-center text-slate-400 bg-slate-900">
      <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mb-4" />
      <p className="text-lg">Loading Job Details...</p>
    </div>
  );

  if (pageError) return (
    <div className="flex flex-col h-screen items-center justify-center text-red-400 bg-slate-900 p-4">
      <XCircle className="h-12 w-12 mb-4" />
      <p className="text-lg font-semibold">Failed to Load Job</p>
      <p className="text-center mb-4">{pageError}</p>
      <Button onClick={() => router.push("/dashboard/jobs")} variant="outline" className="text-indigo-300 border-indigo-500 hover:bg-indigo-500 hover:text-white">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs
      </Button>
    </div>
  );

  if (!job) return (
     <div className="flex flex-col h-screen items-center justify-center text-slate-400 bg-slate-900 p-4">
      <CircleAlert className="h-12 w-12 mb-4 text-yellow-400" />
      <p className="text-lg font-semibold">Job Not Found</p>
      <p className="text-center mb-4">The requested job could not be found or there was an unexpected issue.</p>
      <Button onClick={() => router.push("/dashboard/jobs")} variant="outline" className="text-indigo-300 border-indigo-500 hover:bg-indigo-500 hover:text-white">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs
      </Button>
    </div>
  );

  const isJobActive = !['paid', 'cancelled'].includes(job.status);
  const canClientCancel = user?.role === 'client' && ['open', 'assigned', 'in_progress'].includes(job.status);
  const canEditorCancel = user?.role === 'editor' && job.editor?._id === user?._id && job.status === 'assigned';
  // Has the current editor already applied?
  const hasEditorApplied = user?.role === 'editor' && job.applications?.some((app:any) => app.editorId._id === user._id);


  // Update the main container div
  return (
    <div className="min-h-screen bg-background py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Link 
          href="/dashboard/jobs" 
          className="mb-6 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Jobs
        </Link>
  
        {/* Update Card backgrounds */}
        <Card className="mb-8 bg-card border-border shadow-lg">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <CardTitle className="text-2xl sm:text-3xl font-bold">{job.title}</CardTitle>
              <JobStatusBadge status={job.status} />
            </div>
            {job.client?.profile?.name && (
              <CardDescription className="text-sm pt-1">
                Posted by: {job.client.profile.name}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Job Description</h3>
              <p className="whitespace-pre-wrap">{job.description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <DollarSign className="w-5 h-5 text-green-400" />
                <p><strong>Budget:</strong> ${job.budget?.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <CalendarDays className="w-5 h-5 text-red-400" />
                <p><strong>Deadline:</strong> {new Date(job.deadline).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <Zap className="w-5 h-5 text-yellow-400" />
                <p><strong>Delivery Speed:</strong> {job.deliverySpeed}</p>
              </div>
            </div>
            {job.initialFiles && job.initialFiles.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-indigo-300 mb-3">Initial Files</h3>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {job.initialFiles.map((fileUrl: string, index: number) => (
                    <FileDisplayItem key={index} fileUrl={fileUrl} />
                  ))}
                </div>
              </div>
            )}
            {job.editor && (
                <div className="mt-4 p-4 bg-slate-750 rounded-lg">
                    <h3 className="text-md font-semibold text-indigo-300 mb-1">Assigned Editor</h3>
                    <div className="flex items-center gap-3">
                        {job.editor.profile?.avatar && (
                            <img src={job.editor.profile.avatar} alt="Editor avatar" className="w-10 h-10 rounded-full border-2 border-indigo-500"/>
                        )}
                        <span className="text-slate-200">{job.editor.profile?.name || 'Editor Assigned'}</span>
                    </div>
                </div>
            )}
          </CardContent>
        </Card>

        {/* Editor: Apply for Job */}
        {user?.role === 'editor' && job.status === 'open' && !hasEditorApplied && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Send className="w-6 h-6" /> Apply for this Job
              </CardTitle>
              <CardDescription>Let the client know why you're a good fit.</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                className="w-full p-3 rounded-md mb-4 bg-background border focus:ring-2 focus:ring-ring"
                rows={4}
                placeholder="Write your application message here... (e.g., experience, approach)"
              />
              <Button
                onClick={handleApplyForJob}
                disabled={isApplying || !applicationMessage.trim()}
                className="w-full flex items-center justify-center gap-2"
              >
                {isApplying ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
                {isApplying ? "Submitting..." : "Submit Application"}
              </Button>
            </CardContent>
          </Card>
        )}

        {user?.role === 'client' && job.status === 'open' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Users className="w-6 h-6" /> Job Applications ({applications.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading && applications.length === 0 && (
                <div className="text-center py-4">
                  <Loader2 className="animate-spin inline-block mr-2"/>Loading applications...
                </div>
              )}
              {!loading && applications.length === 0 ? (
                <p className="text-center py-4">No applications received yet.</p>
              ) : (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div key={application._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-start gap-3 mb-3 sm:mb-0">
                        {application.editorId.profile?.avatar && (
                          <img
                            src={application.editorId.profile.avatar}
                            alt="Editor avatar"
                            className="w-10 h-10 rounded-full border-2"
                          />
                        )}
                        <div>
                          <h3 className="font-medium">{application.editorId.profile?.name || 'Unnamed Editor'}</h3>
                          <p className="mt-1 text-sm">{application.message}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleAssignEditor(application.editorId._id)}
                        className="w-full sm:w-auto flex items-center gap-2"
                      >
                        <UserCheck className="h-4 w-4" /> Select Editor
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Editor: Submit Work */}
        {user?.role === 'editor' && job.editor?._id === user?._id && (job.status === 'assigned' || job.status === 'in_progress') && (
          <Card className="mb-8 bg-slate-800 border-slate-700 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl text-indigo-300 flex items-center gap-2">
                <UploadCloud className="w-6 h-6" /> Submit Final Work
              </CardTitle>
              <CardDescription className="text-slate-400">Upload the completed files for the client to review and approve.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <label htmlFor="file-upload" className="block text-sm font-medium text-slate-300 mb-1">Select files to upload:</label>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleFileSelection}
                  className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600 cursor-pointer"
                />
              </div>
              {selectedFiles && selectedFiles.length > 0 && (
                <div className="mb-4 p-3 bg-slate-750 rounded-md">
                  <p className="text-sm font-medium text-slate-200 mb-1">Selected files ({selectedFiles.length}):</p>
                  <ul className="list-disc list-inside text-sm text-slate-300 space-y-0.5">
                    {Array.from(selectedFiles).map((file, index) => (
                      <li key={index} className="truncate" title={file.name}><Paperclip className="inline w-3 h-3 mr-1"/>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
              <Button
                onClick={handleSubmitWork}
                disabled={!selectedFiles || selectedFiles.length === 0 || isSubmittingWork}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center justify-center gap-2"
              >
                {isSubmittingWork ? <Loader2 className="animate-spin w-5 h-5" /> : <UploadCloud className="w-5 h-5" />}
                {isSubmittingWork ? 'Submitting...' : 'Submit Work'}
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Client: Review Delivered Work & Accept/Pay Button */}
        {user?.role === 'client' && job.status === 'delivered' && job.paymentStatus === 'pending' && (
          <>
            <Card className="mb-8 bg-slate-800 border-slate-700 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl text-purple-400 flex items-center gap-2">
                  <Eye className="w-6 h-6" /> Review Delivered Work
                </CardTitle>
                <CardDescription className="text-slate-400">The editor has submitted the following files for your review.</CardDescription>
              </CardHeader>
              <CardContent>
                {job.finalFiles && job.finalFiles.length > 0 ? (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {job.finalFiles.map((file: { url: string, name: string }, index: number) => (
                      <FileDisplayItem key={index} fileUrl={file.url} fileName={file.name} isDownloadable={false} />
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-4">The editor has marked the work as delivered. Files should appear here shortly. If not, please contact support or the editor.</p>
                )}
              </CardContent>
            </Card>

            <Card className="mb-8 bg-slate-800 border-slate-700 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl text-green-400 flex items-center gap-2">
                  <ThumbsUp className="w-6 h-6" /> Accept & Proceed to Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                 <p className="text-lg text-slate-300 mb-2">If you are satisfied with the delivered work:</p>
                 <p className="text-2xl font-bold text-slate-100 mb-4">Total: ${job.budget?.toFixed(2)}</p>
                <Button
                  onClick={handlePayment}
                  disabled={isProcessingPayment}
                  className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-150 ease-in-out flex items-center justify-center gap-2 text-base"
                >
                  {isProcessingPayment ? <Loader2 className="animate-spin w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                  {isProcessingPayment ? 'Processing...' : 'Accept & Pay'}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Client: Download Final Files (After Payment) */}
        {user?.role === 'client' && job.paymentStatus === 'paid' && job.finalFiles && job.finalFiles.length > 0 && (
          <Card className="mb-8 bg-slate-800 border-slate-700 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl text-indigo-300 flex items-center gap-2">
                <PackageCheck className="w-6 h-6" /> Download Your Files
              </CardTitle>
              <CardDescription className="text-slate-400">Payment confirmed. You can now download the final files.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {job.finalFiles.map((file: { url: string, name: string }, index: number) => (
                   <FileDisplayItem key={index} fileUrl={file.url} fileName={file.name} isDownloadable={true} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Assigned Editor: View Submitted Files (After Delivery/Payment) */}
        {user?.role === 'editor' && job.editor?._id === user?._id && (job.status === 'delivered' || job.status === 'paid') && job.finalFiles && job.finalFiles.length > 0 && (
            <Card className="mb-8 bg-slate-800 border-slate-700 shadow-xl">
                <CardHeader>
                <CardTitle className="text-xl text-indigo-300 flex items-center gap-2">
                    <ListChecks className="w-6 h-6" /> Your Submitted Files
                </CardTitle>
                <CardDescription className="text-slate-400">These are the files you submitted for this job.</CardDescription>
                </CardHeader>
                <CardContent>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {job.finalFiles.map((file: { url: string, name: string }, index: number) => (
                    <FileDisplayItem key={index} fileUrl={file.url} fileName={file.name} isDownloadable={false} /> 
                    ))}
                </div>
                </CardContent>
            </Card>
        )}


        {/* Cancel Job Button */}
        {(canClientCancel || canEditorCancel) && isJobActive && (
          <Card className="mb-8 bg-card border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-destructive flex items-center gap-2">
                <Ban className="w-6 h-6" /> Job Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleCancelJob}
                variant="destructive"
                className="w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <Ban className="w-5 h-5" /> Cancel Job
              </Button>
              <CardDescription className="text-muted-foreground mt-3 text-sm">
                {user?.role === 'client' 
                  ? "If you no longer need this job, you can cancel it (if applicable)." 
                  : "If you can no longer work on this job, you can request to cancel (if applicable)."}
              </CardDescription>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}