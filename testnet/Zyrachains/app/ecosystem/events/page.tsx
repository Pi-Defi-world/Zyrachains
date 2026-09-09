"use client";
import { useEffect, useState } from "react";
import { usePageMetadata } from "@/context/pagemetadataContext";
import { useLanguage } from "@/context/languagecontext";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Clock, ExternalLink, MapPin, AlertTriangle, Trophy, Palette, GraduationCap, ShoppingBag, Mic, Gift } from "lucide-react";

// Define types for events
interface Event {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  location: string;
  type: 'upcoming' | 'past';
  category: 'launch' | 'hackathon' | 'community' | 'university' | 'celebration' | 'commerce' | 'conference';
  link?: string;
  organizer?: string;
  participants?: number;
  achievements?: string[];
  highlights?: string[];
}

// API endpoint for events
const EVENTS_API_URL = '/api/ecosystem?type=events';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { setHeading, setTitle, setDescription } = usePageMetadata();
  const { t, language } = useLanguage();

  useEffect(() => {
    setHeading('Pi Network Events');
    setTitle('Pi Network Events | Complete Event History');
    setDescription('Comprehensive timeline of Pi Network events - from Pi2Day launch to Consensus 2025.');
  }, [setHeading, setTitle, setDescription, language]);

  useEffect(() => {
    loadEventsData();
  }, []);

  const loadEventsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(EVENTS_API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success && data.data) {
        setEvents(data.data || []);
      } else {
        setEvents([]);
      }
      
    } catch (err) {
      console.error('Error loading events:', err);
      setError(`Failed to load events data: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatDateRange = (startDate: string, endDate?: string) => {
    if (!endDate) return formatDate(startDate);
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    return `${start} - ${end}`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'launch': return <Gift className="w-5 h-5" />;
      case 'hackathon': return <Trophy className="w-5 h-5" />;
      case 'community': return <Palette className="w-5 h-5" />;
      case 'university': return <GraduationCap className="w-5 h-5" />;
      case 'celebration': return <Calendar className="w-5 h-5" />;
      case 'commerce': return <ShoppingBag className="w-5 h-5" />;
      case 'conference': return <Mic className="w-5 h-5" />;
      default: return <Calendar className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'launch': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'hackathon': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'community': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400';
      case 'university': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400';
      case 'celebration': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'commerce': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400';
      case 'conference': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400';
      case 'past': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="white-zone">
        <div className="flex justify-center items-center py-12">
          <Spinner />
          <span className="ml-2 text-muted-foreground">Loading events...</span>
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
              <h3 className="font-semibold mb-1">Error Loading Events</h3>
              <p className="text-sm">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={loadEventsData}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const upcomingEvents = events.filter(event => event.type === 'upcoming');
  const pastEvents = events.filter(event => event.type === 'past');
  const totalParticipants = events.reduce((sum, event) => sum + (event.participants || 0), 0);
  const categories = ['all', ...Array.from(new Set(events.map(e => e.category)))];
  
  const filteredEvents = selectedCategory === 'all' 
    ? events 
    : events.filter(e => e.category === selectedCategory);

  const sortedEvents = [...filteredEvents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="white-zone">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            🎯 Key Pi Network Events
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            From Pi2Day launches to global conferences - explore the complete timeline of Pi Network's major events, celebrations, and community gatherings.
          </p>
        </div>

        {/* Summary Stats - Compact Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/10 dark:to-emerald-800/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{upcomingEvents.length}</div>
            <div className="text-sm text-emerald-800 dark:text-emerald-300">Upcoming</div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/10 dark:to-green-800/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{pastEvents.length}</div>
            <div className="text-sm text-green-800 dark:text-green-300">Historical</div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/10 dark:to-purple-800/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{events.length}</div>
            <div className="text-sm text-purple-800 dark:text-purple-300">Total Events</div>
          </div>
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/10 dark:to-orange-800/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{totalParticipants > 0 ? `${Math.round(totalParticipants / 1000)}k+` : '∞'}</div>
            <div className="text-sm text-orange-800 dark:text-orange-300">Participants</div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category === 'all' ? 'All Events' : category}
            </Button>
          ))}
        </div>

        {/* Events Timeline */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-center mb-8">Event Timeline</h2>
          
          <div className="relative max-w-4xl mx-auto">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border"></div>
            
            {sortedEvents.map((event, index) => (
              <div key={event.id} className="relative flex items-start mb-8">
                {/* Timeline Dot */}
                <div className={`absolute left-6 w-4 h-4 rounded-full border-2 border-background ${
                  event.type === 'upcoming' ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-gray-400 dark:bg-gray-500'
                } z-10`}></div>
                
                {/* Event Content */}
                <div className="ml-16 w-full">
                  <div className="bg-gradient-to-r from-card/50 to-card/80 backdrop-blur-sm border border-border/50 rounded-lg p-6 hover:shadow-lg transition-all duration-200">
                    {/* Event Header */}
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${getCategoryColor(event.category)}`}>
                            {getCategoryIcon(event.category)}
                          </div>
                          <h3 className="text-xl font-semibold text-foreground">{event.title}</h3>
                        </div>
                        <p className="text-muted-foreground">{event.description}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge className={getStatusColor(event.type)}>
                          {event.type}
                        </Badge>
                        <Badge className={getCategoryColor(event.category)}>
                          {event.category}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Event Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDateRange(event.date, event.endDate)}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </div>
                      {event.organizer && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {event.organizer}
                        </div>
                      )}
                      {event.participants && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {event.participants.toLocaleString()} participants
                        </div>
                      )}
                    </div>

                    {/* Achievements */}
                    {event.achievements && event.achievements.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                          Key Achievements
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {event.achievements.map((achievement, idx) => (
                            <div key={`achievement-${event.id}-${idx}`} className="text-sm text-muted-foreground flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 dark:bg-yellow-400 mt-2 flex-shrink-0"></div>
                              {achievement}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Highlights */}
                    {event.highlights && event.highlights.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-foreground mb-2">Event Highlights</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {event.highlights.map((highlight, idx) => (
                            <div key={`highlight-${event.id}-${idx}`} className="text-sm text-muted-foreground flex items-start gap-2">
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

        {/* Year Summary */}
        <div className="bg-gradient-to-r from-emerald-50 to-purple-50 dark:from-emerald-900/20 dark:to-purple-900/20 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-6 text-center">Pi Network Event Evolution</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">2021</div>
              <div className="text-sm text-muted-foreground">Platform launches & first hackathon</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">2022-2023</div>
              <div className="text-sm text-muted-foreground">University partnerships & Pi Day traditions</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-pink-600 dark:text-pink-400">2024</div>
              <div className="text-sm text-muted-foreground">Global commerce & KYC milestones</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">2025</div>
              <div className="text-sm text-muted-foreground">Open Network & industry recognition</div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">No Events Found</h3>
            <p className="text-muted-foreground">Try adjusting your filter or check back for new events!</p>
          </div>
        )}
      </div>
    </div>
  );
}