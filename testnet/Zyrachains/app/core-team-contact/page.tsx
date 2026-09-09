'use client';
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePageMetadata } from "@/context/pagemetadataContext";
import Image from 'next/image';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  description: string;
  image: string;
  expertise: string[];
  linkedin?: string;
  github?: string;
  twitter?: string;
}

const teamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Junman Pi',
    role: 'Founder CTO & Lead Developer & CEO',
    description: 'Visionary leader with 7+ years in blockchain technology and ecosystem development. Pios Contributor and developer on the Pi Blockchain.',
    image: '/influencers/cf.jpg',
    expertise: ['Blockchain Architecture', 'Financial Infrastruture','Ecosystem Strategy', 'Product Vision'],
    linkedin: 'https://linkedin.com/in/junmansam',
    twitter: 'https://twitter.com/junmansam'
  },
  // {
  //   id: '2',
  //   name: 'Abigial James',
  //   role: 'Head of Product',
  //   description: 'Product strategist focused on user experience and community engagement. Brings 6+ years of experience in fintech and blockchain product management with a passion for intuitive design.',
  //   image: '/influencers/jl.jpg',
  //   expertise: ['Product Strategy', 'Community Management'],
  //   linkedin: 'https://linkedin.com/in/abigialjames'
  // },
  // {
  //   id: '3',
  //   name: 'Deborah Essiet',
  //   role: 'Lead Frontend Developer',
  //   description: 'Frontend specialist with expertise in React, TypeScript, and modern web technologies. Creates seamless user experiences and responsive interfaces for blockchain applications.',
  //   image: '/influencers/jw.jpg',
  //   expertise: ['React', 'TypeScript', 'UI/UX Development'],
  //   github: 'https://github.com/emilywatson',
  //   linkedin: 'https://linkedin.com/in/emilywatson'
  // },
  // {
  //   id: '4',
  //   name: 'Ekemini Affia',
  //   role: 'Community Manager',
  //   description: 'Community builder and ecosystem strategist with deep understanding of Pi Network community dynamics. Manages partnerships, events, and community engagement initiatives.',
  //   image: '/influencers/fp.jpg',
  //   expertise: ['Community Building', 'Partnership Management', 'Event Planning'],
  //   linkedin: 'https://linkedin.com/in/ekemini',
  //   twitter: 'https://twitter.com/ekemini'
  // } 
];

const CoreTeamPage: React.FC = () => {
  const { setHeading, setTitle, setDescription } = usePageMetadata();

  React.useEffect(() => {
    setHeading('Our Team');
    setTitle('Team - Zyrachain');
    setDescription('Meet the developer and founding member behind Zyrachain - the premier Pi Network data center and tokenization platform.');
  }, [setHeading, setTitle, setDescription]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Our Team
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Meet the passionate developers and founding members who are building the future of the Pi Network ecosystem through Zyrachain.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamMembers.map((member) => (
            <Card key={member.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden">
                    <Image
                      src={member.image}
                      alt={`${member.name} - ${member.role}`}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-semibold text-foreground mb-1">
                    {member.name}
                  </h3>
                  <p className="text-primary font-medium mb-3">
                    {member.role}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {member.description}
                  </p>
                </div>

                {/* Expertise */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {member.expertise.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Social Links */}
                <div className="flex justify-center space-x-3">
                  {member.linkedin && (
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label={`${member.name} LinkedIn`}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </a>
                  )}
                  {member.github && (
                    <a
                      href={member.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label={`${member.name} GitHub`}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </a>
                  )}
                  {member.twitter && (
                    <a
                      href={member.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label={`${member.name} Twitter`}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mission Statement */}
        <div className="mt-20 text-center">
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                We are building the most comprehensive ecosystem hub for the Pi Network community. 
                Our team combines deep technical expertise with a passion for blockchain innovation, 
                creating tools and platforms that empower developers, businesses, and users to thrive 
                in the Pi Network ecosystem.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Values */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Innovation
            </h3>
            <p className="text-muted-foreground">
              Pushing the boundaries of what's possible in blockchain technology and ecosystem development.
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Community
            </h3>
            <p className="text-muted-foreground">
              Building tools and platforms that strengthen and grow the Pi Network community.
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Excellence
            </h3>
            <p className="text-muted-foreground">
              Delivering high-quality, reliable, and user-friendly solutions that exceed expectations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoreTeamPage; 