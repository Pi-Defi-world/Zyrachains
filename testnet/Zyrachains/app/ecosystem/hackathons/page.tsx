"use client";
import { useEffect, useState } from "react";
import { usePageMetadata } from "@/context/pagemetadataContext";
import { useLanguage } from "@/context/languagecontext";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Calendar, ExternalLink, MapPin, AlertTriangle, DollarSign, Clock, Award, Code, Lightbulb, Target, Gift } from "lucide-react";

// Define types for hackathons
interface Hackathon {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  prizePool: string;
  participants?: number;
  submissions?: number;
  link?: string;
  organizer?: string;
  theme?: string;
  winners?: string[];
  highlights?: string[];
}

// API endpoint for hackathons
const HACKATHONS_API_URL = '/api/ecosystem?type=hackathons';

export default function HackathonsPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const { setHeading, setTitle, setDescription } = usePageMetadata();
  const { t, language } = useLanguage();

  useEffect(() => {
    setHeading('Pi Network Hackathons');
    setTitle('Pi Network Hackathons | Build the Future');
    setDescription('Comprehensive overview of Pi Network hackathons - from the first #buildPi2gether to ongoing monthly challenges.');
  }, [setHeading, setTitle, setDescription, language]);

  useEffect(() => {
    loadHackathonsData();
  }, []);

  const loadHackathonsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(HACKATHONS_API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success && data.data) {
        setHackathons(data.data || []);
      } else {
        setHackathons([]);
      }
      
    } catch (err) {
      console.error('Error loading hackathons:', err);
      setError(`Failed to load hackathons data: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (dateString === 'Ongoing') return 'Ongoing';
    const date = new Date(dateString);
    return date.toLocaleDateString(language, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    if (endDate === 'Ongoing') return `${formatDate(startDate)} - Ongoing`;
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming': return <Clock className="w-5 h-5" />;
      case 'ongoing': return <Code className="w-5 h-5" />;
      case 'completed': return <Trophy className="w-5 h-5" />;
      default: return <Calendar className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400';
      case 'ongoing': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="white-zone">
        <div className="flex justify-center items-center py-12">
          <Spinner />
          <span className="ml-2 text-muted-foreground">Loading hackathons...</span>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="white-zone">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-lg flex items-start">
            <AlertTriangle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-1">Error Loading Hackathons</h3>
              <p className="text-sm">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={loadHackathonsData}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const upcomingHackathons = hackathons.filter(h => h.status === 'upcoming');
  const ongoingHackathons = hackathons.filter(h => h.status === 'ongoing');
  const completedHackathons = hackathons.filter(h => h.status === 'completed');
  const totalParticipants = hackathons.reduce((sum, h) => sum + (h.participants || 0), 0);
  const totalSubmissions = hackathons.reduce((sum, h) => sum + (h.submissions || 0), 0);
  const statuses = ['all', 'upcoming', 'ongoing', 'completed'];
  
  const filteredHackathons = selectedStatus === 'all' 
    ? hackathons 
    : hackathons.filter(h => h.status === selectedStatus);

  const sortedHackathons = [...filteredHackathons].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  return (
    <div className="white-zone">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            📅 Pi Network Hackathons Overview
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            From the first #buildPi2gether hackathon to ongoing monthly challenges - explore the complete history of Pi Network's developer competitions and innovation initiatives.
          </p>
        </div>

        {/* Summary Stats - Compact Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/10 dark:to-emerald-800/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{hackathons.length}</div>
            <div className="text-sm text-emerald-800 dark:text-emerald-300">Total Hackathons</div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/10 dark:to-green-800/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{ongoingHackathons.length}</div>
            <div className="text-sm text-green-800 dark:text-green-300">Ongoing</div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/10 dark:to-purple-800/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalParticipants.toLocaleString()}</div>
            <div className="text-sm text-purple-800 dark:text-purple-300">Participants</div>
          </div>
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/10 dark:to-orange-800/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{totalSubmissions.toLocaleString()}</div>
            <div className="text-sm text-orange-800 dark:text-orange-300">Submissions</div>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2 justify-center">
          {statuses.map((status) => (
            <Button
              key={status}
              variant={selectedStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus(status)}
              className="capitalize"
            >
              {status === 'all' ? 'All Hackathons' : status}
            </Button>
          ))}
        </div>

        {/* Hackathons Timeline */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-center mb-8">Hackathon Timeline</h2>
          
          <div className="relative max-w-4xl mx-auto">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border"></div>
            
            {sortedHackathons.map((hackathon, index) => (
              <div key={hackathon.id} className="relative flex items-start mb-8">
                {/* Timeline Dot */}
                <div className={`absolute left-6 w-4 h-4 rounded-full border-2 border-background ${
                  hackathon.status === 'ongoing' ? 'bg-green-500 dark:bg-green-400' : 
                  hackathon.status === 'upcoming' ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-gray-400 dark:bg-gray-500'
                } z-10`}></div>
                
                {/* Hackathon Content */}
                <div className="ml-16 w-full">
                  <div className="bg-gradient-to-r from-card/50 to-card/80 backdrop-blur-sm border border-border/50 rounded-lg p-6 hover:shadow-lg transition-all duration-200">
                    {/* Hackathon Header */}
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${getStatusColor(hackathon.status)}`}>
                            {getStatusIcon(hackathon.status)}
                          </div>
                          <h3 className="text-xl font-semibold text-foreground">{hackathon.title}</h3>
                        </div>
                        <p className="text-muted-foreground">{hackathon.description}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge className={getStatusColor(hackathon.status)}>
                          {hackathon.status}
                        </Badge>
                        {hackathon.theme && (
                          <Badge variant="outline" className="text-xs">
                            {hackathon.theme}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Hackathon Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDateRange(hackathon.startDate, hackathon.endDate)}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {hackathon.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        {hackathon.prizePool}
                      </div>
                      {hackathon.organizer && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {hackathon.organizer}
                        </div>
                      )}
                      {hackathon.participants && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {hackathon.participants.toLocaleString()} participants
                        </div>
                      )}
                      {hackathon.submissions && (
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4" />
                          {hackathon.submissions.toLocaleString()} submissions
                        </div>
                      )}
                    </div>

                    {/* Winners */}
                    {hackathon.winners && hackathon.winners.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                          Winners & Results
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {hackathon.winners.map((winner, idx) => (
                            <div key={`winner-${hackathon.id}-${idx}`} className="text-sm text-muted-foreground flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 dark:bg-yellow-400 mt-2 flex-shrink-0"></div>
                              {winner}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Highlights */}
                    {hackathon.highlights && hackathon.highlights.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-foreground mb-2">Key Highlights</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {hackathon.highlights.map((highlight, idx) => (
                            <div key={`highlight-${hackathon.id}-${idx}`} className="text-sm text-muted-foreground flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 mt-2 flex-shrink-0"></div>
                              {highlight}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Section */}
        <div className="bg-gradient-to-r from-emerald-50 to-purple-50 dark:from-emerald-900/20 dark:to-purple-900/20 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-6 text-center">Pi Hackathon Timeline</h2>
          <div className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              <strong>2021:</strong> First #buildPi2gether hackathon establishes foundation
            </div>
            <div className="text-center text-sm text-muted-foreground">
              <strong>2022:</strong> University partnerships with Harvard, Cornell, UC Berkeley
            </div>
            <div className="text-center text-sm text-muted-foreground">
              <strong>2023:</strong> Major Q1 hackathon (6,700 participants) + Monthly initiatives launched
            </div>
            <div className="text-center text-sm text-muted-foreground">
              <strong>2024:</strong> Community-driven PiFest focusing on commerce applications
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredHackathons.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">No Hackathons Found</h3>
            <p className="text-muted-foreground">Try adjusting your filter or check back for new hackathons!</p>
          </div>
        )}
      </div>
    </div>
  );
}