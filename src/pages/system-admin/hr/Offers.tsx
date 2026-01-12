import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, FileText, Calendar, DollarSign, Send, CheckCircle,
  XCircle, Clock, Mail, Download, UserPlus, ArrowLeft
} from 'lucide-react';
import { useCandidateOffers, useSendOffer, useUpdateOffer, useUpdateApplication } from '@/hooks/useHRManagement';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { OnboardDialog } from '@/components/hr/onboarding/OnboardDialog';
import { CandidateOffer, JobApplication, JobPosting } from '@/types/hr';

type OfferWithApplication = CandidateOffer & { 
  application: JobApplication & { job: JobPosting } 
};

export default function Offers() {
  const { data: offers, isLoading } = useCandidateOffers();
  const sendOffer = useSendOffer();
  const updateOffer = useUpdateOffer();
  const updateApplication = useUpdateApplication();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sendConfirmOffer, setSendConfirmOffer] = useState<OfferWithApplication | null>(null);
  const [onboardCandidate, setOnboardCandidate] = useState<OfferWithApplication | null>(null);

  const filteredOffers = offers?.filter(offer => {
    const candidateName = offer.application?.candidate_name || '';
    const matchesSearch = 
      candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.job_title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || offer.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      sent: 'bg-blue-100 text-blue-700',
      accepted: 'bg-green-100 text-green-700',
      declined: 'bg-red-100 text-red-700',
      expired: 'bg-yellow-100 text-yellow-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const handleSendOffer = () => {
    if (sendConfirmOffer) {
      sendOffer.mutate({ 
        offerId: sendConfirmOffer.id, 
        applicationId: sendConfirmOffer.application_id 
      });
      setSendConfirmOffer(null);
    }
  };

  const handleAcceptOffer = (offer: OfferWithApplication) => {
    updateOffer.mutate({ 
      id: offer.id, 
      status: 'accepted', 
      responded_at: new Date().toISOString() 
    });
    updateApplication.mutate({ 
      id: offer.application_id, 
      status: 'offer_accepted' 
    });
  };

  const handleDeclineOffer = (offer: OfferWithApplication) => {
    updateOffer.mutate({ 
      id: offer.id, 
      status: 'declined', 
      responded_at: new Date().toISOString() 
    });
    updateApplication.mutate({ 
      id: offer.application_id, 
      status: 'offer_declined' 
    });
  };

  const openGmailWithOffer = (offer: OfferWithApplication) => {
    const candidate = offer.application;
    if (!candidate?.candidate_email) return;

    const subject = encodeURIComponent(`Offer Letter - ${offer.job_title} at Metasage Alliance`);
    const body = encodeURIComponent(`Dear ${candidate.candidate_name},

We are delighted to extend an offer for the position of ${offer.job_title} at Metasage Alliance.

Offer Details:
- Position: ${offer.job_title}
${offer.department ? `- Department: ${offer.department}` : ''}
- Annual Salary: ₹${offer.offered_salary?.toLocaleString()}
${offer.joining_date ? `- Start Date: ${format(new Date(offer.joining_date), 'MMMM dd, yyyy')}` : ''}
- Probation Period: ${offer.probation_period_months} months
${offer.benefits ? `\nBenefits:\n${offer.benefits}` : ''}

Please review the attached offer letter and confirm your acceptance by ${offer.expiry_date ? format(new Date(offer.expiry_date), 'MMMM dd, yyyy') : 'the specified date'}.

We look forward to welcoming you to our team!

Best regards,
HR Team
Metasage Alliance`);
    
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${candidate.candidate_email}&su=${subject}&body=${body}`, '_blank');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/system-admin/hr-management">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Offers</h1>
            <p className="text-muted-foreground">Manage candidate offers and onboarding</p>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Offers', value: offers?.length || 0, color: 'text-gray-600' },
            { label: 'Draft', value: offers?.filter(o => o.status === 'draft').length || 0, color: 'text-gray-600' },
            { label: 'Sent', value: offers?.filter(o => o.status === 'sent').length || 0, color: 'text-blue-600' },
            { label: 'Accepted', value: offers?.filter(o => o.status === 'accepted').length || 0, color: 'text-green-600' },
            { label: 'Declined', value: offers?.filter(o => o.status === 'declined').length || 0, color: 'text-red-600' },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by candidate or job title..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Offers List */}
        {isLoading ? (
          <div className="text-center py-12">Loading...</div>
        ) : filteredOffers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No offers found</h3>
              <p className="text-muted-foreground">Offers will appear here when you create them for selected candidates</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOffers.map((offer) => (
              <Card key={offer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{offer.application?.candidate_name}</h3>
                        <Badge className={getStatusColor(offer.status)}>
                          {offer.status}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          {offer.job_title}
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          ₹{offer.offered_salary?.toLocaleString()}
                        </span>
                        {offer.joining_date && (
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Joining: {format(new Date(offer.joining_date), 'MMM dd, yyyy')}
                          </span>
                        )}
                        {offer.expiry_date && (
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Expires: {format(new Date(offer.expiry_date), 'MMM dd, yyyy')}
                          </span>
                        )}
                      </div>

                      {offer.sent_at && (
                        <p className="text-xs text-muted-foreground">
                          Sent on {format(new Date(offer.sent_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {offer.status === 'draft' && (
                        <>
                          <Button 
                            size="sm"
                            onClick={() => setSendConfirmOffer(offer as OfferWithApplication)}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Send Offer
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openGmailWithOffer(offer as OfferWithApplication)}
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Email Preview
                          </Button>
                        </>
                      )}
                      {offer.status === 'sent' && (
                        <>
                          <Button 
                            size="sm"
                            variant="default"
                            onClick={() => handleAcceptOffer(offer as OfferWithApplication)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark Accepted
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-destructive"
                            onClick={() => handleDeclineOffer(offer as OfferWithApplication)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Mark Declined
                          </Button>
                        </>
                      )}
                      {offer.status === 'accepted' && (
                        <Button 
                          size="sm"
                          onClick={() => setOnboardCandidate(offer as OfferWithApplication)}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Onboard
                        </Button>
                      )}
                      {offer.offer_letter_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={offer.offer_letter_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Send Confirmation Dialog */}
      <AlertDialog open={!!sendConfirmOffer} onOpenChange={(open) => !open && setSendConfirmOffer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Offer Letter?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the offer as sent to {sendConfirmOffer?.application?.candidate_name}. 
              Make sure to send the actual offer letter via email.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendOffer}>
              Send Offer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Onboard Dialog */}
      <OnboardDialog 
        open={!!onboardCandidate}
        onOpenChange={(open) => !open && setOnboardCandidate(null)}
        offer={onboardCandidate}
      />
    </Layout>
  );
}
